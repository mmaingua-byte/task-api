const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.taskTag.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const adminPassword = await bcrypt.hash("Admin123!", 10);
  const userPassword = await bcrypt.hash("User123!", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@example.com",
      password: adminPassword,
      name: "Admin User",
      role: "ADMIN",
    },
  });

  const alice = await prisma.user.create({
    data: {
      email: "alice@example.com",
      password: userPassword,
      name: "Alice Johnson",
      role: "USER",
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: "bob@example.com",
      password: userPassword,
      name: "Bob Smith",
      role: "USER",
    },
  });

  // Create tags
  const bugTag = await prisma.tag.create({
    data: { name: "bug", color: "#ef4444" },
  });
  const featureTag = await prisma.tag.create({
    data: { name: "feature", color: "#22c55e" },
  });
  const urgentTag = await prisma.tag.create({
    data: { name: "urgent", color: "#f97316" },
  });

  // Create projects for Alice
  const projectA = await prisma.project.create({
    data: {
      title: "Website Redesign",
      description: "Redesign the company website with a modern look.",
      status: "ACTIVE",
      ownerId: alice.id,
    },
  });

  const projectB = await prisma.project.create({
    data: {
      title: "Mobile App MVP",
      description: "Build the first version of the mobile app.",
      status: "ACTIVE",
      ownerId: alice.id,
    },
  });

  // Create project for Bob
  const projectC = await prisma.project.create({
    data: {
      title: "API Integration",
      description: "Integrate third-party APIs into the platform.",
      status: "ACTIVE",
      ownerId: bob.id,
    },
  });

  // Create tasks
  const task1 = await prisma.task.create({
    data: {
      title: "Design new homepage",
      description: "Create mockups for the new homepage layout.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      projectId: projectA.id,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: "Fix broken nav links",
      description: "Navigation links on mobile are broken.",
      status: "TODO",
      priority: "HIGH",
      projectId: projectA.id,
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: "Set up authentication flow",
      description: "Implement login and signup screens.",
      status: "TODO",
      priority: "HIGH",
      projectId: projectB.id,
    },
  });

  const task4 = await prisma.task.create({
    data: {
      title: "Integrate Stripe API",
      description: "Add payment processing via Stripe.",
      status: "TODO",
      priority: "MEDIUM",
      projectId: projectC.id,
    },
  });

  // Assign tags to tasks
  await prisma.taskTag.createMany({
    data: [
      { taskId: task1.id, tagId: featureTag.id },
      { taskId: task2.id, tagId: bugTag.id },
      { taskId: task2.id, tagId: urgentTag.id },
      { taskId: task3.id, tagId: featureTag.id },
      { taskId: task4.id, tagId: featureTag.id },
    ],
  });

  console.log("✅ Seed complete!");
  console.log("\n--- Login Credentials ---");
  console.log("Admin:  admin@example.com / Admin123!");
  console.log("Alice:  alice@example.com / User123!");
  console.log("Bob:    bob@example.com   / User123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
