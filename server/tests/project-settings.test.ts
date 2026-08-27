import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { ProjectRole } from '@prisma/client';

describe('Day 24: Project Settings, Archiving & Soft-Delete Tests', { timeout: 30000 }, () => {
  const suffix = Date.now() + Math.random().toString(36).substring(2, 6);
  let workspaceId: string;
  let projectId: string;
  let adminUserId: string;
  let memberUserId: string;

  let adminToken: string;
  let memberToken: string;

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

    const admin = await registerUser(`admin_ps_${suffix}@test.local`, 'Admin User');
    const member = await registerUser(`member_ps_${suffix}@test.local`, 'Member User');

    adminUserId = admin.user.id;
    memberUserId = member.user.id;

    adminToken = admin.token;
    memberToken = member.token;

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
        name: `Settings Proj ${suffix}`,
        key: `SET${suffix.substring(0, 3).toUpperCase()}`,
        description: 'Test project for settings',
      });
    projectId = projRes.body.data.id;

    // 4. Add Member (role = MEMBER)
    await prisma.projectMember.create({
      data: { projectId, userId: memberUserId, role: ProjectRole.MEMBER },
    });
  }, 60000);

  afterAll(async () => {
    await prisma.project.delete({ where: { id: projectId } }).catch(() => {});
    await prisma.user.deleteMany({
      where: {
        id: { in: [adminUserId, memberUserId] },
      },
    }).catch(() => {});
    await prisma.$disconnect().catch(() => {});
  }, 60000);

  it('should update project name and description by Project Admin (Day 24)', async () => {
    const res = await request(app)
      .patch(`/api/v1/projects/${projectId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Renamed Project ${suffix}`,
        description: 'Updated settings description',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe(`Renamed Project ${suffix}`);
    expect(res.body.data.description).toBe('Updated settings description');
  });

  it('should reject project settings update from project MEMBER with 403 (Day 24)', async () => {
    const res = await request(app)
      .patch(`/api/v1/projects/${projectId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        name: 'Hacked Project Name',
      });

    expect(res.status).toBe(403);
  });

  it('should archive project by Project Admin (Day 24)', async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/archive`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe('Project archived successfully');
    expect(res.body.data.archivedAt).toBeDefined();
  });

  it('should unarchive project by Project Admin (Day 24)', async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/unarchive`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe('Project unarchived successfully');
  });

  it('should soft-delete project by Project Admin (Day 24)', async () => {
    const res = await request(app)
      .delete(`/api/v1/projects/${projectId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe('Project deleted successfully');

    // Subsequent list should not include deleted project
    const listRes = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${adminToken}`);
    const found = listRes.body.data.find((p: any) => p.id === projectId);
    expect(found).toBeUndefined();
  });
});
