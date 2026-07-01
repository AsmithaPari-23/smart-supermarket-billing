import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  type: {
    type: String,
    enum: ['Restock', 'Sale', 'Damage', 'Return', 'Adjustment'],
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
    trim: true,
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }
}, {
  timestamps: true
});

const Inventory = mongoose.model('Inventory', inventorySchema);
export default Inventory;
