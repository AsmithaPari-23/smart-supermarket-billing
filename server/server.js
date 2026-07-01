import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { configureSocket } from './config/socket.js';

// Route Imports
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import billingRoutes from './routes/billing.js';
import customerRoutes from './routes/customers.js';
import inventoryRoutes from './routes/inventory.js';
import reportRoutes from './routes/reports.js';
import userRoutes from './routes/users.js';
import settingsRoutes from './routes/settings.js';

// Models for seeding
import User from './models/Users.js';
import Product from './models/Products.js';
import Customer from './models/Customers.js';
import Coupon from './models/Coupons.js';
import Offer from './models/Offers.js';
import Supplier from './models/Suppliers.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Configure CORS
app.use(cors({
  origin: '*', // Allow all origins for cross-device local testing
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Socket.IO configuration
configureSocket(server);

// API Routing Setup
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Smart Supermarket Billing Server is healthy.' });
});

// Database Auto-Seeder (if empty)
const runSeeder = async () => {
  try {
    // 1. Seed Users
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Seeding default staff accounts...');
      await User.create([
        { username: 'admin', password: 'admin123', name: 'Store Administrator', role: 'Administrator' },
        { username: 'manager', password: 'manager123', name: 'Store Manager', role: 'Manager' },
        { username: 'cashier', password: 'cashier123', name: 'Store Cashier', role: 'Cashier' }
      ]);
      console.log('Seeding staff accounts completed. Defaults: admin/admin123, cashier/cashier123');
    }

    // 2. Seed Suppliers
    const supplierCount = await Supplier.countDocuments();
    if (supplierCount === 0) {
      console.log('Ready for supplier registration...');
    }

    // 3. Seed Products
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      console.log('Ready for inventory catalog insertion...');
    }

    // 4. Seed Customers
    const customerCount = await Customer.countDocuments();
    if (customerCount === 0) {
      console.log('Ready for customer registration...');
    }

    // 5. Seed Coupons
    const couponCount = await Coupon.countDocuments();
    if (couponCount === 0) {
      console.log('Ready for coupon creation...');
    }

    // 6. Seed Offers
    const offerCount = await Offer.countDocuments();
    if (offerCount === 0) {
      console.log('Ready for promo offers setup...');
    }
  } catch (error) {
    console.error('Seeder execution failed:', error);
  }
};

// Start Server
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  runSeeder().then(() => {
    server.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  });
});
