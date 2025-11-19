import 'dotenv/config';
import type { PrismaClient, User } from '../app/generated/prisma/client';

const TEST_EMAIL = 'demo@example.com';

async function testDatabase() {
  console.log('🔍 Testing Prisma Postgres connection...\n');

  try {
    if (!process.env.PRISMA_ACCELERATE_ENABLED) {
      process.env.PRISMA_ACCELERATE_ENABLED = 'false';
    }

    const { default: rawClient } = await import('../lib/prisma');
    const prisma = rawClient as PrismaClient;

    console.log('✅ Connected to database!');

    console.log('\n🧹 Cleaning up any previous test data...');
    await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
    console.log('✅ Database is clean.');

    console.log('\n📝 Creating a test user...');
    const newUser = await prisma.user.create({
      data: {
        email: TEST_EMAIL,
        name: 'Demo User',
        password: 'password',
      },
    });
    console.log('✅ Created user:', newUser);

    console.log('\n📋 Fetching all users...');
    const allUsers = await prisma.user.findMany();
    console.log(`✅ Found ${allUsers.length} user(s):`);
    allUsers.forEach((user: User) => {
      console.log(`   - ${user.name ?? 'No name'} (${user.email})`);
    });

    console.log('\n🧽 Removing the test user...');
    await prisma.user.delete({
      where: { id: newUser.id },
    });
    console.log('✅ Cleanup complete.');

    console.log('\n🎉 All tests passed! Your database is working perfectly.\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testDatabase();
