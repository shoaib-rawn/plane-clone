import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { ProjectRole, StateGroup, IssuePriority } from '@prisma/client';

describe('Week 4: Issue Management & Filtering Integration Tests (Days 16-19)', { timeout: 30000 }, () => {
  const suffix = Date.now() + Math.random().toString(36).substring(2, 6);
  let workspaceId: string;
  let projectId: string;
  let adminUserId: string;
  let memberUserId: string;
  let viewerUserId: string;
  let unassignedUserId: string;

  let adminToken: string;
  let memberToken: string;
  let viewerToken: string;
  let unassignedToken: string;

  let todoStateId: string;
  let inProgressStateId: string;
  let doneStateId: string;

  let testIssueId: string;

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
      return { token: res.body.data.token, user: res.body.data.user };
    };

    const admin = await registerUser(`admin_m_${suffix}@test.local`, 'Admin User');
    const member = await registerUser(`member_m_${suffix}@test.local`, 'Member User');
    const viewer = await registerUser(`viewer_m_${suffix}@test.local`, 'Viewer User');
    const unassigned = await registerUser(`other_m_${suffix}@test.local`, 'Other User');

    adminUserId = admin.user.id;
    memberUserId = member.user.id;
    viewerUserId = viewer.user.id;
    unassignedUserId = unassigned.user.id;

    adminToken = admin.token;
    memberToken = member.token;
    viewerToken = viewer.token;
    unassignedToken = unassigned.token;

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
        name: `Management Proj ${suffix}`,
        key: `MGT${suffix.substring(0, 3).toUpperCase()}`,
        description: 'Test project for issue management',
      });
    projectId = projRes.body.data.id;

    // 4. Add Member and Viewer to project
    await prisma.projectMember.createMany({
      data: [
        { projectId, userId: memberUserId, role: ProjectRole.MEMBER },
        { projectId, userId: viewerUserId, role: ProjectRole.VIEWER },
      ],
    });

    // 5. Get states
    const states = await prisma.issueState.findMany({
      where: { projectId },
      orderBy: { position: 'asc' },
    });
    todoStateId = states.find((s) => s.name === 'Todo')!.id;
    inProgressStateId = states.find((s) => s.name === 'In Progress')!.id;
    doneStateId = states.find((s) => s.name === 'Done')!.id;

    // 6. Create Initial Test Issue
    const issueRes = await request(app)
      .post(`/api/v1/projects/${projectId}/issues`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        title: 'Initial Management Issue',
        description: 'Testing issue management flow',
        stateId: todoStateId,
        priority: IssuePriority.HIGH,
        assigneeId: memberUserId,
      });
    testIssueId = issueRes.body.data.id;
  }, 60000);

  afterAll(async () => {
    await prisma.project.delete({ where: { id: projectId } }).catch(() => {});
    await prisma.user.deleteMany({
      where: {
        id: { in: [adminUserId, memberUserId, viewerUserId, unassignedUserId] },
      },
    }).catch(() => {});
    await prisma.$disconnect().catch(() => {});
  }, 60000);

  // Day 16 Tests: GET & PATCH /api/v1/issues/:issueId
  describe('Day 16: Issue Details and Updates', () => {
    it('should get issue details by issueId (Day 16)', async () => {
      const res = await request(app)
        .get(`/api/v1/issues/${testIssueId}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(testIssueId);
      expect(res.body.data.key).toBeDefined();
      expect(res.body.data.title).toBe('Initial Management Issue');
      expect(res.body.data.assignee.id).toBe(memberUserId);
      expect(res.body.data.project.id).toBe(projectId);
    });

    it('should allow project VIEWERS to view issue details (Day 16)', async () => {
      const res = await request(app)
        .get(`/api/v1/issues/${testIssueId}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(testIssueId);
    });

    it('should return 404 for unassociated users viewing issue (Day 16 / Chapter 5.4)', async () => {
      const res = await request(app)
        .get(`/api/v1/issues/${testIssueId}`)
        .set('Authorization', `Bearer ${unassignedToken}`);

      expect(res.status).toBe(404);
    });

    it('should update title, priority, and description (Day 16)', async () => {
      const res = await request(app)
        .patch(`/api/v1/issues/${testIssueId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: 'Updated Issue Title',
          description: 'Updated Description Content',
          priority: IssuePriority.URGENT,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated Issue Title');
      expect(res.body.data.priority).toBe(IssuePriority.URGENT);
      expect(res.body.data.description).toBe('Updated Description Content');
    });

    it('should set completedAt when transitioning to Done state (Day 16)', async () => {
      const res = await request(app)
        .patch(`/api/v1/issues/${testIssueId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          stateId: doneStateId,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.stateId).toBe(doneStateId);
      expect(res.body.data.completedAt).toBeDefined();
      expect(res.body.data.completedAt).not.toBeNull();
    });

    it('should clear completedAt when transitioning away from Done state (Day 16)', async () => {
      const res = await request(app)
        .patch(`/api/v1/issues/${testIssueId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          stateId: inProgressStateId,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.stateId).toBe(inProgressStateId);
      expect(res.body.data.completedAt).toBeNull();
    });

    it('should reject invalid assignee not in project with 422 (Day 16)', async () => {
      const res = await request(app)
        .patch(`/api/v1/issues/${testIssueId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          assigneeId: unassignedUserId,
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('INVALID_ASSIGNEE');
    });

    it('should reject updates from VIEWERS with 403 (Day 16)', async () => {
      const res = await request(app)
        .patch(`/api/v1/issues/${testIssueId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          title: 'Hacked Title',
        });

      expect(res.status).toBe(403);
    });
  });

  // Day 19 Tests: Multi-field Filtering & Sorting
  describe('Day 19: Issues Filtering and Sorting', () => {
    it('should filter issues by stateId and priority (Day 19)', async () => {
      // Create an issue matching filter criteria
      await request(app)
        .post(`/api/v1/projects/${projectId}/issues`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: 'Filter Match Issue',
          stateId: inProgressStateId,
          priority: IssuePriority.URGENT,
          assigneeId: memberUserId,
        });

      const res = await request(app)
        .get(`/api/v1/projects/${projectId}/issues?stateId=${inProgressStateId}&priority=URGENT`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      const matched = res.body.data.find((i: any) => i.title === 'Filter Match Issue');
      expect(matched).toBeDefined();
      expect(matched.stateId).toBe(inProgressStateId);
      expect(matched.priority).toBe(IssuePriority.URGENT);
    });

    it('should filter issues by assigneeId (Day 19)', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${projectId}/issues?assigneeId=${memberUserId}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].assignee.id).toBe(memberUserId);
    });
  });

  // Day 17 Tests: Soft Delete
  describe('Day 17: Issue Soft Delete', () => {
    it('should reject delete from VIEWERS with 403 (Day 17)', async () => {
      const res = await request(app)
        .delete(`/api/v1/issues/${testIssueId}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(403);
    });

    it('should soft delete issue successfully (Day 17)', async () => {
      const res = await request(app)
        .delete(`/api/v1/issues/${testIssueId}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('Issue deleted successfully');

      // Subsequent GET should return 404
      const getRes = await request(app)
        .get(`/api/v1/issues/${testIssueId}`)
        .set('Authorization', `Bearer ${memberToken}`);
      expect(getRes.status).toBe(404);
    });
  });
});
