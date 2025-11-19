const { setupServer } = require('msw/native');
const { handlers } = require('./handlers');

const server = setupServer(...handlers);

module.exports = { server };

