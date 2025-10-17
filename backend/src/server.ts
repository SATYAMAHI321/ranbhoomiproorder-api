import express, { Express, Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database';
import { initializeSocket } from './config/socket';

// Routes
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';
import chatRoutes from './routes/chatRoutes';
import staffRoutes from './routes/staffRoutes';

// Load environment variables
dotenv.config();

// Create Express app
const app: Express = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'TrackMyORDER API is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/staff', staffRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║                                            ║
║        🚀 TrackMyORDER Server Running       ║
║                                            ║
║        Port: ${PORT}                       ║
║        Environment: ${process.env.NODE_ENV || 'development'}              ║
║                                            ║
╚════════════════════════════════════════════╝
  `);
});

export { io };
