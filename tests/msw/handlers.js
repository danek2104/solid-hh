const { rest } = require('msw');

// Для тестов используем значения по умолчанию или из переменных окружения
// В тестах можно переопределить через process.env
const API_BASE_URL = process.env.TEST_API_URL || 'https://api.workmatch.dev';
const AUTH_URL = `${API_BASE_URL}/auth`;
const VERIFY_URL = `${API_BASE_URL}/verify`;
const PROFILE_URL = `${API_BASE_URL}/profile`;
const JOBS_URL = `${API_BASE_URL}/jobs`;
const CHATS_URL = `${API_BASE_URL}/chats`;
const SHIFTS_URL = `${API_BASE_URL}/shifts`;
const REVIEWS_URL = `${API_BASE_URL}/reviews`;
const WORKERS_URL = `${API_BASE_URL}/workers`;
const DOCUMENTS_URL = `${API_BASE_URL}/documents`;

const handlers = [
    rest.post(AUTH_URL, async (req, res, ctx) => {
        const body = await req.json();

        return res(
            ctx.delay(40),
            ctx.status(200),
            ctx.json({
                token: `msw-token-${body?.mode ?? 'login'}-${body?.role ?? 'worker'}`,
                received: body,
            })
        );
    }),
    rest.post(VERIFY_URL, async (req, res, ctx) => {
        const body = await req.json();

        return res(
            ctx.delay(30),
            ctx.status(200),
            ctx.json({
                delivered: true,
                target: body?.target,
                contact: body?.contact,
            })
        );
    }),
  rest.get('https://www.googleapis.com/oauth2/v3/userinfo', (_req, res, ctx) =>
    res(
      ctx.delay(20),
      ctx.status(200),
      ctx.json({
        sub: 'msw-google',
        email: 'msw-user@example.com',
        name: 'MSW Test User',
        picture: 'https://example.com/avatar.png',
      })
    )
  ),
  rest.get(PROFILE_URL, (req, res, ctx) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res(ctx.status(401), ctx.json({ error: 'Unauthorized' }));
    }

    return res(
      ctx.delay(20),
      ctx.status(200),
      ctx.json({
        profile: {
          id: 1,
          email: 'worker@example.com',
          phone: '+998 90 111 22 33',
          role: 'worker',
          skill: 'Маляр',
          availability: 'Ночные смены',
        },
      })
    );
  }),
  rest.post(PROFILE_URL, async (req, res, ctx) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res(ctx.status(401), ctx.json({ error: 'Unauthorized' }));
    }

    const body = await req.json();

    return res(
      ctx.delay(30),
      ctx.status(200),
      ctx.json({
        profile: {
          id: 1,
          ...body.profile,
        },
      })
    );
  }),
  rest.get(`${PROFILE_URL}/documents/status`, (req, res, ctx) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res(ctx.status(401), ctx.json({ error: 'Unauthorized' }));
    }

    return res(
      ctx.delay(20),
      ctx.status(200),
      ctx.json({
        documents: {
          passport: { status: 'verified', uploadedAt: new Date().toISOString() },
          workPermit: { status: 'pending', uploadedAt: new Date().toISOString() },
          photo: { status: 'verified', uploadedAt: new Date().toISOString() },
        },
      })
    );
  }),
  rest.post(`${AUTH_URL}/refresh`, async (req, res, ctx) => {
    const body = await req.json();

    if (!body.refreshToken) {
      return res(ctx.status(400), ctx.json({ error: 'Refresh token required' }));
    }

    return res(
      ctx.delay(20),
      ctx.status(200),
      ctx.json({
        token: 'msw-refreshed-token',
        refreshToken: 'msw-refreshed-refresh-token',
      })
    );
  }),
  
  // Jobs handlers
  rest.get(JOBS_URL, (req, res, ctx) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res(ctx.status(401), ctx.json({ error: 'Unauthorized' }));
    }

    const searchParams = req.url.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

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
    ].filter(job => !search || job.title.toLowerCase().includes(search.toLowerCase()));

    return res(
      ctx.delay(20),
      ctx.status(200),
      ctx.json({
        jobs,
        pagination: {
          page,
          limit,
          total: jobs.length,
          totalPages: Math.ceil(jobs.length / limit),
        },
      })
    );
  }),
  
  rest.post(`${JOBS_URL}/apply`, async (req, res, ctx) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res(ctx.status(401), ctx.json({ error: 'Unauthorized' }));
    }

    const body = await req.json();

    if (!body.jobId) {
      return res(ctx.status(400), ctx.json({ error: 'jobId is required' }));
    }

    return res(
      ctx.delay(30),
      ctx.status(200),
      ctx.json({
        application: {
          id: 1,
          jobId: body.jobId,
          status: 'pending',
          message: body.message || '',
          createdAt: new Date().toISOString(),
        },
      })
    );
  }),

  // Chats handlers
  rest.get(CHATS_URL, (req, res, ctx) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res(ctx.status(401), ctx.json({ error: 'Unauthorized' }));
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

    return res(
      ctx.delay(20),
      ctx.status(200),
      ctx.json({
        chats,
      })
    );
  }),

  rest.get(`${CHATS_URL}/:id`, (req, res, ctx) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res(ctx.status(401), ctx.json({ error: 'Unauthorized' }));
    }

    const { id } = req.params;

    const chat = {
      id: parseInt(id),
      participant: {
        id: 2,
        name: 'Работодатель',
      },
      lastMessage: {
        text: 'Привет, когда можете начать?',
        createdAt: new Date().toISOString(),
      },
      unreadCount: 2,
    };

    return res(
      ctx.delay(20),
      ctx.status(200),
      ctx.json({
        chat,
      })
    );
  }),

  rest.get(`${CHATS_URL}/:id/messages`, (req, res, ctx) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res(ctx.status(401), ctx.json({ error: 'Unauthorized' }));
    }

    const { id } = req.params;
    const limit = parseInt(req.url.searchParams.get('limit') || '100');

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

    return res(
      ctx.delay(20),
      ctx.status(200),
      ctx.json({
        messages,
      })
    );
  }),

  rest.post(`${CHATS_URL}/:id/messages`, async (req, res, ctx) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res(ctx.status(401), ctx.json({ error: 'Unauthorized' }));
    }

    const { id } = req.params;
    const body = await req.json();

    if (!body.text) {
      return res(ctx.status(400), ctx.json({ error: 'text is required' }));
    }

    return res(
      ctx.delay(20),
      ctx.status(200),
      ctx.json({
        message: {
          id: Date.now(),
          chatId: parseInt(id),
          text: body.text,
          senderId: 1,
          createdAt: new Date().toISOString(),
        },
      })
    );
  }),

  rest.post(`${CHATS_URL}/:id/messages/read`, async (req, res, ctx) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res(ctx.status(401), ctx.json({ error: 'Unauthorized' }));
    }

    const { id } = req.params;
    const body = await req.json();

    return res(
      ctx.delay(20),
      ctx.status(200),
      ctx.json({
        success: true,
        chatId: parseInt(id),
        messageIds: body.messageIds || [],
      })
    );
  }),

  // Shifts handlers
  rest.get(SHIFTS_URL, (req, res, ctx) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res(ctx.status(401), ctx.json({ error: 'Unauthorized' }));
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

    return res(
      ctx.delay(20),
      ctx.status(200),
      ctx.json({
        shifts,
      })
    );
  }),

  rest.post(`${SHIFTS_URL}/:id/accept`, async (req, res, ctx) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res(ctx.status(401), ctx.json({ error: 'Unauthorized' }));
    }

    const { id } = req.params;

    return res(
      ctx.delay(30),
      ctx.status(200),
      ctx.json({
        shift: {
          id: parseInt(id),
          status: 'accepted',
          acceptedAt: new Date().toISOString(),
        },
      })
    );
  }),

  // Reviews handlers
  rest.get(REVIEWS_URL, (req, res, ctx) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res(ctx.status(401), ctx.json({ error: 'Unauthorized' }));
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

    return res(
      ctx.delay(20),
      ctx.status(200),
      ctx.json({
        reviews,
      })
    );
  }),

  rest.post(REVIEWS_URL, async (req, res, ctx) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res(ctx.status(401), ctx.json({ error: 'Unauthorized' }));
    }

    const body = await req.json();

    if (!body.userId || !body.rating) {
      return res(ctx.status(400), ctx.json({ error: 'userId and rating are required' }));
    }

    return res(
      ctx.delay(30),
      ctx.status(200),
      ctx.json({
        review: {
          id: Date.now(),
          userId: body.userId,
          rating: body.rating,
          comment: body.comment || '',
          createdAt: new Date().toISOString(),
        },
      })
    );
  }),

  // Workers handlers
  rest.get(WORKERS_URL, (req, res, ctx) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res(ctx.status(401), ctx.json({ error: 'Unauthorized' }));
    }

    const searchParams = req.url.searchParams;
    const search = searchParams.get('search') || '';
    const skill = searchParams.get('skill') || '';
    const location = searchParams.get('location') || '';
    const minRating = searchParams.get('minRating');

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

    return res(
      ctx.delay(20),
      ctx.status(200),
      ctx.json({
        workers,
      })
    );
  }),

  // Documents handlers
  rest.get(DOCUMENTS_URL, (req, res, ctx) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res(ctx.status(401), ctx.json({ error: 'Unauthorized' }));
    }

    const documents = [
      {
        id: 1,
        title: 'Паспорт',
        type: 'document',
        documentType: 'passport',
        status: 'verified',
        url: 'https://example.com/documents/passport.pdf',
        fileUrl: 'https://example.com/documents/passport.pdf',
        mimeType: 'application/pdf',
        uploadedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
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
        uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
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
        uploadedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        description: 'Фотография паспорта',
      },
    ];

    return res(
      ctx.delay(20),
      ctx.status(200),
      ctx.json({ documents })
    );
  }),

  rest.get(`${DOCUMENTS_URL}/:id`, (req, res, ctx) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res(ctx.status(401), ctx.json({ error: 'Unauthorized' }));
    }

    const { id } = req.params;
    const documentId = parseInt(id);

    const documents = {
      1: {
        id: 1,
        title: 'Паспорт',
        type: 'document',
        documentType: 'passport',
        status: 'verified',
        url: 'https://example.com/documents/passport.pdf',
        fileUrl: 'https://example.com/documents/passport.pdf',
        mimeType: 'application/pdf',
        uploadedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        description: 'Паспорт гражданина',
      },
      2: {
        id: 2,
        title: 'Медкнижка',
        type: 'document',
        documentType: 'medical',
        status: 'pending',
        url: 'https://example.com/documents/medical.pdf',
        fileUrl: 'https://example.com/documents/medical.pdf',
        mimeType: 'application/pdf',
        uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        description: 'Медицинская книжка',
      },
      3: {
        id: 3,
        title: 'Фото паспорта',
        type: 'photo',
        documentType: 'passport_photo',
        status: 'verified',
        url: 'https://example.com/documents/passport_photo.jpg',
        fileUrl: 'https://example.com/documents/passport_photo.jpg',
        mimeType: 'image/jpeg',
        uploadedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        description: 'Фотография паспорта',
      },
    };

    const document = documents[documentId];

    if (!document) {
      return res(ctx.status(404), ctx.json({ error: 'Document not found' }));
    }

    return res(
      ctx.delay(20),
      ctx.status(200),
      ctx.json({ document })
    );
  }),

  rest.post(DOCUMENTS_URL, async (req, res, ctx) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res(ctx.status(401), ctx.json({ error: 'Unauthorized' }));
    }

    // Для MSW упрощаем обработку - просто возвращаем мок-данные
    const body = await req.json().catch(() => ({}));
    const documentType = body.documentType || 'document';
    const title = body.title || `Документ ${Date.now()}`;
    const description = body.description || '';

    const newDocument = {
      id: Date.now(),
      title,
      type: 'document',
      documentType,
      status: 'pending',
      url: `https://example.com/documents/${Date.now()}.pdf`,
      fileUrl: `https://example.com/documents/${Date.now()}.pdf`,
      mimeType: 'application/pdf',
      uploadedAt: new Date().toISOString(),
      description,
    };

    return res(
      ctx.delay(50),
      ctx.status(200),
      ctx.json({ document: newDocument })
    );
  }),

  rest.post(`${DOCUMENTS_URL}/photos`, async (req, res, ctx) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res(ctx.status(401), ctx.json({ error: 'Unauthorized' }));
    }

    // Для MSW упрощаем обработку - просто возвращаем мок-данные
    const body = await req.json().catch(() => ({}));
    const documentType = body.documentType || 'photo';
    const title = body.title || `Фото документа ${Date.now()}`;
    const description = body.description || '';

    const newDocument = {
      id: Date.now(),
      title,
      type: 'photo',
      documentType,
      status: 'pending',
      url: `https://example.com/documents/${Date.now()}.jpg`,
      fileUrl: `https://example.com/documents/${Date.now()}.jpg`,
      mimeType: 'image/jpeg',
      uploadedAt: new Date().toISOString(),
      description,
    };

    return res(
      ctx.delay(50),
      ctx.status(200),
      ctx.json({ document: newDocument })
    );
  }),

  rest.delete(`${DOCUMENTS_URL}/:id`, async (req, res, ctx) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res(ctx.status(401), ctx.json({ error: 'Unauthorized' }));
    }

    const { id } = req.params;

    return res(
      ctx.delay(30),
      ctx.status(200),
      ctx.json({ success: true })
    );
  }),
];

module.exports = { handlers };

