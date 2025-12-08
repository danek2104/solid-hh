import { Job } from '../store/userStore';

// Интерфейс для переводов вакансий
interface JobTranslation {
  title: { [key: string]: string };
  description: { [key: string]: string };
  location: { [key: string]: string };
}

// Переводы для навыков (Key: Russian, Value: Translations)
export const SKILL_TRANSLATIONS: { [key: string]: { [key: string]: string } } = {
  'Маляр': { uz: 'Bo\'yoqchi', tj: 'Рангуборчӣ' },
  'Штукатур': { uz: 'Suvoqchi', tj: 'Гачкор' },
  'Плиточник': { uz: 'Plitka ustasi', tj: 'Плиткачин' },
  'Водитель': { uz: 'Haydovchi', tj: 'Ронанда' },
  'Повар': { uz: 'Oshpaz', tj: 'Ошпаз' },
  'Грузчик': { uz: 'Yuk tashuvchi', tj: 'Борбардор' },
  'Сварщик': { uz: 'Payvandchi', tj: 'Чашмкор' },
  'Электрик': { uz: 'Elektr ustasi', tj: 'Электрик' },
  'Уборщик': { uz: 'Farrosh', tj: 'Фаррош' },
  'Бетонщик': { uz: 'Betonchi', tj: 'Бетонрез' }
};

// Переводы для вакансий по ID
export const JOB_TRANSLATIONS: { [id: string]: JobTranslation } = {
  '1': {
    title: { uz: 'Qurilishdagi ishchi', tj: 'Коргари сохтмон' },
    description: { 
      uz: 'Qurilish maydonchasida ishlash uchun baquvvat erkaklar talab qilinadi. Turar joy beriladi.', 
      tj: 'Барои кор дар сохтмон мардони қавӣ лозиманд. Ҷои зист дода мешавад.' 
    },
    location: { uz: 'Moskva', tj: 'Москва' }
  },
  '2': {
    title: { uz: 'Omborga qadoqlovchi', tj: 'Бастабанди анбор' },
    description: { 
      uz: 'Ozon/Wildberries issiq omborida ishlash. Ovqatlanish bepul.', 
      tj: 'Кор дар анбори гарми Ozon/Wildberries. Хӯрок ройгон.' 
    },
    location: { uz: 'Moskva viloyati', tj: 'Вилояти Москва' }
  },
  '3': {
    title: { uz: 'Taksi haydovchisi', tj: 'Ронандаи такси' },
    description: { 
      uz: 'Kompaniya mashinasida ishlash. B toifali guvohnoma va 3 yillik tajriba talab qilinadi.', 
      tj: 'Шаҳодатномаи категорияи B ва таҷрибаи 3 сола лозим.' 
    },
    location: { uz: 'Sankt-Peterburg', tj: 'Санкт-Петербург' }
  },
  '4': {
    title: { uz: 'Sharq taomlari oshpazi', tj: 'Ошпази хӯрокҳои шарқӣ' },
    description: { 
      uz: 'Palov, lag‘mon, somsa tayyorlash. Ish tajribasi majburiy.', 
      tj: 'Тайёр кардани ош, лағмон, самбӯса. Таҷрибаи корӣ ҳатмист.' 
    },
    location: { uz: 'Qozon', tj: 'Қазон' }
  },
  '5': {
    title: { uz: 'Xona tozalovchi', tj: 'Фаррош' },
    description: { 
      uz: 'Ofis xonalarini tozalash. Jadval 2/2.', 
      tj: 'Тоза кардани утоқҳои офисӣ. График 2/2.' 
    },
    location: { uz: 'Yekaterinburg', tj: 'Екатеринбург' }
  }
};

// Хелпер для получения локализованного названия навыка
export const getLocalizedSkill = (skillOriginal: string, lang: string): string => {
  if (lang === 'ru') return skillOriginal;
  return SKILL_TRANSLATIONS[skillOriginal]?.[lang] || skillOriginal;
};

// Хелпер для получения локализованной вакансии
export const getLocalizedJob = (job: Job, lang: string): Job => {
  if (lang === 'ru') return job;
  const trans = JOB_TRANSLATIONS[job.id];
  if (!trans) return job;

  return {
    ...job,
    title: trans.title[lang] || job.title,
    description: trans.description[lang] || job.description,
    location: trans.location[lang] || job.location,
  };
};

// Поиск навыка по всем языкам
export const searchSkillAcrossAllLanguages = (originalSkill: string, query: string): boolean => {
  if (!query) return true;
  const q = query.toLowerCase();
  const ru = originalSkill.toLowerCase();
  const uz = (SKILL_TRANSLATIONS[originalSkill]?.uz || '').toLowerCase();
  const tj = (SKILL_TRANSLATIONS[originalSkill]?.tj || '').toLowerCase();

  return ru.includes(q) || uz.includes(q) || tj.includes(q);
};

// Получение данных для отображения: Основной (Вторичные)
export const getSkillDisplayData = (originalSkill: string, currentLang: string) => {
  const ru = originalSkill;
  const uz = SKILL_TRANSLATIONS[originalSkill]?.uz || originalSkill;
  const tj = SKILL_TRANSLATIONS[originalSkill]?.tj || originalSkill;

  const all = { ru, uz, tj };
  
  // @ts-ignore
  const primary = all[currentLang] || ru;

  const secondary = Object.entries(all)
    .filter(([key]) => key !== currentLang)
    .map(([_, value]) => value)
    .join(', ');

  return { primary, secondary };
};
