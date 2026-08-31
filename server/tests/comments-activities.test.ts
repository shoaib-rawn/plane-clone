import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { ProjectRole, IssuePriority } from '@prisma/client';

describe('Day 22 & 23: Comments & Activity Tracking Tests', { timeout: 30000 }, () => {
  const suffix = Date.now() + Math.random().toString(36).substring(2, 6);
  let workspaceId: string;
  let projectId: string;
  let adminUserId: string;
  let memberUserId: string;
  let viewerUserId: string;

  let adminToken: string;
  let memberToken: string;
  let viewerToken: string;

  let testIssueId: string;
  let createdCommentId: string;

  beforeAll(async () => {
    // 1. Setup workspace
    const workspace = await prisma.workspace.upsert({
      where: { slug: 'acme' },
      update: {},
      create: { name: 'Acme Corp', slug: 'acme' },
    });
    workspaceId = workspace.id;

    // 2. Register users
    const registerUser = async (email: string, name: string) => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email, password: 'Password123!', displayName: name });
      const cookie = res.headers['set-cookie']?.[0] || '';
      const tokenMatch = cookie.match(/token=([^;]+)/);
      const token = tokenMatch ? tokenMatch[1] : '';
      return { token, user: res.body.data.user };
    };

    const admin = await registerUser(`admin_ca_${suffix}@test.local`, 'Admin User');
    const member = await registerUser(`member_ca_${suffix}@test.local`, 'Member User');
    const viewer = await registerUser(`viewer_ca_${suffix}@test.local`, 'Viewer User');

    adminUserId = admin.user.id;
    memberUserId = member.user.id;
    viewerUserId = viewer.user.id;

    adminToken = admin.token;
    memberToken = member.token;
    viewerToken = viewer.token;

    // Make admin user a workspace ADMIN
    await prisma.workspaceMember.update({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: adminUserId,
        },
      },
      data: {
        role: 'ADMIN',
      },
    });

    // 3. Create Project
    const projRes = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Comments Proj ${suffix}`,
        key: `CMP${suffix.substring(0, 3).toUpperCase()}`,
        description: 'Test project for comments and activities',
      });
    projectId = projRes.body.data.id;

    // 4. Add Member and Viewer to project
    await prisma.projectMember.createMany({
      data: [
        { projectId, userId: memberUserId, role: ProjectRole.MEMBER },
        { projectId, userId: viewerUserId, role: ProjectRole.VIEWER },
      ],
    });

    // 5. Create Test Issue
    const issueRes = await request(app)
      .post(`/api/v1/projects/${projectId}/issues`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        title: 'Comment Testing Issue',
        priority: IssuePriority.HIGH,
      });
    testIssueId = issueRes.body.data.id;
  }, 60000);

  afterAll(async () => {
    await prisma.project.delete({ where: { id: projectId } }).catch(() => {});
    await prisma.user.deleteMany({
      where: {
        id: { in: [adminUserId, memberUserId, viewerUserId] },
      },
    }).catch(() => {});
    await prisma.$disconnect().catch(() => {});
  }, 60000);

  // Day 22: Comments CRUD Tests
  describe('Day 22: Comments API', () => {
    it('should add a comment to an issue (Day 22)', async () => {
      const res = await request(app)
        .post(`/api/v1/issues/${testIssueId}/comments`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          body: 'This is a test comment by member.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.body).toBe('This is a test comment by member.');
      expect(res.body.data.author.id).toBe(memberUserId);

      createdCommentId = res.body.data.id;
    });

    it('should list comments for an issue (Day 22)', async () => {
      const res = await request(app)
        .get(`/api/v1/issues/${testIssueId}/comments`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].body).toBe('This is a test comment by member.');
    });

    it('should reject comment creation from VIEWERS with 403 (Day 22)', async () => {
      const res = await request(app)
        .post(`/api/v1/issues/${testIssueId}/comments`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          body: 'Viewer comment attempt',
        });

      expect(res.status).toBe(403);
    });

    it('should update a comment by author (Day 22)', async () => {
      const res = await request(app)
        .patch(`/api/v1/issues/${testIssueId}/comments/${createdCommentId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          body: 'Updated comment text by author.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.body).toBe('Updated comment text by author.');
      expect(res.body.data.editedAt).toBeDefined();
    });

    it('should soft delete a comment (Day 22)', async () => {
      const res = await request(app)
        .delete(`/api/v1/issues/${testIssueId}/comments/${createdCommentId}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('Comment deleted successfully');

      // Subsequent list should not include deleted comment
      const listRes = await request(app)
        .get(`/api/v1/issues/${testIssueId}/comments`)
        .set('Authorization', `Bearer ${memberToken}`);
      const found = listRes.body.data.find((c: any) => c.id === createdCommentId);
      expect(found).toBeUndefined();
    });
  });

  // Day 23: Activity Timeline Stream Tests
  describe('Day 23: Issue Activity Tracking', () => {
    it('should stream activity history including issue creation and comment activities (Day 23)', async () => {
      const res = await request(app)
        .get(`/api/v1/issues/${testIssueId}/activities`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);

      const verbs = res.body.data.map((a: any) => a.verb);
      expect(verbs).toContain('created');
      expect(verbs).toContain('commented');
    });
  });
});
