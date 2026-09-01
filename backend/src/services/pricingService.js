const { BASE_PRICES, PRICING, EMERGENCY_MULTIPLIER } = require('../config/constants');

function calculatePricing(serviceName, isEmergency = false) {
  const base = BASE_PRICES[serviceName] ?? 300;
  const totalAmount = isEmergency ? Math.round(base * EMERGENCY_MULTIPLIER) : base;

  const workerEarnings = Math.round(totalAmount * PRICING.WORKER_EARNINGS_PCT);
  const cooperativeContribution = Math.round(totalAmount * PRICING.COOP_OPERATIONS_PCT);
  const welfareContribution = Math.round(totalAmount * PRICING.WELFARE_CONTRIBUTION_PCT);
  const damageInsurancePremium = Math.round(totalAmount * PRICING.DAMAGE_INSURANCE_PCT);

  return {
    basePrice: totalAmount,
    totalAmount,
    workerEarnings,
    cooperativeContribution,
    welfareContribution,
    damageInsurancePremium,
  };
}

module.exports = { calculatePricing };
