const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding reviews...');

  // 1. Find users
  const employer = await prisma.user.findFirst({ where: { role: 'employer' } });
  const worker = await prisma.user.findFirst({ where: { role: 'worker' } });

  if (!employer || !worker) {
    console.log('Skipping reviews seed: need both employer and worker');
    return;
  }

  console.log(`Reviewer (Employer): ${employer.id} -> Target (Worker): ${worker.id}`);

  // 2. Create Reviews for Worker
  const reviews = [
    {
      authorId: employer.id,
      targetId: worker.id,
      rating: 5,
      comment: 'Отличный работник! Пришел вовремя, все сделал аккуратно. Рекомендую.',
      createdAt: new Date('2025-11-20T10:00:00Z')
    },
    {
      authorId: employer.id,
      targetId: worker.id,
      rating: 4,
      comment: 'Хороший специалист, но немного задержался. В остальном претензий нет.',
      createdAt: new Date('2025-11-22T14:30:00Z')
    },
    {
      authorId: employer.id,
      targetId: worker.id,
      rating: 5,
      comment: 'Профессионал своего дела. Быстро разобрался с проблемой.',
      createdAt: new Date('2025-11-23T09:15:00Z')
    }
  ];

  for (const review of reviews) {
    await prisma.review.create({
      data: review
    });
  }

  // Update worker rating
  await prisma.profile.update({
    where: { userId: worker.id },
    data: { rating: 4.7 }
  });

  console.log(`Created ${reviews.length} reviews for worker ${worker.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });