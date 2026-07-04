import express from 'express';
import Product from '../models/Products.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all products (with search & filtering)
// @route   GET /api/products
// @access  Private (Cashier, Manager, Admin)
router.get('/', protect, async (req, res) => {
  try {
    const { search, category, barcode, limit = 50, page = 1 } = req.query;
    const query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (category) {
      query.category = category;
    }
    if (barcode) {
      query.barcode = barcode;
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ name: 1 });

    res.json({
      success: true,
      count: products.length,
      total,
      products
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all active products for fallback search (public)
// @route   GET /api/products/public/search
// @access  Public
router.get('/public/search', async (req, res) => {
  try {
    const { search } = req.query;
    const query = { status: 'Active' };
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    const products = await Product.find(query).limit(50).sort({ name: 1 });
    res.json({
      success: true,
      products
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get product by ID or Barcode
// @route   GET /api/products/:idOrBarcode
// @access  Private
router.get('/:idOrBarcode', protect, async (req, res) => {
  try {
    const identifier = req.params.idOrBarcode;
    
    // Check if it's a valid MongoDB ObjectId or barcode string
    let product;
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(identifier);
    } else {
      product = await Product.findOne({ barcode: identifier });
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Add a product
// @route   POST /api/products
// @access  Private (Admin, Manager)
router.post('/', protect, authorize('Administrator', 'Manager'), async (req, res) => {
  try {
    const { barcode, name, category, supplier, mrp, sellingPrice, gst, discount, stock, expiryDate, manufacturingDate, status } = req.body;

    const existingProduct = await Product.findOne({ barcode });
    if (existingProduct) {
      return res.status(400).json({ success: false, message: 'Product with this barcode already exists' });
    }

    const product = await Product.create({
      barcode,
      name,
      category,
      supplier,
      mrp,
      sellingPrice,
      gst,
      discount,
      stock,
      expiryDate,
      manufacturingDate,
      status
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update product details
// @route   PUT /api/products/:id
// @access  Private (Admin, Manager)
router.put('/:id', protect, authorize('Administrator', 'Manager'), async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Prevent duplicate barcode
    if (req.body.barcode && req.body.barcode !== product.barcode) {
      const existing = await Product.findOne({ barcode: req.body.barcode });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Product with this barcode already exists' });
      }
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('Administrator'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
