const { rest } = require('msw');

const AUTH_URL = 'https://api.workmatch.dev/auth';
const VERIFY_URL = 'https://api.workmatch.dev/verify';

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
];

module.exports = { handlers };

