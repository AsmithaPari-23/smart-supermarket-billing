import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  barcode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  supplier: {
    type: String,
    trim: true,
  },
  mrp: {
    type: Number,
    required: true,
    min: 0,
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  gst: {
    type: Number,
    required: true,
    default: 0, // GST percentage (e.g. 5, 12, 18, 28)
  },
  discount: {
    type: Number,
    default: 0, // Discount percentage (e.g. 10 for 10% off)
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
  },
  expiryDate: {
    type: Date,
  },
  manufacturingDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
  }
}, {
  timestamps: true
});

const Product = mongoose.model('Product', productSchema);
export default Product;
