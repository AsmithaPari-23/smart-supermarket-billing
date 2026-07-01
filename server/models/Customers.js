import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  phone: {
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
  email: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
  },
  dob: {
    type: Date,
  },
  membershipId: {
    type: String,
    unique: true,
    required: true,
  },
  loyaltyPoints: {
    type: Number,
    default: 0,
  },
  tier: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold', 'Platinum'],
    default: 'Bronze',
  }
}, {
  timestamps: true
});

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
