import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import Chat from '../models/Chat';
import mongoose from 'mongoose';

export const initializeSocket = (httpServer: HTTPServer) => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Store active connections
  const activeConnections = new Map<string, string>(); // trackingId -> socketId

  io.on('connection', (socket: Socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    // Join chat room by tracking ID
    socket.on('join-chat', async (trackingId: string) => {
      try {
        const room = `chat-${trackingId.toUpperCase()}`;
        socket.join(room);
        activeConnections.set(trackingId.toUpperCase(), socket.id);
        
        console.log(`📝 Client ${socket.id} joined room: ${room}`);

        // Get existing chat
        const chat = await Chat.findOne({ trackingId: trackingId.toUpperCase() });
        
        if (chat) {
          socket.emit('chat-history', chat);
        }
      } catch (error) {
        console.error('Join chat error:', error);
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    // Handle user message
    socket.on('user-message', async (data: { trackingId: string; message: string; customerName: string; customerEmail?: string }) => {
      try {
        const { trackingId, message, customerName, customerEmail } = data;

        if (!trackingId || !message || !customerName) {
          socket.emit('error', { message: 'Invalid message data' });
          return;
        }

        // Find or create chat
        let chat = await Chat.findOne({ trackingId: trackingId.toUpperCase() });

        if (!chat) {
          chat = await Chat.create({
            trackingId: trackingId.toUpperCase(),
            customerName,
            customerEmail,
            messages: [],
          });
        }

        // Add message
        const newMessage = {
          sender: 'user' as const,
          message,
          timestamp: new Date(),
        };

        chat.messages.push(newMessage);
        chat.lastMessageAt = new Date();
        chat.isUnreadByAdmin = true;
        await chat.save();

        // Emit to room
        const room = `chat-${trackingId.toUpperCase()}`;
        io.to(room).emit('new-message', {
          chat,
          message: newMessage,
        });

        // Notify admin dashboard
        io.emit('chat-update', { chat });

        console.log(`💬 User message in ${room}`);
      } catch (error) {
        console.error('User message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle admin message
    socket.on('admin-message', async (data: { 
      trackingId: string; 
      message: string; 
      adminId: string; 
      adminName: string;
    }) => {
      try {
        const { trackingId, message, adminId, adminName } = data;

        if (!trackingId || !message || !adminId || !adminName) {
          socket.emit('error', { message: 'Invalid message data' });
          return;
        }

        const chat = await Chat.findOne({ trackingId: trackingId.toUpperCase() });

        if (!chat) {
          socket.emit('error', { message: 'Chat not found' });
          return;
        }

        // Add message
        const newMessage = {
          sender: 'admin' as const,
          message,
          timestamp: new Date(),
          adminId: new mongoose.Types.ObjectId(adminId),
          adminName,
        };

        chat.messages.push(newMessage);
        chat.lastMessageAt = new Date();
        chat.isUnreadByAdmin = false;
        await chat.save();

        // Emit to room
        const room = `chat-${trackingId.toUpperCase()}`;
        io.to(room).emit('new-message', {
          chat,
          message: newMessage,
        });

        // Notify admin dashboard
        io.emit('chat-update', { chat });

        console.log(`👨‍💼 Admin message in ${room}`);
      } catch (error) {
        console.error('Admin message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Admin joins dashboard to receive all chat updates
    socket.on('admin-join', () => {
      socket.join('admin-dashboard');
      console.log(`👨‍💼 Admin joined dashboard: ${socket.id}`);
    });

    // Handle typing indicator
    socket.on('typing', (data: { trackingId: string; isTyping: boolean; name: string }) => {
      const room = `chat-${data.trackingId.toUpperCase()}`;
      socket.to(room).emit('typing', data);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      // Remove from active connections
      for (const [trackingId, socketId] of activeConnections.entries()) {
        if (socketId === socket.id) {
          activeConnections.delete(trackingId);
          break;
        }
      }
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  return io;
};
