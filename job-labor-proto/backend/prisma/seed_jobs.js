const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Find or create Employer
  let employer = await prisma.user.findFirst({
    where: { role: 'employer' }
  });

  if (!employer) {
    console.log('Creating employer...');
    employer = await prisma.user.create({
      data: {
        email: 'employer@jobs.com',
        password: 'hashed_password',
        role: 'employer',
        profile: {
          create: {
            companyName: 'СтройГрупп',
            location: 'Ташкент',
            rating: 4.8
          }
        }
      }
    });
  }

  console.log(`Using employer: ${employer.id}`);

  // 2. Create Jobs
  const jobs = [
    {
      title: 'Разнорабочий на склад',
      description: 'Требуются ответственные сотрудники для работы на складе. Погрузка, разгрузка, сортировка товара. Опыт не требуется.',
      location: 'Ташкент, Сергели',
      salary: 250000, // за смену
      skill: 'Разнорабочий',
      availability: 'Дневные смены',
      requirements: ['Ответственность', 'Физическая выносливость', 'Пунктуальность'],
      benefits: ['Ежедневные выплаты', 'Обед', 'Транспорт']
    },
    {
      title: 'Маляр (Покраска фасада)',
      description: 'Срочно требуется бригада маляров для покраски фасада жилого дома. Объем большой. Оплата сдельная.',
      location: 'Ташкент, Чиланзар',
      salary: 500000,
      skill: 'Маляр',
      availability: 'Полный день',
      requirements: ['Опыт от 1 года', 'Свой инструмент приветствуется', 'Аккуратность'],
      benefits: ['Высокая оплата', 'Премии за скорость']
    },
    {
      title: 'Электрик на объект',
      description: 'Монтаж проводки в новостройке. Штробление, прокладка кабеля, установка подрозетников.',
      location: 'Ташкент, Юнусабад',
      salary: 600000,
      skill: 'Электрик',
      availability: 'Гибкий график',
      requirements: ['Умение читать схемы', 'Опыт работы с электроинструментом'],
      benefits: ['Официальное оформление', 'Спецодежда']
    }
  ];

  for (const job of jobs) {
    await prisma.job.create({
      data: {
        ...job,
        employerId: employer.id,
        status: 'active'
      }
    });
  }

  console.log(`Created ${jobs.length} jobs`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
