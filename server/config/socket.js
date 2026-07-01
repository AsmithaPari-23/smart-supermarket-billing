import { Server } from 'socket.io';
import Product from '../models/Products.js';

export const configureSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: '*', // Allow all origins for cross-device local testing
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join cashier dashboard / scanner session room
    socket.on('join-session', (roomCode) => {
      socket.join(roomCode);
      console.log(`Socket ${socket.id} joined room: ${roomCode}`);
      
      // Notify other members of the room (e.g. dashboard knows scanner connected)
      socket.to(roomCode).emit('device-connected', { deviceId: socket.id });
    });

    // Barcode scanned event from mobile device
    socket.on('barcode-scanned', async (data) => {
      const { roomCode, barcode } = data;
      console.log(`Barcode scanned: ${barcode} in room: ${roomCode}`);

      try {
        // Query product details from database
        const product = await Product.findOne({ barcode, status: 'Active' });
        
        if (product) {
          // Send product details back to cashier dashboard
          io.to(roomCode).emit('product-found', product);
          // Acknowledge scanning device
          socket.emit('scan-success', { name: product.name });
        } else {
          // Product not registered
          io.to(roomCode).emit('product-not-found', { barcode });
          socket.emit('scan-failed', { message: 'Product not registered' });
        }
      } catch (error) {
        console.error('Socket scan handling error:', error);
        socket.emit('scan-error', { message: 'Server database error' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};
