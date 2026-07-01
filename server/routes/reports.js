import express from 'express';
import Bill from '../models/Bills.js';
import Product from '../models/Products.js';
import Customer from '../models/Customers.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Helper to generate mock sales records for charts if database is new
const getMockChartData = () => {
  const weeklyLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weeklySales = [12000, 19000, 15000, 22000, 26000, 35000, 31000];

  const monthlyLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyRevenue = [180000, 210000, 195000, 240000, 280000, 320000, 290000, 305000, 340000, 380000, 420000, 490000];

  return {
    weekly: { labels: weeklyLabels, data: weeklySales },
    monthly: { labels: monthlyLabels, data: monthlyRevenue }
  };
};

// @desc    Get dashboard metrics & chart data
// @route   GET /api/reports/dashboard
// @access  Private (Cashier, Manager, Admin)
router.get('/dashboard', protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 1. Core KPIs today
    const salesToday = await Bill.aggregate([
      { $match: { createdAt: { $gte: today, $lt: tomorrow }, status: 'Paid' } },
      { $group: { _id: null, totalRevenue: { $sum: '$grandTotal' }, totalBills: { $sum: 1 } } }
    ]);

    const revenueToday = salesToday[0]?.totalRevenue || 0;
    const billsTodayCount = salesToday[0]?.totalBills || 0;

    const customersTodayCount = await Customer.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    });

    const lowStockCount = await Product.countDocuments({ stock: { $lte: 10 }, status: 'Active' });

    // 2. Recent Bills
    const recentBills = await Bill.find().sort({ createdAt: -1 }).limit(5);

    // 3. Top Products (Aggregated)
    const topProductsAgg = await Bill.aggregate([
      { $match: { status: 'Paid' } },
      { $unwind: '$items' },
      { $group: { _id: '$items.name', count: { $sum: '$items.quantity' }, totalEarned: { $sum: '$items.subtotal' } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    let topProducts = topProductsAgg.map(p => ({
      name: p._id,
      quantity: p.count,
      salesValue: p.totalEarned
    }));

    // Seed top products if empty
    if (topProducts.length === 0) {
      topProducts = [
        { name: 'Fresh Milk 1L', quantity: 245, salesValue: 12250 },
        { name: 'Premium Coffee Beans 250g', quantity: 188, salesValue: 18800 },
        { name: 'Basmati Rice 5kg', quantity: 142, salesValue: 17750 },
        { name: 'Organic Honey 500g', quantity: 110, salesValue: 11000 },
        { name: 'Wheat Flour 10kg', quantity: 95, salesValue: 9500 }
      ];
    }

    // 4. Sales analytics chart data
    const chartData = getMockChartData();

    // Try to compile real monthly revenue chart if database contains records
    const realMonthly = await Bill.aggregate([
      { $match: { status: 'Paid' } },
      {
        $group: {
          _id: { month: { $month: '$createdAt' } },
          total: { $sum: '$grandTotal' }
        }
      },
      { $sort: { '_id.month': 1 } }
    ]);

    if (realMonthly.length > 0) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const realData = Array(12).fill(0);
      realMonthly.forEach(m => {
        realData[m._id.month - 1] = m.total;
      });
      chartData.monthly = {
        labels: monthNames,
        data: realData
      };
    }

    res.json({
      success: true,
      kpis: {
        revenueToday,
        billsToday: billsTodayCount,
        customersToday: customersTodayCount,
        lowStockCount
      },
      recentBills,
      topProducts,
      charts: chartData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get detailed Sales Report
// @route   GET /api/reports/sales
// @access  Private (Manager, Admin)
router.get('/sales', protect, authorize('Administrator', 'Manager'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { status: 'Paid' };
    
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    }

    const bills = await Bill.find(filter);

    // Summing metrics
    let totalSales = 0;
    let totalTax = 0;
    let totalDiscount = 0;
    let totalCoupon = 0;
    let totalRedeemedLoyalty = 0;

    bills.forEach(bill => {
      totalSales += bill.grandTotal;
      totalTax += bill.gstAmount;
      totalDiscount += bill.discountAmount;
      totalCoupon += bill.couponDiscount;
      totalRedeemedLoyalty += (bill.loyaltyPointsRedeemed * 0.1); // point value
    });

    res.json({
      success: true,
      summary: {
        totalSales,
        totalTax,
        totalDiscount,
        totalCoupon,
        totalRedeemedLoyalty,
        totalTransactions: bills.length,
        netProfit: Number((totalSales - totalTax).toFixed(2)) // Simplified profit index
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
