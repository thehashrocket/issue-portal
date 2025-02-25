import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.user.deleteMany({});

  // Create test users
  const users = [
    {
      name: 'Admin User',
      email: 'admin@example.com',
      role: Role.ADMIN,
    },
    {
      name: 'Regular User',
      email: 'user@example.com',
      role: Role.USER,
    },
    {
      name: 'Test User',
      email: 'test@example.com',
      role: Role.USER,
    },
  ];

  for (const user of users) {
    await prisma.user.create({
      data: user,
    });
  }

  console.log('Database has been seeded with test users');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 