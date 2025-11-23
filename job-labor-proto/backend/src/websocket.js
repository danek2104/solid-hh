const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const url = require('url');
const prisma = require('./prisma');
const { sendPushNotifications } = require('./utils/push');

let wss;

const initWebSocket = (server) => {
  wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    // Verify token from query string ?token=...
    const parameters = url.parse(req.url, true);
    const token = parameters.query.token;

    if (!token) {
      ws.close(1008, 'Token required');
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      ws.user = decoded; // Attach user to ws connection
      
      console.log(`WebSocket: Client connected (User ID: ${decoded.id})`);

      ws.on('message', (message) => {
        // Handle incoming messages if needed (e.g. "typing" status)
        // For now, we mainly use WS for pushing updates TO the client
        try {
            const data = JSON.parse(message);
            if (data.type === 'ping') {
                ws.send(JSON.stringify({ type: 'pong' }));
            }
        } catch (e) {
            // Ignore non-JSON
        }
      });

      ws.on('close', () => {
        console.log(`WebSocket: Client disconnected (User ID: ${decoded.id})`);
      });

    } catch (error) {
      ws.close(1008, 'Invalid token');
    }
  });

  return wss;
};

// Broadcast to specific user
const sendToUser = async (userId, data) => {
  let isOnline = false;

  if (wss) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client.user && client.user.id === userId) {
        client.send(JSON.stringify(data));
        isOnline = true;
      }
    });
  }

  // If user is offline and it's a new message, send Push Notification
  if (!isOnline && data.type === 'new_message') {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { pushToken: true }
        });

        if (user && user.pushToken) {
            const messageBody = data.message.text || 'Новое сообщение';
            const senderName = data.message.sender?.profile?.companyName || 'Собеседник';
            
            await sendPushNotifications(
                [user.pushToken],
                `Сообщение от ${senderName}`,
                messageBody,
                { chatId: data.message.chatId } // Data for deep linking
            );
            console.log(`Push sent to User ${userId}`);
        }
    } catch (error) {
        console.error(`Failed to send push to User ${userId}`, error);
    }
  }
};

// Broadcast to chat participants
const sendToChat = (userIds, data) => {
    userIds.forEach(id => sendToUser(id, data));
};

module.exports = { initWebSocket, sendToUser, sendToChat };
