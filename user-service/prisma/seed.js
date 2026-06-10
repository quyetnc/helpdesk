const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // Hash passwords (12 rounds as per standard)
    const adminPassword = await bcrypt.hash('admin123', 12);
    const agentPassword = await bcrypt.hash('agent123', 12);
    const customerPassword = await bcrypt.hash('customer123', 12);

    // Seed Admin User
    const admin = await prisma.user.upsert({
      where: { email: 'admin@supporttickets.app' },
      update: {},
      create: {
        email: 'admin@supporttickets.app',
        name: 'System Administrator',
        password_hash: adminPassword,
        role: 'ADMIN',
        is_active: true,
      },
    });
    console.log('✓ Admin user:', admin.email);

    // Seed Agent User
    const agent = await prisma.user.upsert({
      where: { email: 'agent@supporttickets.app' },
      update: {},
      create: {
        email: 'agent@supporttickets.app',
        name: 'Support Agent',
        password_hash: agentPassword,
        role: 'AGENT',
        is_active: true,
      },
    });
    console.log('✓ Agent user:', agent.email);

    // Seed Customer User
    const customer = await prisma.user.upsert({
      where: { email: 'customer@supporttickets.app' },
      update: {},
      create: {
        email: 'customer@supporttickets.app',
        name: 'Regular Customer',
        password_hash: customerPassword,
        role: 'CUSTOMER',
        is_active: true,
      },
    });
    console.log('✓ Customer user:', customer.email);

    console.log('\n✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
