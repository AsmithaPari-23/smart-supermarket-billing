import express from 'express';
import Product from '../models/Products.js';
import Inventory from '../models/Inventory.js';
import Supplier from '../models/Suppliers.js';
import Notification from '../models/Notifications.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get inventory status overview (Low Stock & Expiry alerts)
// @route   GET /api/inventory/overview
// @access  Private (Cashier, Manager, Admin)
router.get('/overview', protect, async (req, res) => {
  try {
    const lowStockCount = await Product.countDocuments({ stock: { $lte: 10 }, status: 'Active' });
    const lowStockItems = await Product.find({ stock: { $lte: 10 }, status: 'Active' }).limit(10);
    
    // Find products expiring in the next 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringItemsCount = await Product.countDocuments({
      expiryDate: { $gte: new Date(), $lte: thirtyDaysFromNow },
      status: 'Active'
    });

    const expiringItems = await Product.find({
      expiryDate: { $gte: new Date(), $lte: thirtyDaysFromNow },
      status: 'Active'
    }).limit(10);

    const outOfStockCount = await Product.countDocuments({ stock: 0 });

    res.json({
      success: true,
      stats: {
        lowStockCount,
        expiringItemsCount,
        outOfStockCount
      },
      lowStockItems,
      expiringItems
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Log a manual restock / stock adjustment
// @route   POST /api/inventory/adjust
// @access  Private (Manager, Admin)
router.post('/adjust', protect, authorize('Administrator', 'Manager'), async (req, res) => {
  const { productId, quantity, type, reason } = req.body;

  if (!productId || quantity === undefined || !type) {
    return res.status(400).json({ success: false, message: 'Please provide product ID, quantity adjustment, and transaction type' });
  }

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Adjust stock
    product.stock += Number(quantity);
    if (product.stock < 0) {
      return res.status(400).json({ success: false, message: 'Adjusted stock cannot drop below zero' });
    }
    await product.save();

    // Create log
    const log = await Inventory.create({
      productId: product._id,
      type,
      quantity,
      reason,
      performedBy: req.user._id
    });

    // Clear low stock notification if stock is restored
    if (product.stock > 10) {
      await Notification.deleteMany({ title: new RegExp(product.name, 'i'), type: 'LowStock' });
    }

    res.json({ success: true, product, log });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get stock history logs
// @route   GET /api/inventory/history
// @access  Private (Manager, Admin)
router.get('/history', protect, authorize('Administrator', 'Manager'), async (req, res) => {
  try {
    const logs = await Inventory.find()
      .populate('productId', 'name barcode category')
      .populate('performedBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get active suppliers list
// @route   GET /api/inventory/suppliers
// @access  Private
router.get('/suppliers', protect, async (req, res) => {
  try {
    const suppliers = await Supplier.find({ active: true });
    res.json({ success: true, suppliers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Add supplier details
// @route   POST /api/inventory/suppliers
// @access  Private (Manager, Admin)
router.post('/suppliers', protect, authorize('Administrator', 'Manager'), async (req, res) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json({ success: true, supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
