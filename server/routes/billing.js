import express from 'express';
import Bill from '../models/Bills.js';
import Product from '../models/Products.js';
import Customer from '../models/Customers.js';
import Coupon from '../models/Coupons.js';
import Notification from '../models/Notifications.js';
import Inventory from '../models/Inventory.js';
import { protect } from '../middleware/auth.js';
import { calculatePointsEarned, determineTier, POINT_VALUE } from '../services/loyaltyService.js';

const router = express.Router();

// Helper to generate a unique bill number
const generateBillNumber = () => {
  const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `APEX-${dateStr}-${rand}`;
};

// @desc    Process a sale (Checkout)
// @route   POST /api/billing/checkout
// @access  Private (Cashier, Manager, Admin)
router.post('/checkout', protect, async (req, res) => {
  const {
    customerId,
    customerPhone,
    items,
    paymentMethod,
    splitDetails,
    couponCode,
    loyaltyPointsRedeemed = 0
  } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'No items in checkout list' });
  }

  try {
    let billItems = [];
    let subtotal = 0;
    let totalDiscountAmount = 0;
    let totalGstAmount = 0;

    // 1. Process items, check stock, calculate costs
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product ${item.name} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` 
        });
      }

      // Calculations
      const itemPrice = product.sellingPrice;
      const itemGstRate = product.gst;
      const itemDiscountRate = product.discount;

      const baseAmount = itemPrice * item.quantity;
      const discountAmount = Number(((baseAmount * itemDiscountRate) / 100).toFixed(2));
      const taxableAmount = baseAmount - discountAmount;
      const gstAmount = Number(((taxableAmount * itemGstRate) / 100).toFixed(2));
      const itemSubtotal = Number((taxableAmount + gstAmount).toFixed(2));

      billItems.push({
        productId: product._id,
        barcode: product.barcode,
        name: product.name,
        quantity: item.quantity,
        price: itemPrice,
        gstRate: itemGstRate,
        gstAmount,
        discountRate: itemDiscountRate,
        discountAmount,
        subtotal: itemSubtotal
      });

      subtotal += baseAmount;
      totalDiscountAmount += discountAmount;
      totalGstAmount += gstAmount;
    }

    let grandTotal = Number((subtotal - totalDiscountAmount + totalGstAmount).toFixed(2));

    // 2. Handle Coupon Code
    let couponDiscount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode, active: true });
      if (coupon) {
        const isExpired = coupon.expiryDate && new Date(coupon.expiryDate) < new Date();
        if (!isExpired && grandTotal >= coupon.minPurchase) {
          if (coupon.discountType === 'Percentage') {
            couponDiscount = Number(((grandTotal * coupon.discountValue) / 100).toFixed(2));
          } else {
            couponDiscount = coupon.discountValue;
          }
          grandTotal -= couponDiscount;
          grandTotal = Math.max(0, grandTotal);
        }
      }
    }

    // 3. Handle Loyalty Points Redemption
    let customer = null;
    let redeemedValue = 0;
    if (customerId) {
      customer = await Customer.findById(customerId);
      if (customer) {
        if (loyaltyPointsRedeemed > 0) {
          const pointsToRedeem = Math.min(customer.loyaltyPoints, loyaltyPointsRedeemed);
          redeemedValue = Number((pointsToRedeem * POINT_VALUE).toFixed(2));
          grandTotal -= redeemedValue;
          grandTotal = Math.max(0, grandTotal);
          customer.loyaltyPoints -= pointsToRedeem;
        }
      }
    }

    // Round grand total
    grandTotal = Number(grandTotal.toFixed(2));

    // 4. Calculate Loyalty Points Earned
    let pointsEarned = 0;
    if (customer) {
      pointsEarned = calculatePointsEarned(grandTotal, customer.tier);
      customer.loyaltyPoints += pointsEarned;
      // Recalculate tier based on total estimated history or just accumulated points
      customer.tier = determineTier(customer.loyaltyPoints + pointsEarned); // dynamic promotion
      await customer.save();
    }

    // 5. Create the Bill
    const billNumber = generateBillNumber();
    const bill = await Bill.create({
      billNumber,
      customerId: customer ? customer._id : null,
      customerPhone: customerPhone || (customer ? customer.phone : null),
      cashierId: req.user._id,
      cashierName: req.user.name,
      items: billItems,
      paymentMethod,
      splitDetails: paymentMethod === 'Split' ? splitDetails : undefined,
      subtotal,
      discountAmount: totalDiscountAmount,
      gstAmount: totalGstAmount,
      couponCode: couponCode || undefined,
      couponDiscount,
      loyaltyPointsEarned: pointsEarned,
      loyaltyPointsRedeemed: loyaltyPointsRedeemed > 0 ? Math.min(customer?.loyaltyPoints || 0, loyaltyPointsRedeemed) : 0,
      grandTotal,
      status: 'Paid'
    });

    // 6. Update Product Stocks, Create Alerts & Logs
    for (const item of billItems) {
      const product = await Product.findById(item.productId);
      product.stock -= item.quantity;
      await product.save();

      // Log stock transaction
      await Inventory.create({
        productId: product._id,
        type: 'Sale',
        quantity: -item.quantity,
        reason: `Sold in Invoice ${billNumber}`,
        performedBy: req.user._id
      });

      // Low stock check & notifications
      if (product.stock <= 10) {
        const title = `Low Stock Alert: ${product.name}`;
        const message = `Stock level for ${product.name} has fallen to ${product.stock}. Please reorder soon.`;
        
        // Prevent duplicate low stock alert notifications
        const recentAlert = await Notification.findOne({
          title,
          read: false
        });

        if (!recentAlert) {
          await Notification.create({
            title,
            message,
            type: 'LowStock'
          });
        }
      }
    }

    res.status(201).json({
      success: true,
      bill,
      loyalty: customer ? {
        pointsEarned,
        totalPoints: customer.loyaltyPoints,
        tier: customer.tier
      } : null
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all bills (history)
// @route   GET /api/billing/history
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const { startDate, endDate, phone, cashierId, limit = 50, page = 1 } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    }
    if (phone) {
      query.customerPhone = phone;
    }
    if (cashierId) {
      query.cashierId = cashierId;
    }

    const total = await Bill.countDocuments(query);
    const bills = await Bill.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bills.length,
      total,
      bills
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get detailed bill by billNumber
// @route   GET /api/billing/bill/:billNumber
// @access  Private
router.get('/bill/:billNumber', protect, async (req, res) => {
  try {
    const bill = await Bill.findOne({ billNumber: req.params.billNumber });
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    res.json({ success: true, bill });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
