import express from 'express';
import User from '../models/Users.js';
import AuditLog from '../models/AuditLogs.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all staff accounts
// @route   GET /api/users
// @access  Private (Admin only)
router.get('/', protect, authorize('Administrator'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create a new cashier or manager account
// @route   POST /api/users
// @access  Private (Admin only)
router.post('/', protect, authorize('Administrator'), async (req, res) => {
  const { username, password, name, role } = req.body;

  if (!username || !password || !name || !role) {
    return res.status(400).json({ success: false, message: 'Please enter all details' });
  }

  try {
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    const newUser = await User.create({
      username,
      password,
      name,
      role
    });

    // Create Audit Log
    await AuditLog.create({
      performedBy: req.user._id,
      action: 'Create User',
      details: `Created new staff account: ${username} (${role})`
    });

    res.status(201).json({
      success: true,
      user: {
        id: newUser._id,
        username: newUser.username,
        name: newUser.name,
        role: newUser.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Toggle user active status
// @route   PUT /api/users/:id/toggle
// @access  Private (Admin only)
router.put('/:id/toggle', protect, authorize('Administrator'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Protect super admin deactivate self
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own account' });
    }

    user.active = !user.active;
    await user.save();

    // Create Audit Log
    await AuditLog.create({
      performedBy: req.user._id,
      action: 'Toggle User Status',
      details: `Toggled user active state for ${user.username} to ${user.active}`
    });

    res.json({ success: true, message: `Account for ${user.username} has been ${user.active ? 'activated' : 'deactivated'}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get system audit activity logs
// @route   GET /api/users/logs
// @access  Private (Admin only)
router.get('/logs', protect, authorize('Administrator'), async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('performedBy', 'username name role')
      .sort({ createdAt: -1 })
      .limit(100);
    
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
