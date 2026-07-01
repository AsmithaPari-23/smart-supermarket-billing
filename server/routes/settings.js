import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { protect, authorize } from '../middleware/auth.js';

// Mongoose models for backup/restore
import User from '../models/Users.js';
import Customer from '../models/Customers.js';
import Product from '../models/Products.js';
import Bill from '../models/Bills.js';
import Offer from '../models/Offers.js';
import Coupon from '../models/Coupons.js';
import Inventory from '../models/Inventory.js';
import Supplier from '../models/Suppliers.js';
import Notification from '../models/Notifications.js';
import AuditLog from '../models/AuditLogs.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const settingsFilePath = path.join(__dirname, '..', 'config', 'storeSettings.json');

// Helper to load settings
const loadSettings = () => {
  try {
    if (fs.existsSync(settingsFilePath)) {
      const data = fs.readFileSync(settingsFilePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading settings:', err);
  }
  // Default values
  return {
    storeName: "Apex Supermarket",
    address: "123 Commercial Plaza, Tech City",
    phone: "+91 98765 43210",
    gstNumber: "29AAAAA1111A1Z1",
    receiptFooter: "Thank you for shopping with us!",
    currency: "INR",
    currencySymbol: "₹",
    taxRate: 18 // default GST percentage
  };
};

// Helper to save settings
const saveSettings = (settings) => {
  try {
    const dir = path.dirname(settingsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving settings:', err);
    return false;
  }
};

// @desc    Get store settings
// @route   GET /api/settings
// @access  Private
router.get('/', protect, (req, res) => {
  const settings = loadSettings();
  res.json({ success: true, settings });
});

// @desc    Update store settings
// @route   PUT /api/settings
// @access  Private (Admin only)
router.put('/', protect, authorize('Administrator'), (req, res) => {
  const success = saveSettings(req.body);
  if (success) {
    res.json({ success: true, settings: req.body, message: 'Settings updated successfully' });
  } else {
    res.status(500).json({ success: false, message: 'Could not save settings' });
  }
});

// @desc    Backup all collections in database to a JSON file
// @route   POST /api/settings/backup
// @access  Private (Admin only)
router.post('/backup', protect, authorize('Administrator'), async (req, res) => {
  try {
    const backupData = {
      users: await User.find(),
      customers: await Customer.find(),
      products: await Product.find(),
      bills: await Bill.find(),
      offers: await Offer.find(),
      coupons: await Coupon.find(),
      inventory: await Inventory.find(),
      suppliers: await Supplier.find(),
      notifications: await Notification.find(),
      auditLogs: await AuditLog.find(),
      settings: loadSettings(),
      backedUpAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Backup completed successfully',
      backup: backupData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Restore database from an uploaded JSON backup
// @route   POST /api/settings/restore
// @access  Private (Admin only)
router.post('/restore', protect, authorize('Administrator'), async (req, res) => {
  const { backupData } = req.body;

  if (!backupData) {
    return res.status(400).json({ success: false, message: 'No backup data supplied' });
  }

  try {
    // Re-seed all collections
    if (backupData.users) {
      await User.deleteMany({});
      await User.insertMany(backupData.users);
    }
    if (backupData.customers) {
      await Customer.deleteMany({});
      await Customer.insertMany(backupData.customers);
    }
    if (backupData.products) {
      await Product.deleteMany({});
      await Product.insertMany(backupData.products);
    }
    if (backupData.bills) {
      await Bill.deleteMany({});
      await Bill.insertMany(backupData.bills);
    }
    if (backupData.offers) {
      await Offer.deleteMany({});
      await Offer.insertMany(backupData.offers);
    }
    if (backupData.coupons) {
      await Coupon.deleteMany({});
      await Coupon.insertMany(backupData.coupons);
    }
    if (backupData.inventory) {
      await Inventory.deleteMany({});
      await Inventory.insertMany(backupData.inventory);
    }
    if (backupData.suppliers) {
      await Supplier.deleteMany({});
      await Supplier.insertMany(backupData.suppliers);
    }
    if (backupData.notifications) {
      await Notification.deleteMany({});
      await Notification.insertMany(backupData.notifications);
    }
    if (backupData.auditLogs) {
      await AuditLog.deleteMany({});
      await AuditLog.insertMany(backupData.auditLogs);
    }
    if (backupData.settings) {
      saveSettings(backupData.settings);
    }

    res.json({
      success: true,
      message: 'Database restore finished successfully. All tables updated.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
