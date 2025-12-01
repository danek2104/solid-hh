const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();

const usersRoutes = require('./routes/users');
const jobsRoutes = require('./routes/jobs');
const applicationsRoutes = require('./routes/applications');

const PORT = process.env.PORT || 3000;

// Middleware
// Разрешаем CORS для всех (включая мобильные приложения)
app.use(cors());

// Логгер запросов (чтобы видеть в консоли сервера, что происходит)
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    console.log('Body:', req.body);
    next();
});

app.use(express.json());

// Routes
app.use('/api/users', usersRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/applications', applicationsRoutes);

// Health check
app.get('/', (req, res) => {
  res.send('Migrant App API is running');
});

// Start server on ALL interfaces (0.0.0.0), not just localhost
app.listen(PORT, '0.0.0.0', () => {
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