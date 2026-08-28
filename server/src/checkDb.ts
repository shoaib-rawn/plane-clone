import { prisma } from './lib/prisma';

async function main() {
  console.log("=== USERS ===");
  const users = await prisma.user.findMany();
  console.log(users.map(u => ({ id: u.id, email: u.email, displayName: u.displayName })));

  console.log("=== WORKSPACES ===");
  const workspaces = await prisma.workspace.findMany();
  console.log(workspaces);

  console.log("=== WORKSPACE MEMBERS ===");
  const wm = await prisma.workspaceMember.findMany();
  console.log(wm);

  console.log("=== PROJECTS ===");
  const projects = await prisma.project.findMany();
  console.log(projects);

  console.log("=== PROJECT MEMBERS ===");
  const pm = await prisma.projectMember.findMany();
  console.log(pm);
}

main().catch(console.error).finally(() => prisma.$disconnect());
