import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['Flat', 'Percentage', 'BuyXGetY'],
    default: 'Percentage',
  },
  discountValue: {
    type: Number,
    required: true,
    default: 0,
  },
  minPurchase: {
    type: Number,
    default: 0,
  },
  targetCategory: {
    type: String, // Optional: Category for category-specific offers
    trim: true,
  },
  targetProductId: {
    type: mongoose.Schema.Types.ObjectId, // Optional: Specific product targeted
    ref: 'Product',
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

const Offer = mongoose.model('Offer', offerSchema);
export default Offer;
