const prisma = require('../prisma');
const { sendToChat } = require('../websocket');

exports.getChats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find chats where user is participant1 OR participant2
    const chats = await prisma.chat.findMany({
      where: {
        OR: [
          { participant1Id: userId },
          { participant2Id: userId }
        ]
      },
      include: {
        participant1: {
            select: { id: true, email: true, profile: { select: { companyName: true, avatarUrl: true } } }
        },
        participant2: {
            select: { id: true, email: true, profile: { select: { companyName: true, avatarUrl: true } } }
        },
        messages: {
            orderBy: { createdAt: 'desc' },
            take: 1 // Get last message
        }
      }
    });

    // Transform to match frontend structure
    const formattedChats = chats.map(chat => {
        const isP1 = chat.participant1Id === userId;
        const participant = isP1 ? chat.participant2 : chat.participant1;
        const lastMessage = chat.messages[0];
        
        // Calculate unread count (simplified logic: count all unread messages from other user)
        // Real implementation would require a separate count query or aggregation
        const unreadCount = 0; // TODO: Implement real unread count query

        return {
            id: chat.id,
            participant: {
                id: participant.id,
                name: participant.profile?.companyName || participant.email,
                avatar: participant.profile?.avatarUrl
            },
            lastMessage: lastMessage ? {
                text: lastMessage.text,
                createdAt: lastMessage.createdAt,
            } : null,
            unreadCount
        };
    });

    res.json({ chats: formattedChats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
};

exports.getChatMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const chatId = parseInt(req.params.id);
        const limit = parseInt(req.query.limit || '50');

        console.log(`getChatMessages: userId=${userId}, chatId=${chatId}`); // Debug

        // Verify user is part of the chat
        const chat = await prisma.chat.findFirst({
            where: {
                id: chatId,
                OR: [{ participant1Id: userId }, { participant2Id: userId }]
            }
        });

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        const messages = await prisma.message.findMany({
            where: { chatId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                sender: {
                    select: { id: true, email: true, profile: { select: { companyName: true } } }
                }
            }
        });

        res.json({ messages });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
};

exports.sendMessage = async (req, res) => {
    try {
        const userId = req.user.id;
        const chatId = parseInt(req.params.id);
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Message text is required' });
        }

        // Verify participation and get participant IDs
        const chat = await prisma.chat.findFirst({
            where: {
                id: chatId,
                OR: [{ participant1Id: userId }, { participant2Id: userId }]
            }
        });

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        const message = await prisma.message.create({
            data: {
                chatId,
                senderId: userId,
                text
            },
            include: {
                sender: {
                    select: { id: true, email: true }
                }
            }
        });

        // Broadcast to both participants
        // The frontend expects specific event structure, usually type: 'new_message'
        const payload = {
            type: 'new_message',
            message
        };
        sendToChat([chat.participant1Id, chat.participant2Id], payload);

        res.json({ message });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to send message' });
    }
};

// Helper to start a chat (e.g. when applying or accepting job)
exports.createChat = async (req, res) => {
    try {
        const userId = req.user.id;
        const { participantId } = req.body; // The other user ID

        if (!participantId) return res.status(400).json({ error: 'Participant ID required' });

        // Sort IDs to ensure consistency (smaller ID first)
        const p1 = Math.min(userId, participantId);
        const p2 = Math.max(userId, participantId);

        let chat = await prisma.chat.findUnique({
            where: {
                participant1Id_participant2Id: {
                    participant1Id: p1,
                    participant2Id: p2
                }
            }
        });

        if (!chat) {
            chat = await prisma.chat.create({
                data: {
                    participant1Id: p1,
                    participant2Id: p2
                }
            });
        }

        res.json({ chat });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create chat' });
    }
};
