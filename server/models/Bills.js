import mongoose from 'mongoose';

const billItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  barcode: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number, // Selling price before item-level discount/GST
    required: true,
  },
  gstRate: {
    type: Number, // GST percentage
    required: true,
    default: 0,
  },
  gstAmount: {
    type: Number,
    required: true,
    default: 0,
  },
  discountRate: {
    type: Number, // Discount percentage
    required: true,
    default: 0,
  },
  discountAmount: {
    type: Number,
    required: true,
    default: 0,
  },
  subtotal: {
    type: Number, // (Price * Qty) - Discount + GST
    required: true,
  }
});

const billSchema = new mongoose.Schema({
  billNumber: {
    type: String,
    required: true,
    unique: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
  },
  customerPhone: {
    type: String,
  },
  cashierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  cashierName: {
    type: String,
    required: true,
  },
  items: [billItemSchema],
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'UPI', 'Split'],
    required: true,
  },
  splitDetails: {
    cashAmount: { type: Number, default: 0 },
    cardAmount: { type: Number, default: 0 },
    upiAmount: { type: Number, default: 0 }
  },
  subtotal: {
    type: Number,
    required: true,
  },
  discountAmount: {
    type: Number,
    default: 0,
  },
  gstAmount: {
    type: Number,
    default: 0,
  },
  couponCode: {
    type: String,
  },
  couponDiscount: {
    type: Number,
    default: 0,
  },
  loyaltyPointsEarned: {
    type: Number,
    default: 0,
  },
  loyaltyPointsRedeemed: {
    type: Number,
    default: 0,
  },
  grandTotal: {
    type: Number,
    required: true,
  },
  emailSent: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['Paid', 'Refunded', 'Exchanged'],
    default: 'Paid',
  }
}, {
  timestamps: true
});

const Bill = mongoose.model('Bill', billSchema);
export default Bill;
