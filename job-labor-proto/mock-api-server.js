/**
 * Мок-сервер API для локальной разработки
 * Эмулирует все эндпоинты API для работы без реального сервера
 * 
 * Использование:
 * 1. Запустите сервер: node mock-api-server.js
 * 2. В файле .env установите: EXPO_PUBLIC_API_URL=http://localhost:3001/api
 * 3. Перезапустите Expo сервер: npm start
 */

require('dotenv').config();
const express = require('express');
const multer = require('multer');

const app = express();
const PORT = process.env.MOCK_API_PORT || 3001;

// Настройка multer для обработки multipart/form-data
// Используем memory storage (файлы не сохраняются на диск)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Middleware для парсинга JSON (пропускаем multipart/form-data)
app.use((req, res, next) => {
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    return next();
  }
  express.json()(req, res, next);
});

// Middleware для парсинга urlencoded (пропускаем multipart/form-data)
app.use((req, res, next) => {
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    return next();
  }
  express.urlencoded({ extended: true, limit: '50mb' })(req, res, next);
});

// Настройка CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Логирование запросов
app.use((req, res, next) => {
  console.log(`[MOCK API] ${req.method} ${req.path}`, req.query);
  next();
});

// ==================== AUTH ====================
app.post('/api/auth', async (req, res) => {
  const body = req.body;
  
  // Имитация задержки
  await new Promise(resolve => setTimeout(resolve, 40));
  
  // Генерируем токен на основе режима и роли
  const token = `msw-token-${body?.mode ?? 'login'}-${body?.role ?? 'worker'}`;
  
  res.status(200).json({
    token: token,
    refreshToken: `refresh-${token}`,
    received: body,
  });
});

app.post('/api/auth/refresh', async (req, res) => {
  const body = req.body;
  
  if (!body.refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }
  
  await new Promise(resolve => setTimeout(resolve, 20));
  
  res.status(200).json({
    token: 'msw-refreshed-token',
    refreshToken: 'msw-refreshed-refresh-token',
  });
});

// ==================== VERIFY ====================
app.post('/api/verify', async (req, res) => {
  const body = req.body;
  
  await new Promise(resolve => setTimeout(resolve, 30));
  
  res.status(200).json({
    delivered: true,
    target: body?.target,
    contact: body?.contact,
  });
});

// ==================== PROFILE ====================
app.get('/api/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  setTimeout(() => {
    res.status(200).json({
      profile: {
        id: 1,
        email: 'worker@example.com',
        phone: '+998 90 111 22 33',
        role: 'worker',
        skill: 'Маляр',
        availability: 'Ночные смены',
      },
    });
  }, 20);
});

app.post('/api/profile', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const body = req.body;
  
  await new Promise(resolve => setTimeout(resolve, 30));
  
  res.status(200).json({
    profile: {
      id: 1,
      ...body.profile,
    },
  });
});

app.get('/api/profile/documents/status', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  setTimeout(() => {
    res.status(200).json({
      documents: {
        passport: { status: 'verified', uploadedAt: new Date().toISOString() },
        workPermit: { status: 'pending', uploadedAt: new Date().toISOString() },
        photo: { status: 'verified', uploadedAt: new Date().toISOString() },
      },
    });
  }, 20);
});

// ==================== JOBS ====================
app.get('/api/jobs', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const page = parseInt(req.query.page || '1');
  const limit = parseInt(req.query.limit || '10');
  const search = req.query.search || '';
  
  const jobs = [
    {
      id: 1,
      title: 'Маляр',
      description: 'Требуется опытный маляр',
      location: 'Ташкент',
      salary: 500000,
      skill: 'Маляр',
      availability: 'Дневные смены',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      title: 'Строитель',
      description: 'Работа на стройке',
      location: 'Самарканд',
      salary: 600000,
      skill: 'Строитель',
      availability: 'Ночные смены',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      title: 'Электрик',
      description: 'Требуется электрик для монтажа проводки. Опыт от 3 лет.',
      location: 'Ташкент',
      salary: 750000,
      skill: 'Электрик',
      availability: 'Гибкий график',
      status: 'active',
      employer: {
        name: 'ЭлектроМонтаж',
        rating: 4.9
      },
      createdAt: new Date().toISOString(),
    },
  ].filter(job => !search || job.title.toLowerCase().includes(search.toLowerCase()));
  
  setTimeout(() => {
    res.status(200).json({
      jobs,
      pagination: {
        page,
        limit,
        total: jobs.length,
        totalPages: Math.ceil(jobs.length / limit),
      },
    });
  }, 20);
});

// ВАЖНО: Более специфичные маршруты должны быть ПЕРЕД параметризованными!
// Получить отклики пользователя (должен быть перед /api/jobs/:id)
app.get('/api/jobs/applications', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const page = parseInt(req.query.page || '1');
  const limit = parseInt(req.query.limit || '50');
  const status = req.query.status;
  
  const applications = [
    {
      id: 1,
      jobId: 1,
      job: {
        id: 1,
        title: 'Маляр',
        location: 'Ташкент',
        salary: 500000,
      },
      status: 'pending',
      message: 'Готов приступить к работе в ближайшее время',
      createdAt: new Date(Date.now() - 86400000).toISOString(), // Вчера
    },
    {
      id: 2,
      jobId: 2,
      job: {
        id: 2,
        title: 'Строитель',
        location: 'Самарканд',
        salary: 600000,
      },
      status: 'accepted',
      message: 'Опыт работы 5 лет, готов к ночным сменам',
      createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 дня назад
    },
    {
      id: 3,
      jobId: 1,
      job: {
        id: 1,
        title: 'Маляр',
        location: 'Ташкент',
        salary: 500000,
      },
      status: 'rejected',
      message: 'Ищу постоянную работу',
      createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 дня назад
    },
  ];
  
  // Фильтрация по статусу, если указан
  let filteredApplications = applications;
  if (status) {
    filteredApplications = applications.filter(app => app.status === status);
  }
  
  // Пагинация
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedApplications = filteredApplications.slice(startIndex, endIndex);
  
  setTimeout(() => {
    res.status(200).json({
      applications: paginatedApplications,
      pagination: {
        page,
        limit,
        total: filteredApplications.length,
        totalPages: Math.ceil(filteredApplications.length / limit),
      },
    });
  }, 20);
});

// Получить конкретную вакансию по ID (должен быть после /api/jobs/applications)
app.get('/api/jobs/:id', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { id } = req.params;
  const jobId = parseInt(id);
  
  // Мок-данные вакансий
  const jobs = {
    1: {
      id: 1,
      title: 'Маляр',
      description: 'Требуется опытный маляр для работы на объекте. Опыт работы от 2 лет. Работа в команде, соблюдение техники безопасности обязательно.',
      location: 'Ташкент',
      salary: 500000,
      skill: 'Маляр',
      availability: 'Дневные смены',
      status: 'active',
      employer: {
        id: 2,
        name: 'СтройКомпания',
        rating: 4.8,
      },
      requirements: [
        'Опыт работы от 2 лет',
        'Знание техники безопасности',
        'Умение работать в команде',
      ],
      benefits: [
        'Официальное оформление',
        'Питание',
        'Транспорт до объекта',
      ],
      createdAt: new Date().toISOString(),
    },
    2: {
      id: 2,
      title: 'Строитель',
      description: 'Работа на стройке. Требуется физическая выносливость, опыт работы со строительными инструментами.',
      location: 'Самарканд',
      salary: 600000,
      skill: 'Строитель',
      availability: 'Ночные смены',
      status: 'active',
      employer: {
        id: 3,
        name: 'СтройГрупп',
        rating: 4.5,
      },
      requirements: [
        'Физическая выносливость',
        'Опыт работы на стройке',
        'Знание строительных инструментов',
      ],
      benefits: [
        'Высокая оплата',
        'Ночные надбавки',
        'Обеспечение инструментами',
      ],
      createdAt: new Date().toISOString(),
    },
  };
  
  const job = jobs[jobId];
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  setTimeout(() => {
    res.status(200).json({ job });
  }, 20);
});

app.post('/api/jobs/apply', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const body = req.body;
  
  if (!body.jobId) {
    return res.status(400).json({ error: 'jobId is required' });
  }
  
  await new Promise(resolve => setTimeout(resolve, 30));
  
  res.status(200).json({
    application: {
      id: 1,
      jobId: body.jobId,
      status: 'pending',
      message: body.message || '',
      createdAt: new Date().toISOString(),
    },
  });
});

// ==================== CHATS ====================
// ВАЖНО: Более специфичные маршруты должны быть ПЕРЕД более общими!
// Иначе /api/chats/:id перехватит /api/chats/:id/messages

// Тестовый маршрут для проверки работы сервера
app.get('/api/chats/test', (req, res) => {
  console.log('[MOCK API] Test endpoint hit');
  res.status(200).json({ message: 'Chats API is working!' });
});

app.get('/api/chats', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const chats = [
    {
      id: 1,
      participant: {
        id: 2,
        name: 'Работодатель',
      },
      name: 'Работодатель',
      lastMessage: {
        text: 'Привет, когда можете начать?',
        createdAt: new Date().toISOString(),
      },
      unreadCount: 2,
      unread: 2,
      status: 'Активный',
    },
    {
      id: 2,
      participant: {
        id: 3,
        name: 'Менеджер',
      },
      name: 'Менеджер',
      lastMessage: {
        text: 'Смена подтверждена',
        createdAt: new Date(Date.now() - 86400000).toISOString(), // Вчера
      },
      unreadCount: 0,
      unread: 0,
      status: 'Смены каждую неделю',
    },
  ];
  
  setTimeout(() => {
    res.status(200).json({ chats });
  }, 20);
});

// Этот маршрут должен быть ПЕРЕД /api/chats/:id
app.get('/api/chats/:id/messages', (req, res) => {
  console.log('[MOCK API] GET /api/chats/:id/messages - MATCHED!', req.params.id, req.query);
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[MOCK API] Unauthorized - no auth header');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { id } = req.params;
  const limit = parseInt(req.query.limit || '100');
  console.log('[MOCK API] Processing request for chat', id, 'limit', limit);
  
  // Генерируем историю сообщений
  const messages = [];
  const now = new Date();
  for (let i = limit; i > 0; i--) {
    const messageDate = new Date(now.getTime() - i * 60000); // Каждое сообщение на 1 минуту позже
    messages.push({
      id: Date.now() - i * 60000,
      chatId: parseInt(id),
      text: i === limit 
        ? 'Привет! Готовы начать работу?' 
        : i === limit - 1
        ? 'Да, конечно! Когда можем приступить?'
        : i === limit - 2
        ? 'Завтра в 9:00 будет удобно?'
        : i === limit - 3
        ? 'Отлично! До встречи завтра!'
        : `Тестовое сообщение ${i}`,
      senderId: i % 2 === 0 ? 1 : 2, // Чередуем отправителей
      sender: {
        id: i % 2 === 0 ? 1 : 2,
        name: i % 2 === 0 ? 'Вы' : 'Работодатель',
      },
      createdAt: messageDate.toISOString(),
      read: i < limit - 3, // Первые несколько непрочитанные
    });
  }
  
  console.log('[MOCK API] Returning', messages.length, 'messages');
  setTimeout(() => {
    res.status(200).json({ messages });
  }, 20);
});

// Этот маршрут должен быть ПОСЛЕ /api/chats/:id/messages
app.get('/api/chats/:id', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { id } = req.params;
  
  const chat = {
    id: parseInt(id),
    participant: {
      id: 2,
      name: 'Работодатель',
    },
    name: 'Работодатель',
    lastMessage: {
      text: 'Привет, когда можете начать?',
      createdAt: new Date().toISOString(),
    },
    unreadCount: 2,
  };
  
  setTimeout(() => {
    res.status(200).json({ chat });
  }, 20);
});

app.post('/api/chats/:id/messages', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { id } = req.params;
  const body = req.body;
  
  if (!body.text) {
    return res.status(400).json({ error: 'text is required' });
  }
  
  await new Promise(resolve => setTimeout(resolve, 20));
  
  res.status(200).json({
    message: {
      id: Date.now(),
      chatId: parseInt(id),
      text: body.text,
      senderId: 1,
      sender: {
        id: 1,
        name: 'Вы',
      },
      createdAt: new Date().toISOString(),
      read: true,
    },
  });
});

app.post('/api/chats/:id/messages/read', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { id } = req.params;
  const body = req.body;
  
  await new Promise(resolve => setTimeout(resolve, 20));
  
  res.status(200).json({
    success: true,
    chatId: parseInt(id),
    messageIds: body.messageIds || [],
  });
});

// ==================== SHIFTS ====================
app.get('/api/shifts', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const shifts = [
    {
      id: 1,
      jobId: 1,
      title: 'Смена маляра',
      date: new Date().toISOString(),
      startTime: '08:00',
      endTime: '17:00',
      location: 'Ташкент',
      status: 'available',
      payment: 500000,
    },
    {
      id: 2,
      jobId: 2,
      title: 'Ночная смена строителя',
      date: new Date().toISOString(),
      startTime: '20:00',
      endTime: '06:00',
      location: 'Самарканд',
      status: 'available',
      payment: 600000,
    },
  ];
  
  setTimeout(() => {
    res.status(200).json({ shifts });
  }, 20);
});

app.post('/api/shifts/:id/accept', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { id } = req.params;
  
  await new Promise(resolve => setTimeout(resolve, 30));
  
  res.status(200).json({
    shift: {
      id: parseInt(id),
      status: 'accepted',
      acceptedAt: new Date().toISOString(),
    },
  });
});

// ==================== REVIEWS ====================
app.get('/api/reviews', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const reviews = [
    {
      id: 1,
      userId: 2,
      userName: 'Работодатель',
      rating: 5,
      comment: 'Отличный работник, рекомендую!',
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      userId: 3,
      userName: 'Клиент',
      rating: 4,
      comment: 'Хорошая работа, быстро выполнил',
      createdAt: new Date().toISOString(),
    },
  ];
  
  setTimeout(() => {
    res.status(200).json({ reviews });
  }, 20);
});

app.post('/api/reviews', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const body = req.body;
  
  if (!body.userId || !body.rating) {
    return res.status(400).json({ error: 'userId and rating are required' });
  }
  
  await new Promise(resolve => setTimeout(resolve, 30));
  
  res.status(200).json({
    review: {
      id: Date.now(),
      userId: body.userId,
      rating: body.rating,
      comment: body.comment || '',
      createdAt: new Date().toISOString(),
    },
  });
});

// ==================== WORKERS ====================
app.get('/api/workers', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const search = req.query.search || '';
  const skill = req.query.skill || '';
  const location = req.query.location || '';
  const minRating = req.query.minRating;
  
  const workers = [
    {
      id: 1,
      name: 'Иван Петров',
      skill: 'Маляр',
      location: 'Ташкент',
      rating: 4.8,
      experience: 5,
      availability: 'Дневные смены',
      verified: true,
    },
    {
      id: 2,
      name: 'Алексей Смирнов',
      skill: 'Строитель',
      location: 'Самарканд',
      rating: 4.5,
      experience: 3,
      availability: 'Ночные смены',
      verified: true,
    },
    {
      id: 3,
      name: 'Дмитрий Иванов',
      skill: 'Маляр',
      location: 'Ташкент',
      rating: 4.2,
      experience: 2,
      availability: 'Любые смены',
      verified: false,
    },
  ].filter(worker => {
    if (search && !worker.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (skill && worker.skill !== skill) return false;
    if (location && worker.location !== location) return false;
    if (minRating && worker.rating < parseFloat(minRating)) return false;
    return true;
  });
  
  setTimeout(() => {
    res.status(200).json({ workers });
  }, 20);
});

// ==================== DOCUMENTS ====================
// Хранилище документов в памяти (для мока)
let documentsStore = [
  {
    id: 1,
    title: 'Паспорт',
    type: 'document',
    documentType: 'passport',
    status: 'verified',
    url: 'https://example.com/documents/passport.pdf',
    fileUrl: 'https://example.com/documents/passport.pdf',
    mimeType: 'application/pdf',
    uploadedAt: new Date(Date.now() - 86400000 * 7).toISOString(), // 7 дней назад
    description: 'Паспорт гражданина',
  },
  {
    id: 2,
    title: 'Медкнижка',
    type: 'document',
    documentType: 'medical',
    status: 'pending',
    url: 'https://example.com/documents/medical.pdf',
    fileUrl: 'https://example.com/documents/medical.pdf',
    mimeType: 'application/pdf',
    uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 дня назад
    description: 'Медицинская книжка',
  },
  {
    id: 3,
    title: 'Фото паспорта',
    type: 'photo',
    documentType: 'passport_photo',
    status: 'verified',
    url: 'https://example.com/documents/passport_photo.jpg',
    fileUrl: 'https://example.com/documents/passport_photo.jpg',
    mimeType: 'image/jpeg',
    uploadedAt: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 дней назад
    description: 'Фотография паспорта',
  },
];

// Получить список документов
app.get('/api/documents', (req, res) => {
  console.log('[MOCK API] GET /api/documents - Request received');
  console.log('[MOCK API] Headers:', req.headers);
  console.log('[MOCK API] Query:', req.query);
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[MOCK API] GET /api/documents - Unauthorized (no token)');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  console.log('[MOCK API] GET /api/documents - Returning', documentsStore.length, 'documents');
  
  setTimeout(() => {
    res.status(200).json({ documents: documentsStore });
  }, 20);
});

// Получить конкретный документ
app.get('/api/documents/:id', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { id } = req.params;
  const documentId = parseInt(id);
  
  const document = documentsStore.find(doc => doc.id === documentId);
  
  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }
  
  setTimeout(() => {
    res.status(200).json({ document });
  }, 20);
});

// Загрузить документ
app.post('/api/documents', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large', message: 'File size exceeds 50MB limit' });
        }
        return res.status(400).json({ error: 'Upload error', message: err.message });
      }
      return res.status(500).json({ error: 'Internal server error', message: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Получаем данные из multipart/form-data
    const documentType = req.body.documentType || 'document';
    const title = req.body.title || (req.file ? req.file.originalname : `Документ ${Date.now()}`);
    const description = req.body.description || '';
    
    // Проверяем наличие файла
    const hasFile = !!req.file;
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Определяем mimeType на основе загруженного файла
    const mimeType = req.file ? req.file.mimetype : 'application/pdf';
    const fileExtension = mimeType.includes('image') ? (mimeType.includes('png') ? 'png' : 'jpg') : 'pdf';
    
    const newDocument = {
      id: documentsStore.length > 0 ? Math.max(...documentsStore.map(d => d.id)) + 1 : 1,
      title,
      type: 'document',
      documentType,
      status: 'pending',
      url: `https://example.com/documents/${Date.now()}.${fileExtension}`,
      fileUrl: `https://example.com/documents/${Date.now()}.${fileExtension}`,
      mimeType,
      uploadedAt: new Date().toISOString(),
      description,
      name: title, // Для совместимости
    };
    
    documentsStore.push(newDocument);
    
    res.status(200).json({ document: newDocument });
  } catch (error) {
    console.error('[MOCK API] Error uploading document:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Загрузить фото документа
app.post('/api/documents/photos', (req, res, next) => {
  upload.single('photo')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large', message: 'File size exceeds 50MB limit' });
        }
        return res.status(400).json({ error: 'Upload error', message: err.message });
      }
      return res.status(500).json({ error: 'Internal server error', message: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Получаем данные из multipart/form-data
    const documentType = req.body.documentType || 'photo';
    const title = req.body.title || (req.file ? req.file.originalname : `Фото документа ${Date.now()}`);
    const description = req.body.description || '';
    
    // Проверяем наличие фото
    const hasPhoto = !!req.file;
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Определяем mimeType на основе загруженного файла
    const mimeType = req.file ? req.file.mimetype : 'image/jpeg';
    const fileExtension = mimeType.includes('png') ? 'png' : 'jpg';
    
    const newDocument = {
      id: documentsStore.length > 0 ? Math.max(...documentsStore.map(d => d.id)) + 1 : 1,
      title,
      type: 'photo',
      documentType,
      status: 'pending',
      url: `https://example.com/documents/${Date.now()}.${fileExtension}`,
      fileUrl: `https://example.com/documents/${Date.now()}.${fileExtension}`,
      mimeType,
      uploadedAt: new Date().toISOString(),
      description,
      name: title, // Для совместимости
    };
    
    documentsStore.push(newDocument);
    
    res.status(200).json({ document: newDocument });
  } catch (error) {
    console.error('[MOCK API] Error uploading photo:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Удалить документ
app.delete('/api/documents/:id', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { id } = req.params;
  // Пробуем преобразовать в число, если не получается - используем как строку
  const documentId = isNaN(id) ? id : parseInt(id);
  
  const documentIndex = documentsStore.findIndex(doc => {
    const docId = doc.id || doc._id;
    return String(docId) === String(documentId);
  });
  
  if (documentIndex === -1) {
    return res.status(404).json({ error: 'Document not found' });
  }
  
  await new Promise(resolve => setTimeout(resolve, 30));
  
  documentsStore.splice(documentIndex, 1);
  
  res.status(200).json({ success: true });
});

// Обработчик для всех остальных запросов
app.use('/api/*', (req, res) => {
  console.warn(`[MOCK API] ⚠️  Unhandled request: ${req.method} ${req.path}`);
  console.warn(`[MOCK API] Full URL: ${req.protocol}://${req.get('host')}${req.originalUrl}`);
  console.warn(`[MOCK API] Query params:`, req.query);
  console.warn(`[MOCK API] Params:`, req.params);
  console.warn(`[MOCK API] Headers:`, req.headers);
  res.status(404).json({ 
    error: 'Not found', 
    message: `Handler for ${req.method} ${req.path} not found`,
    path: req.path,
    originalUrl: req.originalUrl
  });
});

app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('Мок-сервер API запущен!');
  console.log(`Порт: ${PORT}`);
  console.log(`URL: http://localhost:${PORT}/api`);
  console.log('='.repeat(50));
  console.log('\nДля использования:');
  console.log('1. В файле .env установите: EXPO_PUBLIC_API_URL=http://localhost:3001/api');
  console.log('2. Перезапустите Expo сервер: npm start');
  console.log('\n⚠️  Это мок-сервер для разработки. Все данные тестовые!');
  console.log('✅ Эндпоинты: /auth, /verify, /profile, /jobs, /chats, /shifts, /reviews, /workers, /documents');
});
