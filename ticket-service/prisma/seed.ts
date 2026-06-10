import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Use fixed UUIDs for seeded users (matching user-service seed)
// These UUIDs represent the admin, agent, and customer accounts
const ADMIN_ID = '550e8400-e29b-41d4-a716-446655440001';
const AGENT_ID = '550e8400-e29b-41d4-a716-446655440002';
const CUSTOMER_ID = '550e8400-e29b-41d4-a716-446655440003';

// SLA calculation helpers
function calculateSlaDeadline(priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'): Date {
  const now = new Date();
  const hoursMap = {
    URGENT: 4,
    HIGH: 8,
    MEDIUM: 24,
    LOW: 72,
  };
  const deadline = new Date(now.getTime() + hoursMap[priority] * 60 * 60 * 1000);
  return deadline;
}

async function seed() {
  console.log('🌱 Starting ticket database seed...');

  try {
    // Ticket 1: Urgent - System Down
    const ticket1 = await prisma.ticket.upsert({
      where: { id: '650e8400-e29b-41d4-a716-446655440001' },
      update: {},
      create: {
        id: '650e8400-e29b-41d4-a716-446655440001',
        requester_id: CUSTOMER_ID,
        assignee_id: AGENT_ID,
        title: 'Production system is down',
        description: 'The main API server is not responding. Customers cannot access their accounts.',
        priority: 'URGENT',
        status: 'IN_PROGRESS',
        sla_deadline: calculateSlaDeadline('URGENT'),
        is_deleted: false,
      },
    });
    console.log('✓ Ticket 1 (Urgent):', ticket1.title);

    // Ticket 2: High - Database Performance
    const ticket2 = await prisma.ticket.upsert({
      where: { id: '650e8400-e29b-41d4-a716-446655440002' },
      update: {},
      create: {
        id: '650e8400-e29b-41d4-a716-446655440002',
        requester_id: CUSTOMER_ID,
        assignee_id: AGENT_ID,
        title: 'Database queries timing out',
        description: 'Some reports are taking longer than 30 seconds to generate.',
        priority: 'HIGH',
        status: 'OPEN',
        sla_deadline: calculateSlaDeadline('HIGH'),
        is_deleted: false,
      },
    });
    console.log('✓ Ticket 2 (High):', ticket2.title);

    // Ticket 3: Medium - Feature Request
    const ticket3 = await prisma.ticket.upsert({
      where: { id: '650e8400-e29b-41d4-a716-446655440003' },
      update: {},
      create: {
        id: '650e8400-e29b-41d4-a716-446655440003',
        requester_id: CUSTOMER_ID,
        assignee_id: null, // Unassigned
        title: 'Add dark mode to dashboard',
        description: 'Users have requested a dark mode option for the dashboard interface.',
        priority: 'MEDIUM',
        status: 'OPEN',
        sla_deadline: calculateSlaDeadline('MEDIUM'),
        is_deleted: false,
      },
    });
    console.log('✓ Ticket 3 (Medium):', ticket3.title);

    // Ticket 4: Low - Documentation Update
    const ticket4 = await prisma.ticket.upsert({
      where: { id: '650e8400-e29b-41d4-a716-446655440004' },
      update: {},
      create: {
        id: '650e8400-e29b-41d4-a716-446655440004',
        requester_id: CUSTOMER_ID,
        assignee_id: AGENT_ID,
        title: 'Update API documentation',
        description: 'The API docs need to be updated to reflect the new v2 endpoints.',
        priority: 'LOW',
        status: 'ON_HOLD',
        sla_deadline: calculateSlaDeadline('LOW'),
        is_deleted: false,
      },
    });
    console.log('✓ Ticket 4 (Low):', ticket4.title);

    // Ticket 5: Resolved ticket
    const yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
    const ticket5 = await prisma.ticket.upsert({
      where: { id: '650e8400-e29b-41d4-a716-446655440005' },
      update: {},
      create: {
        id: '650e8400-e29b-41d4-a716-446655440005',
        requester_id: CUSTOMER_ID,
        assignee_id: AGENT_ID,
        title: 'Login page not loading',
        description: 'The login page was timing out for some users.',
        priority: 'HIGH',
        status: 'RESOLVED',
        sla_deadline: calculateSlaDeadline('HIGH'),
        resolved_at: yesterday,
        is_deleted: false,
      },
    });
    console.log('✓ Ticket 5 (Resolved):', ticket5.title);

    // Add comments to tickets
    await prisma.comment.upsert({
      where: { id: '750e8400-e29b-41d4-a716-446655440001' },
      update: {},
      create: {
        id: '750e8400-e29b-41d4-a716-446655440001',
        ticket_id: ticket1.id,
        author_id: AGENT_ID,
        body: 'I am investigating the issue. Checking server logs now.',
        is_deleted: false,
      },
    });

    await prisma.comment.upsert({
      where: { id: '750e8400-e29b-41d4-a716-446655440002' },
      update: {},
      create: {
        id: '750e8400-e29b-41d4-a716-446655440002',
        ticket_id: ticket1.id,
        author_id: CUSTOMER_ID,
        body: 'This is urgent! Our customers are complaining.',
        is_deleted: false,
      },
    });

    await prisma.comment.upsert({
      where: { id: '750e8400-e29b-41d4-a716-446655440003' },
      update: {},
      create: {
        id: '750e8400-e29b-41d4-a716-446655440003',
        ticket_id: ticket2.id,
        author_id: AGENT_ID,
        body: 'Added a database index. Running performance tests now.',
        is_deleted: false,
      },
    });

    await prisma.comment.upsert({
      where: { id: '750e8400-e29b-41d4-a716-446655440004' },
      update: {},
      create: {
        id: '750e8400-e29b-41d4-a716-446655440004',
        ticket_id: ticket5.id,
        author_id: AGENT_ID,
        body: 'Issue was caused by a CDN cache problem. Cache cleared and issue is resolved.',
        is_deleted: false,
      },
    });

    console.log('✓ Added 5 sample comments');
    console.log('\n✅ Ticket database seeded successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
