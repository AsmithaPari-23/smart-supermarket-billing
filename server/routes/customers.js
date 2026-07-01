import express from 'express';
import Customer from '../models/Customers.js';
import Bill from '../models/Bills.js';
import { protect } from '../middleware/auth.js';
import { getCustomerInsights, getPersonalizedOffers } from '../services/aiEngine.js';

const router = express.Router();

// Helper to generate unique membership ID
const generateMembershipId = () => {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `MEM-${rand}`;
};

// @desc    Search customers by phone number or name
// @route   GET /api/customers/search
// @access  Private
router.get('/search', protect, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, message: 'Please provide search query' });
    }

    const customers = await Customer.find({
      $or: [
        { phone: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } }
      ]
    }).limit(10);

    res.json({ success: true, customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Register a new customer
// @route   POST /api/customers/register
// @access  Private
router.post('/register', protect, async (req, res) => {
  try {
    const { name, phone, email, address, dob } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and Phone number are required' });
    }

    const existingCustomer = await Customer.findOne({ phone });
    if (existingCustomer) {
      return res.status(400).json({ success: false, message: 'Customer with this phone number already registered' });
    }

    const customer = await Customer.create({
      name,
      phone,
      email,
      address,
      dob,
      membershipId: generateMembershipId()
    });

    res.status(201).json({ success: true, customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get detailed customer profile, purchase history, and AI insights
// @route   GET /api/customers/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Fetch purchase history
    const bills = await Bill.find({ customerId: customer._id }).sort({ createdAt: -1 });

    // Fetch AI insights & personalized offers
    const insights = await getCustomerInsights(customer._id);
    const offers = await getPersonalizedOffers(customer._id);

    res.json({
      success: true,
      customer,
      history: {
        totalBills: bills.length,
        bills
      },
      insights,
      offers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
