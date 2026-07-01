import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  discountType: {
    type: String,
    enum: ['Flat', 'Percentage'],
    default: 'Percentage',
  },
  discountValue: {
    type: Number,
    required: true,
  },
  minPurchase: {
    type: Number,
    default: 0,
  },
  active: {
    type: Boolean,
    default: true,
  },
  expiryDate: {
    type: Date,
  }
}, {
  timestamps: true
});

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
