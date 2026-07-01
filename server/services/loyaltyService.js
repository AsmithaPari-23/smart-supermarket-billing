/**
 * Smart Supermarket Loyalty Service
 */

// Loyalty Tier thresholds (based on total accumulated points in lifetime)
export const TIER_THRESHOLDS = {
  BRONZE: 0,
  SILVER: 1000,
  GOLD: 5000,
  PLATINUM: 15000
};

// Points multiplier based on tier (points earned per $100 spent)
export const EARNING_RATES = {
  Bronze: 1,      // 1 point per $10 spent (1%)
  Silver: 1.5,    // 1.5 points per $10 spent (1.5%)
  Gold: 2,        // 2 points per $10 spent (2%)
  Platinum: 3     // 3 points per $10 spent (3%)
};

export const POINT_VALUE = 0.10; // Each point is worth $0.10 in savings (or local currency equivalent)

/**
 * Calculate loyalty points earned for a purchase
 * @param {number} purchaseAmount - Total purchase price
 * @param {string} tier - Customer's membership tier
 * @returns {number} - Points earned
 */
export const calculatePointsEarned = (purchaseAmount, tier = 'Bronze') => {
  const rate = EARNING_RATES[tier] || 1;
  // Earn points based on percentage of purchase amount
  const points = (purchaseAmount * (rate / 100));
  return Math.round(points);
};

/**
 * Determine the customer tier based on total lifetime points
 * @param {number} lifetimePoints - Total points accumulated
 * @returns {string} - Tier name
 */
export const determineTier = (lifetimePoints) => {
  if (lifetimePoints >= TIER_THRESHOLDS.PLATINUM) return 'Platinum';
  if (lifetimePoints >= TIER_THRESHOLDS.GOLD) return 'Gold';
  if (lifetimePoints >= TIER_THRESHOLDS.SILVER) return 'Silver';
  return 'Bronze';
};
