import Bill from '../models/Bills.js';
import Product from '../models/Products.js';

// Pre-seeded default recommendations for empty database
const DEFAULT_ASSOCIATIONS = {
  'Coffee': ['Sugar', 'Milk Powder', 'Biscuits'],
  'Milk': ['Bread', 'Butter', 'Eggs', 'Cereal'],
  'Baby Diapers': ['Baby Wipes', 'Baby Lotion', 'Baby Powder'],
  'Rice': ['Cooking Oil', 'Lentils', 'Spices'],
  'Toothbrush': ['Toothpaste', 'Mouthwash'],
  'Tea': ['Sugar', 'Milk', 'Biscuits']
};

/**
 * AI Recommendation Engine
 */

/**
 * Gets recommendations for products frequently bought together with the current cart items
 * @param {string[]} productIds - Array of product IDs in cart
 * @returns {Promise<Array>} - Recommended products
 */
export const getFrequentlyBoughtTogether = async (productIds) => {
  try {
    if (!productIds || productIds.length === 0) {
      // Return top best sellers if cart is empty
      return await Product.find({ status: 'Active' }).limit(5);
    }

    // 1. Find the target products to get their categories/names
    const targetProducts = await Product.find({ _id: { $in: productIds } });
    const targetNames = targetProducts.map(p => p.name.toLowerCase());
    const targetCategories = targetProducts.map(p => p.category);

    // 2. Query recent bills that contain any of these products to find associations
    const recentBills = await Bill.find({
      'items.productId': { $in: productIds }
    }).limit(100);

    const frequencyMap = {};

    recentBills.forEach(bill => {
      bill.items.forEach(item => {
        const itemPid = item.productId.toString();
        // Don't recommend something already in the cart
        if (!productIds.includes(itemPid)) {
          frequencyMap[itemPid] = (frequencyMap[itemPid] || 0) + 1;
        }
      });
    });

    // Sort by occurrence frequency
    const sortedIds = Object.keys(frequencyMap).sort((a, b) => frequencyMap[b] - frequencyMap[a]);

    let recommendedProducts = [];
    if (sortedIds.length > 0) {
      recommendedProducts = await Product.find({ _id: { $in: sortedIds.slice(0, 4) }, status: 'Active' });
    }

    // 3. Fallback: If database has low transaction history, use pre-seeded rules
    if (recommendedProducts.length < 3) {
      const fallbackNames = [];
      targetNames.forEach(tName => {
        // Find key in associations
        const key = Object.keys(DEFAULT_ASSOCIATIONS).find(k => tName.includes(k.toLowerCase()) || k.toLowerCase().includes(tName));
        if (key) {
          fallbackNames.push(...DEFAULT_ASSOCIATIONS[key]);
        }
      });

      if (fallbackNames.length > 0) {
        const extraProducts = await Product.find({
          name: { $in: fallbackNames.map(name => new RegExp(name, 'i')) },
          _id: { $nin: productIds },
          status: 'Active'
        }).limit(4 - recommendedProducts.length);
        recommendedProducts.push(...extraProducts);
      }
    }

    // Final safety fallback: general active products in same categories
    if (recommendedProducts.length < 3) {
      const extraProducts = await Product.find({
        category: { $in: targetCategories },
        _id: { $nin: [...productIds, ...recommendedProducts.map(p => p._id.toString())] },
        status: 'Active'
      }).limit(4 - recommendedProducts.length);
      recommendedProducts.push(...extraProducts);
    }

    return recommendedProducts;
  } catch (error) {
    console.error('AI Engine Error (Bought Together):', error);
    return [];
  }
};

/**
 * Suggests upsells (higher-priced alternatives in the same category)
 * @param {string} productId - Product ID
 * @returns {Promise<Array>} - Upsell products
 */
export const getUpsellSuggestions = async (productId) => {
  try {
    const product = await Product.findById(productId);
    if (!product) return [];

    // Find products in the same category that are more expensive (up to 30% more) but represent a premium upgrade
    return await Product.find({
      category: product.category,
      sellingPrice: { $gt: product.sellingPrice, $lte: product.sellingPrice * 1.5 },
      _id: { $ne: productId },
      status: 'Active'
    }).sort({ sellingPrice: 1 }).limit(3);
  } catch (error) {
    console.error('AI Engine Error (Upsell):', error);
    return [];
  }
};

/**
 * Predicts customer shopping habits and next purchase details
 * @param {string} customerId - Customer ID
 * @returns {Promise<Object>} - Customer insights
 */
export const getCustomerInsights = async (customerId) => {
  try {
    const bills = await Bill.find({ customerId }).sort({ createdAt: 1 });

    if (bills.length < 2) {
      return {
        shoppingFrequencyDays: 'Need more transaction history',
        estimatedNextPurchaseDate: 'TBD',
        averageBillValue: bills.length === 1 ? bills[0].grandTotal : 0,
        favoriteCategory: 'TBD',
        suggestedRepeatItems: []
      };
    }

    // 1. Calculate Average Shopping Interval
    let totalGapDays = 0;
    for (let i = 1; i < bills.length; i++) {
      const diffTime = Math.abs(bills[i].createdAt - bills[i-1].createdAt);
      totalGapDays += Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    const avgGap = Math.round(totalGapDays / (bills.length - 1)) || 7; // default 7 days

    // 2. Predict next purchase date
    const lastBillDate = bills[bills.length - 1].createdAt;
    const nextPurchaseDate = new Date(lastBillDate);
    nextPurchaseDate.setDate(nextPurchaseDate.getDate() + avgGap);

    // 3. Calculate favorite category and repeat items
    const categoryCount = {};
    const productCount = {};
    let totalSpend = 0;

    bills.forEach(bill => {
      totalSpend += bill.grandTotal;
      bill.items.forEach(item => {
        productCount[item.name] = (productCount[item.name] || 0) + item.quantity;
      });
    });

    // Fetch products to identify categories (we'll estimate from names or query)
    const productNames = Object.keys(productCount);
    const dbProducts = await Product.find({ name: { $in: productNames } });
    
    dbProducts.forEach(p => {
      const count = productCount[p.name];
      categoryCount[p.category] = (categoryCount[p.category] || 0) + count;
    });

    const favCategory = Object.keys(categoryCount).reduce((a, b) => categoryCount[a] > categoryCount[b] ? a : b, 'General');
    
    // Sort repeat items by frequency
    const repeatItems = dbProducts
      .map(p => ({
        _id: p._id,
        name: p.name,
        sellingPrice: p.sellingPrice,
        category: p.category,
        count: productCount[p.name]
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return {
      shoppingFrequencyDays: `${avgGap} days`,
      estimatedNextPurchaseDate: nextPurchaseDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      averageBillValue: Math.round(totalSpend / bills.length),
      favoriteCategory: favCategory,
      suggestedRepeatItems: repeatItems
    };
  } catch (error) {
    console.error('AI Engine Error (Insights):', error);
    return {};
  }
};

/**
 * Generate customized offers for a specific customer based on history
 * @param {string} customerId - Customer ID
 * @returns {Promise<Array>} - Personalized offers
 */
export const getPersonalizedOffers = async (customerId) => {
  try {
    const insights = await getCustomerInsights(customerId);
    const offers = [];

    if (insights.favoriteCategory && insights.favoriteCategory !== 'TBD') {
      offers.push({
        name: `${insights.favoriteCategory} Premium Discount`,
        description: `Get 10% off your next purchase of items in the ${insights.favoriteCategory} section!`,
        type: 'Percentage',
        discountValue: 10,
        targetCategory: insights.favoriteCategory
      });
    }

    if (insights.suggestedRepeatItems && insights.suggestedRepeatItems.length > 0) {
      const topProduct = insights.suggestedRepeatItems[0];
      offers.push({
        name: `Restock Alert: ${topProduct.name}`,
        description: `Running low? Buy 1 get 1 free on your favorite ${topProduct.name}!`,
        type: 'BuyXGetY',
        discountValue: 50,
        targetProductId: topProduct._id
      });
    }

    // Default fallback offers if customer history is low
    if (offers.length === 0) {
      offers.push({
        name: 'Weekly Combo Offer',
        description: 'Get $5 off when you buy Coffee and Biscuits together!',
        type: 'Flat',
        discountValue: 5,
        minPurchase: 30
      });
    }

    return offers;
  } catch (error) {
    console.error('AI Engine Error (Personalized Offers):', error);
    return [];
  }
};
