import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 12);

  const users = await Promise.all(
    [
      {
        email: 'alice@example.com',
        username: 'alice',
        avatarUrl:
          'https://api.dicebear.com/9.x/initials/svg?seed=Alice&backgroundColor=f97316,0f172a',
      },
      {
        email: 'ben@example.com',
        username: 'ben',
        avatarUrl:
          'https://api.dicebear.com/9.x/initials/svg?seed=Ben&backgroundColor=14b8a6,0f172a',
      },
      {
        email: 'carla@example.com',
        username: 'carla',
        avatarUrl:
          'https://api.dicebear.com/9.x/initials/svg?seed=Carla&backgroundColor=e11d48,0f172a',
      },
    ].map((user) =>
      prisma.user.upsert({
        where: { email: user.email },
        update: {
          username: user.username,
          avatarUrl: user.avatarUrl,
          passwordHash,
        },
        create: {
          ...user,
          passwordHash,
        },
      }),
    ),
  );

  const [alice, ben, carla] = users;
  const directKey = [alice.id, ben.id].sort().join(':');

  const directConversation = await prisma.conversation.upsert({
    where: { directKey },
    update: {},
    create: {
      type: 'DIRECT',
      directKey,
      createdById: alice.id,
      participants: {
        create: [
          { userId: alice.id, role: 'OWNER' },
          { userId: ben.id, role: 'MEMBER' },
        ],
      },
    },
  });

  const groupKey = 'seed-group-general';
  const groupConversation = await prisma.conversation.upsert({
    where: { directKey: groupKey },
    update: {
      name: 'General',
      type: 'GROUP',
      avatarUrl:
        'https://api.dicebear.com/9.x/shapes/svg?seed=General&backgroundColor=0f172a,f97316',
    },
    create: {
      type: 'GROUP',
      directKey: groupKey,
      name: 'General',
      avatarUrl:
        'https://api.dicebear.com/9.x/shapes/svg?seed=General&backgroundColor=0f172a,f97316',
      createdById: alice.id,
      participants: {
        create: [
          { userId: alice.id, role: 'OWNER' },
          { userId: ben.id, role: 'MEMBER' },
          { userId: carla.id, role: 'MEMBER' },
        ],
      },
    },
  });

  const existingMessages = await prisma.message.count();

  if (existingMessages === 0) {
    await prisma.message.createMany({
      data: [
        {
          conversationId: directConversation.id,
          senderId: alice.id,
          clientId: 'seed-alice-1',
          content: 'Welcome to the scalable chat demo. This direct thread is seeded for walkthroughs.',
        },
        {
          conversationId: directConversation.id,
          senderId: ben.id,
          clientId: 'seed-ben-1',
          content: 'Nice. We can use this to discuss tradeoffs like Redis-backed presence and pagination.',
        },
        {
          conversationId: groupConversation.id,
          senderId: carla.id,
          clientId: 'seed-carla-1',
          content: 'General room online. Seed data is ready for local demos and portfolio screenshots.',
        },
      ],
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
