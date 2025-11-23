const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const jobs = await prisma.job.findMany({
    include: { employer: true }
  });

  console.log(`Total jobs: ${jobs.length}`);
  if (jobs.length > 0) {
    console.log('First job:', JSON.stringify(jobs[0], null, 2));
  } else {
    console.log('No jobs found.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
