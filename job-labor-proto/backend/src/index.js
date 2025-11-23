require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const jobsRoutes = require('./routes/jobs.routes');
const profileRoutes = require('./routes/profile.routes');
const chatsRoutes = require('./routes/chats.routes');
const shiftsRoutes = require('./routes/shifts.routes');
const documentsRoutes = require('./routes/documents.routes');

const { initWebSocket } = require('./websocket');

const { limiter } = require('./middleware/rateLimit.middleware');



const app = express();

const PORT = process.env.PORT || 3001;



app.use(cors());

app.use(express.json());

app.use('/api', limiter); // Apply global rate limit to API routes



// Serve uploaded files

app.use('/uploads', express.static('uploads'));



// API Routes

app.use('/api', authRoutes);

app.use('/api/jobs', jobsRoutes);

app.use('/api/profile', profileRoutes);

app.use('/api/chats', chatsRoutes);

app.use('/api/shifts', shiftsRoutes);

app.use('/api/documents', documentsRoutes);



// Health check

app.get('/', (req, res) => {

  res.send('Job Labor API is running');

});



const server = app.listen(PORT, () => {

  console.log(`Server is running on http://localhost:${PORT}`);

});



// Initialize WebSocket

initWebSocket(server);


