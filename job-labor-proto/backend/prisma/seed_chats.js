const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 's@mail.ru';
  
  // 1. Find worker (you)
  const worker = await prisma.user.findUnique({
    where: { email },
  });

  if (!worker) {
    console.error(`User ${email} not found`);
    return;
  }

  // 2. Find employer
  const employer = await prisma.user.findFirst({
    where: { role: 'employer' },
    include: { profile: true }
  });

  if (!employer) {
    console.error('No employer found');
    return;
  }

  console.log(`Creating chat between ${worker.email} and ${employer.email}`);

  // 3. Create Chat
  // Ensure consistency in ID order (as per controller logic, though prisma handles it if we query right)
  // But let's just use unique constraint logic or try/catch
  
  const p1 = Math.min(worker.id, employer.id);
  const p2 = Math.max(worker.id, employer.id);

  const chat = await prisma.chat.upsert({
    where: {
        participant1Id_participant2Id: {
            participant1Id: p1,
            participant2Id: p2
        }
    },
    update: {},
    create: {
        participant1Id: p1,
        participant2Id: p2
    }
  });

  console.log(`Chat ID: ${chat.id}`);

  // 4. Add Messages
  await prisma.message.create({
    data: {
        chatId: chat.id,
        senderId: employer.id,
        text: 'Здравствуйте! Видел ваш отклик на вакансию Маляра.',
        createdAt: new Date(Date.now() - 3600000) // 1 hour ago
    }
  });

  await prisma.message.create({
    data: {
        chatId: chat.id,
        senderId: worker.id,
        text: 'Добрый день! Да, я свободен и готов приступить.',
        createdAt: new Date(Date.now() - 1800000) // 30 mins ago
    }
  });

  await prisma.message.create({
    data: {
        chatId: chat.id,
        senderId: employer.id,
        text: 'Отлично. Подходите завтра к 9:00 на объект. Документы не забудьте.',
        createdAt: new Date() // Just now
    }
  });

  console.log('Messages added.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
