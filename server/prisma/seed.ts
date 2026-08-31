import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { DEFAULT_STATES } from '../src/lib/defaultStates';

const prisma = new PrismaClient();

const PEOPLE = [
  { email: 'admin@miniplane.test', name: 'Admin User', ws: 'ADMIN' },
  { email: 'sara@miniplane.test', name: 'Sara Khan', ws: 'MEMBER' },
  { email: 'bilal@miniplane.test', name: 'Bilal Ahmed', ws: 'MEMBER' },
  { email: 'ayesha@miniplane.test', name: 'Ayesha Malik', ws: 'MEMBER' },
  { email: 'client@miniplane.test', name: 'Client User', ws: 'MEMBER' },
];

const WEB_ISSUES = [
  { title: 'Fix layout scaling on mobile Safari', priority: 'HIGH', state: 'Todo', assignee: 'bilal', reporter: 'sara' },
  { title: 'Integrate stripe webhook endpoints', priority: 'URGENT', state: 'In Progress', assignee: 'sara', reporter: 'admin' },
  { title: 'Update pricing table with new tiers', priority: 'MEDIUM', state: 'Done', assignee: 'sara', reporter: 'client', dueDate: '2026-07-28' },
  { title: 'Resolve contrast issues on footer links', priority: 'LOW', state: 'Backlog', assignee: null, reporter: 'client' },
  { title: 'Setup Google Analytics script tracking', priority: 'MEDIUM', state: 'Todo', assignee: 'bilal', reporter: 'sara' },
  { title: 'Write copy for the landing page hero section', priority: 'HIGH', state: 'In Progress', assignee: 'client', reporter: 'admin' },
  { title: 'Optimize image compression for fast load times', priority: 'MEDIUM', state: 'Done', assignee: 'bilal', reporter: 'sara' },
  { title: 'Configure rate limiting on login endpoint', priority: 'HIGH', state: 'Todo', assignee: 'sara', reporter: 'admin' },
  { title: 'Write API integration tests for Projects', priority: 'URGENT', state: 'In Progress', assignee: 'bilal', reporter: 'sara' },
  { title: 'An extremely long title that tests overflow behavior of card titles inside the list and board views of MiniPlane to ensure they wrap or truncate properly without breaking the columns width', priority: 'MEDIUM', state: 'Todo', assignee: null, reporter: 'admin' },
  { title: 'Ticket with a due date in the past to verify red styling', priority: 'MEDIUM', state: 'Todo', assignee: 'bilal', reporter: 'sara', dueDate: '2026-06-01' },
  { title: 'Unassigned ticket to test empty assignee avatars', priority: 'LOW', state: 'Backlog', assignee: null, reporter: 'admin' },
  { title: 'Fix console error in footer social icons', priority: 'LOW', state: 'Done', assignee: 'bilal', reporter: 'sara' },
  { title: 'Verify viewport meta tag accessibility', priority: 'MEDIUM', state: 'Cancelled', assignee: 'sara', reporter: 'client' },
  { title: 'Test signup with duplicate email format validation', priority: 'HIGH', state: 'Todo', assignee: 'bilal', reporter: 'admin' },
];

const APP_ISSUES = [
  { title: 'Setup push notifications via Firebase', priority: 'URGENT', state: 'Todo', assignee: 'bilal', reporter: 'ayesha' },
  { title: 'Implement login using JWT auth headers', priority: 'HIGH', state: 'In Progress', assignee: 'ayesha', reporter: 'bilal' },
  { title: 'Build profile settings screen layout', priority: 'MEDIUM', state: 'Done', assignee: 'ayesha', reporter: 'ayesha' },
  { title: 'Verify face id biometrics toggle behavior', priority: 'LOW', state: 'Backlog', assignee: null, reporter: 'bilal' },
  { title: 'Resolve memory leak in infinite scroll list', priority: 'HIGH', state: 'Todo', assignee: 'bilal', reporter: 'ayesha' },
  { title: 'Configure splash screen dynamic assets', priority: 'LOW', state: 'Todo', assignee: null, reporter: 'bilal' },
  { title: 'Fix offline caching behavior using SQLite', priority: 'URGENT', state: 'In Progress', assignee: 'bilal', reporter: 'ayesha' },
  { title: 'Design onboarding sliding tutorial screen', priority: 'MEDIUM', state: 'Done', assignee: 'ayesha', reporter: 'bilal' },
  { title: 'Submit iOS build to TestFlight for beta users', priority: 'HIGH', state: 'Cancelled', assignee: 'bilal', reporter: 'ayesha' },
  { title: 'Add support for deep linking to ticket details', priority: 'MEDIUM', state: 'Backlog', assignee: null, reporter: 'bilal' },
];

async function seedProject(
  workspaceId: string,
  users: Record<string, any>,
  input: {
    key: string;
    name: string;
    description: string;
    members: [string, string][];
    issues: any[];
  }
) {
  // Find or create project by workspaceId and key
  let project = await prisma.project.findUnique({
    where: {
      workspaceId_key: {
        workspaceId,
        key: input.key,
      },
    },
  });

  const adminUser = users['admin@miniplane.test'];

  if (!project) {
    project = await prisma.project.create({
      data: {
        workspaceId,
        name: input.name,
        key: input.key,
        description: input.description,
        createdById: adminUser.id,
        issueCounter: 0,
      },
    });

    // 1. Create 5 default states
    const statesMap: Record<string, string> = {};
    let defaultStateId = '';

    for (const s of DEFAULT_STATES) {
      const state = await prisma.issueState.create({
        data: {
          projectId: project.id,
          name: s.name,
          group: s.group,
          colour: s.colour,
          position: s.position,
        },
      });
      statesMap[s.name] = state.id;
      if (s.name === 'Backlog') {
        defaultStateId = state.id;
      }
    }

    // 2. Set defaultStateId on project
    project = await prisma.project.update({
      where: { id: project.id },
      data: { defaultStateId },
    });

    // 3. Add project creator as project ADMIN
    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: adminUser.id,
        role: 'ADMIN',
      },
    });

    // 4. Add other members
    for (const [prefix, role] of input.members) {
      const email = `${prefix}@miniplane.test`;
      const user = users[email];
      if (user && user.id !== adminUser.id) {
        await prisma.projectMember.upsert({
          where: {
            projectId_userId: {
              projectId: project.id,
              userId: user.id,
            },
          },
          update: { role: role as any },
          create: {
            projectId: project.id,
            userId: user.id,
            role: role as any,
          },
        });
      }
    }

    // 5. Seed issues
    let seq = 1;
    for (const issueInput of input.issues) {
      const assignee = issueInput.assignee ? users[`${issueInput.assignee}@miniplane.test`] : null;
      const reporter = users[`${issueInput.reporter}@miniplane.test`] || adminUser;
      const stateId = statesMap[issueInput.state] || defaultStateId;

      const createdIssue = await prisma.issue.create({
        data: {
          projectId: project.id,
          sequenceId: seq++,
          title: issueInput.title,
          description: issueInput.description || null,
          stateId,
          priority: issueInput.priority || 'MEDIUM',
          assigneeId: assignee ? assignee.id : null,
          createdById: reporter.id,
          dueDate: issueInput.dueDate ? new Date(issueInput.dueDate) : null,
        },
      });

      // Create default issue activity
      await prisma.issueActivity.create({
        data: {
          issueId: createdIssue.id,
          actorId: reporter.id,
          verb: 'created',
        },
      });
    }

    // Update project issueCounter
    await prisma.project.update({
      where: { id: project.id },
      data: { issueCounter: seq - 1 },
    });

    console.log(`Seeded project ${input.key} with ${input.issues.length} issues.`);
  }
}

async function main() {
  const hash = await bcrypt.hash('Password123!', 10);

  // 1. Upsert Workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: 'acme' },
    update: {},
    create: {
      name: 'Acme Interns',
      slug: 'acme',
    },
  });

  // 2. Upsert Users & WorkspaceMembers
  const users: Record<string, any> = {};
  for (const p of PEOPLE) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: {
        role: p.ws as any,
      },
      create: {
        email: p.email,
        displayName: p.name,
        passwordHash: hash,
        role: p.ws as any,
      },
    });

    await prisma.workspaceMember.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId: user.id,
        },
      },
      update: { role: p.ws as any },
      create: {
        workspaceId: workspace.id,
        userId: user.id,
        role: p.ws as any,
      },
    });

    users[p.email] = user;
  }

  // 3. Seed WEB Project
  await seedProject(workspace.id, users, {
    key: 'WEB',
    name: 'Website Redesign',
    description: 'Marketing site rebuild for Q2',
    members: [
      ['sara', 'ADMIN'],
      ['bilal', 'MEMBER'],
      ['client', 'VIEWER'],
    ],
    issues: WEB_ISSUES,
  });

  // 4. Seed APP Project
  await seedProject(workspace.id, users, {
    key: 'APP',
    name: 'Mobile App',
    description: 'iOS and Android client',
    members: [
      ['bilal', 'ADMIN'],
      ['ayesha', 'MEMBER'],
    ],
    issues: APP_ISSUES,
  });

  console.log('Seeding complete. Sign in with: admin@miniplane.test / Password123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
