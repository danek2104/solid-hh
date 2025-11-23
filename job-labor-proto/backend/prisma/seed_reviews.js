const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 's@mail.ru';
  
  // 1. Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error(`User with email ${email} not found`);
    return;
  }

  console.log(`Found user: ${user.id}`);

  // 2. Create Author (Employer) for reviews if not exists
  // Usually ID 1 is test user, but let's ensure we have a distinct author
  let author = await prisma.user.findFirst({
    where: { role: 'employer', NOT: { id: user.id } }
  });

  if (!author) {
    console.log('Creating test employer for reviews...');
    author = await prisma.user.create({
      data: {
        email: 'boss@example.com',
        password: 'hashed_password_placeholder',
        role: 'employer',
        profile: {
          create: {
            companyName: 'СтройМастер',
            rating: 5.0
          }
        }
      }
    });
  }

  // 3. Create Reviews
  console.log('Creating reviews...');
  
  await prisma.review.create({
    data: {
      authorId: author.id,
      targetId: user.id,
      rating: 5,
      comment: 'Отличный работник! Пришел вовремя, все сделал быстро. Рекомендую.',
      createdAt: new Date(Date.now() - 86400000 * 2) // 2 days ago
    }
  });

  await prisma.review.create({
    data: {
      authorId: author.id,
      targetId: user.id,
      rating: 2,
      comment: 'Опоздал на час и забыл инструменты. Работу сделал, но осадок остался.',
      createdAt: new Date(Date.now() - 86400000 * 5) // 5 days ago
    }
  });

  // 4. Recalculate Rating
  const aggregations = await prisma.review.aggregate({
    where: { targetId: user.id },
    _avg: { rating: true }
  });

  if (aggregations._avg.rating) {
    await prisma.profile.update({
      where: { userId: user.id },
      data: { rating: aggregations._avg.rating }
    });
    console.log(`Updated rating to ${aggregations._avg.rating}`);
  }

  console.log('Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
