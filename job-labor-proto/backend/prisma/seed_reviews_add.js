const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 's@mail.ru';
  
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error(`User with email ${email} not found`);
    return;
  }

  console.log(`Found user: ${user.id}`);

  // Find or create another author
  let author = await prisma.user.findFirst({
    where: { role: 'employer', NOT: { id: user.id } }
  });

  if (!author) {
    // Fallback if no employer exists (should exist from previous seed)
    author = await prisma.user.create({
      data: {
        email: 'manager@company.com',
        password: 'hashed',
        role: 'employer',
        profile: { create: { companyName: 'OOO Вектор' } }
      }
    });
  }

  // Add new review
  console.log('Adding new review...');
  
  await prisma.review.create({
    data: {
      authorId: author.id,
      targetId: user.id,
      rating: 4,
      comment: 'Хороший специалист, но немного медленный. В целом доволен.',
      createdAt: new Date() 
    }
  });

  // Recalculate Rating
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
