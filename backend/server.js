const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
});

const usersRoutes = require('./routes/users');
const jobsRoutes = require('./routes/jobs');
const applicationsRoutes = require('./routes/applications');
const skillsRoutes = require('./routes/skills');

const PORT = process.env.PORT || 3000;

// Middleware
// Разрешаем CORS для всех (включая мобильные приложения)
app.use(cors());
app.use(express.json());

// Логгер запросов (чтобы видеть в консоли сервера, что происходит)
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    console.log('Body:', req.body);
    next();
});

// Routes
app.use('/api/users', usersRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/skills', skillsRoutes);

// Health check
app.get('/', (req, res) => {
  res.send('Migrant App API is running');
});

// Start server on ALL interfaces (0.0.0.0), not just localhost
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Access locally via: http://localhost:${PORT}`);
  // Подсказка для пользователя
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
          if (net.family === 'IPv4' && !net.internal) {
              console.log(`Access on network via: http://${net.address}:${PORT}`);
          }
      }
  }
});

server.on('error', (e) => {
  console.error('SERVER ERROR:', e);
});

console.log("Server script finished loading.");