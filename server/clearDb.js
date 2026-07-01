import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/Users.js';
import Product from './models/Products.js';
import Customer from './models/Customers.js';
import Coupon from './models/Coupons.js';
import Offer from './models/Offers.js';
import Supplier from './models/Suppliers.js';

dotenv.config();

const clearDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    console.log('Clearing database placeholders...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Customer.deleteMany({});
    await Coupon.deleteMany({});
    await Offer.deleteMany({});
    await Supplier.deleteMany({});

    console.log('Seeding professional default users...');
    await User.create([
      { username: 'admin', password: 'admin123', name: 'Store Administrator', role: 'Administrator' },
      { username: 'manager', password: 'manager123', name: 'Store Manager', role: 'Manager' },
      { username: 'cashier', password: 'cashier123', name: 'Store Cashier', role: 'Cashier' }
    ]);

    console.log('Database cleared and default users reset successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Database clearing failed:', error);
    process.exit(1);
  }
};

clearDb();
