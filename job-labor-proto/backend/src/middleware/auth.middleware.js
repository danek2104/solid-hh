const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Auth Middleware: No token provided', req.url);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded; // { id, email, role }
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error.message, 'Token:', token ? token.substring(0, 10) + '...' : 'none');
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = authMiddleware;
