import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import bcrypt from 'bcrypt';
import { generateToken } from '../src/lib/auth.js';
import { DEFAULT_STATES } from '../src/lib/defaultStates.js';
import { ProjectRole } from '@prisma/client';

describe('Issue (Ticket) Creation Integration Tests', () => {
  let workspaceId: string;
  let projectId: string;
  let defaultStateId: string;
  let anotherStateId: string;

  // Tokens
  let wsAdminToken: string;
  let projAdminToken: string;
  let projMemberToken: string;
  let projViewerToken: string;
  let nonMemberToken: string;

  // User objects
  let wsAdminUser: any;
  let projAdminUser: any;
  let projMemberUser: any;
  let projViewerUser: any;
  let nonMemberUser: any;

  beforeAll(async () => {
    const suffix = Date.now() + Math.random().toString(36).substring(2, 7);
    const hash = await bcrypt.hash('Password123!', 10);

    // 1. Create Workspace
    const workspace = await prisma.workspace.create({
      data: {
        name: `Test WS ${suffix}`,
        slug: `slug-${suffix}`,
      },
    });
    workspaceId = workspace.id;

    // Helper to create users & workspace membership
    const createUser = async (email: string, displayName: string, wsRole: 'ADMIN' | 'MEMBER') => {
      const user = await prisma.user.create({
        data: {
          email,
          displayName,
          passwordHash: hash,
        },
      });
      await prisma.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: user.id,
          role: wsRole,
        },
      });
      return { user, token: generateToken(user.id) };
    };

    // 2. Create Users
    const uAdmin = await createUser(`admin-${suffix}@test.local`, 'WS Admin', 'ADMIN');
    wsAdminUser = uAdmin.user;
    wsAdminToken = uAdmin.token;

    const uProjAdmin = await createUser(`sara-${suffix}@test.local`, 'Sara Admin', 'MEMBER');
    projAdminUser = uProjAdmin.user;
    projAdminToken = uProjAdmin.token;

    const uProjMember = await createUser(`bilal-${suffix}@test.local`, 'Bilal Member', 'MEMBER');
    projMemberUser = uProjMember.user;
    projMemberToken = uProjMember.token;

    const uProjViewer = await createUser(`client-${suffix}@test.local`, 'Client Viewer', 'MEMBER');
    projViewerUser = uProjViewer.user;
    projViewerToken = uProjViewer.token;

    const uNonMember = await createUser(`ayesha-${suffix}@test.local`, 'Ayesha NonMember', 'MEMBER');
    nonMemberUser = uNonMember.user;
    nonMemberToken = uNonMember.token;

    // 3. Create Project
    const project = await prisma.project.create({
      data: {
        workspaceId,
        name: `Test Project ${suffix}`,
        key: `TEST`,
        createdById: wsAdminUser.id,
      },
    });
    projectId = project.id;

    // 4. Create Project States
    for (const state of DEFAULT_STATES) {
      const createdState = await prisma.issueState.create({
        data: {
          projectId,
          name: state.name,
          group: state.group,
          colour: state.colour,
          position: state.position,
        },
      });
      if (state.name === 'Todo') {
        defaultStateId = createdState.id;
      } else if (state.name === 'In Progress') {
        anotherStateId = createdState.id;
      }
    }

    // Update project with defaultStateId
    await prisma.project.update({
      where: { id: projectId },
      data: { defaultStateId },
    });

    // 5. Create Project Memberships
    await prisma.projectMember.create({
      data: { projectId, userId: projAdminUser.id, role: ProjectRole.ADMIN },
    });
    await prisma.projectMember.create({
      data: { projectId, userId: projMemberUser.id, role: ProjectRole.MEMBER },
    });
    await prisma.projectMember.create({
      data: { projectId, userId: projViewerUser.id, role: ProjectRole.VIEWER },
    });
  });

  afterAll(async () => {
    // Cleanup generated data
    await prisma.workspace.delete({ where: { id: workspaceId } }).catch(() => {});
    await prisma.user.deleteMany({
      where: {
        id: {
          in: [wsAdminUser.id, projAdminUser.id, projMemberUser.id, projViewerUser.id, nonMemberUser.id],
        },
      },
    }).catch(() => {});
  });

  it('should successfully create an issue with default state and no assignee', async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/issues`)
      .set('Authorization', `Bearer ${projMemberToken}`)
      .send({
        title: 'Test issue default',
        description: 'Testing default state assignment',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.title).toBe('Test issue default');
    expect(res.body.data.stateId).toBe(defaultStateId);
    expect(res.body.data.sequenceId).toBe(1);
    expect(res.body.data.key).toBe('TEST-1');
    expect(res.body.data.createdBy.id).toBe(projMemberUser.id);
  });

  it('should successfully create an issue with a custom state and assignee', async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/issues`)
      .set('Authorization', `Bearer ${projAdminToken}`)
      .send({
        title: 'Test issue custom',
        stateId: anotherStateId,
        assigneeId: projMemberUser.id,
        priority: 'HIGH',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Test issue custom');
    expect(res.body.data.stateId).toBe(anotherStateId);
    expect(res.body.data.assigneeId).toBe(projMemberUser.id);
    expect(res.body.data.priority).toBe('HIGH');
    expect(res.body.data.sequenceId).toBe(2);
    expect(res.body.data.key).toBe('TEST-2');
  });

  it('should throw validation error (422) if state does not belong to the project', async () => {
    const dummyStateId = '00000000-0000-0000-0000-000000000000'; // Invalid UUID state

    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/issues`)
      .set('Authorization', `Bearer ${projMemberToken}`)
      .send({
        title: 'Invalid State Issue',
        stateId: dummyStateId,
      });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should throw validation error (422) if assignee is not a member of the project', async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/issues`)
      .set('Authorization', `Bearer ${projMemberToken}`)
      .send({
        title: 'Invalid Assignee Issue',
        assigneeId: nonMemberUser.id,
      });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 404 (Not Found) if user is not associated with the project (Chapter 5.4)', async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/issues`)
      .set('Authorization', `Bearer ${nonMemberToken}`)
      .send({
        title: 'Non-member Ticket',
      });

    expect(res.status).toBe(404);
  });

  it('should return 403 (Forbidden) if user is a VIEWER (Chapters 5.2/5.3)', async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${projectId}/issues`)
      .set('Authorization', `Bearer ${projViewerToken}`)
      .send({
        title: 'Client Ticket',
      });

    expect(res.status).toBe(403);
  });

  it('should ensure transaction-safe increment of project issue sequence IDs in concurrent requests', async () => {
    // Send multiple requests concurrently
    const reqs = Array.from({ length: 5 }).map(() =>
      request(app)
        .post(`/api/v1/projects/${projectId}/issues`)
        .set('Authorization', `Bearer ${projMemberToken}`)
        .send({
          title: 'Concurrent Issue',
        })
    );

    const responses = await Promise.all(reqs);

    // Verify all succeeded
    responses.forEach((res) => {
      expect(res.status).toBe(201);
    });

    // Verify all returned unique sequenceIds
    const seqIds = responses.map((res) => res.body.data.sequenceId);
    const uniqueSeqIds = new Set(seqIds);
    expect(uniqueSeqIds.size).toBe(5);
  });
});
