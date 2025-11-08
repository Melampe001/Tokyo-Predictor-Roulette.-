/**
 * Subscription Routes
 * 
 * Handles subscription management, upgrades, and status checks
 * 
 * SECURITY NOTE: For production deployment:
 * - Add rate limiting to prevent abuse
 * - Validate subscription changes don't bypass payment
 * - Implement proper authorization checks for enterprise features
 */

import express from 'express';
import { Subscription, SubscriptionTiers, SubscriptionStatus, subscriptionStore } from '../models/Subscription.js';
import { userStore } from '../models/User.js';
import { authenticate, requirePremium } from '../middleware/auth.js';

const router = express.Router();

/**
 * Pricing configuration (in Mexican Pesos - MXN)
 * Basic tier is FREE, no billing required
 */
const PRICING = {
  [SubscriptionTiers.BASIC]: {
    monthly: 0,
    yearly: 0
  },
  [SubscriptionTiers.ADVANCED]: {
    monthly: 99,
    yearly: 990
  },
  [SubscriptionTiers.PREMIUM]: {
    monthly: 149,
    yearly: 1490
  }
};

/**
 * GET /api/subscriptions/tiers
 * Get available subscription tiers and pricing
 */
router.get('/tiers', async (req, res) => {
  try {
    const tiers = Object.keys(PRICING).map(tier => ({
      tier,
      pricing: PRICING[tier],
      features: getFeaturesByTier(tier)
    }));

    res.json({
      success: true,
      data: tiers
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get tiers',
      message: error.message
    });
  }
});

/**
 * GET /api/subscriptions/me
 * Get current user's subscription
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    let subscription = subscriptionStore.findByUserId(req.user.id);

    // Create basic (free) subscription if none exists
    if (!subscription) {
      subscription = subscriptionStore.create({
        userId: req.user.id,
        tier: SubscriptionTiers.BASIC,
        status: SubscriptionStatus.ACTIVE,
        price: 0
      });
    }

    res.json({
      success: true,
      data: subscription.toJSON()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get subscription',
      message: error.message
    });
  }
});

/**
 * POST /api/subscriptions/create
 * Create or upgrade subscription
 */
router.post('/create', authenticate, async (req, res) => {
  try {
    const { tier, billingCycle } = req.body;

    // Validate input
    if (!tier || !billingCycle) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Tier and billing cycle are required'
      });
    }

    if (!Object.values(SubscriptionTiers).includes(tier)) {
      return res.status(400).json({
        error: 'Invalid tier',
        message: 'Invalid subscription tier'
      });
    }

    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return res.status(400).json({
        error: 'Invalid billing cycle',
        message: 'Billing cycle must be monthly or yearly'
      });
    }

    // Get price
    const price = PRICING[tier][billingCycle];

    // Check existing subscription
    let subscription = subscriptionStore.findByUserId(req.user.id);

    if (subscription) {
      // Update existing subscription
      subscription = subscriptionStore.update(subscription.id, {
        tier,
        billingCycle,
        price,
        status: SubscriptionStatus.PENDING
      });
    } else {
      // Create new subscription
      subscription = subscriptionStore.create({
        userId: req.user.id,
        tier,
        billingCycle,
        price,
        status: SubscriptionStatus.PENDING
      });
    }

    res.status(201).json({
      success: true,
      message: 'Subscription created. Proceed to payment.',
      data: subscription.toJSON()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create subscription',
      message: error.message
    });
  }
});

/**
 * POST /api/subscriptions/activate
 * Activate a pending subscription (called after successful payment)
 */
router.post('/activate', authenticate, async (req, res) => {
  try {
    const subscription = subscriptionStore.findByUserId(req.user.id);

    if (!subscription) {
      return res.status(404).json({
        error: 'Subscription not found',
        message: 'No subscription found for this user'
      });
    }

    if (subscription.status === SubscriptionStatus.ACTIVE) {
      return res.status(400).json({
        error: 'Already active',
        message: 'Subscription is already active'
      });
    }

    // Activate subscription
    const durationDays = subscription.billingCycle === 'yearly' ? 365 : 30;
    subscription.activate(durationDays);

    // Update user premium status
    const isPremium = subscription.tier !== SubscriptionTiers.FREE;
    userStore.update(req.user.id, {
      isPremium,
      subscriptionId: subscription.id
    });

    res.json({
      success: true,
      message: 'Subscription activated successfully',
      data: subscription.toJSON()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to activate subscription',
      message: error.message
    });
  }
});

/**
 * POST /api/subscriptions/cancel
 * Cancel subscription
 */
router.post('/cancel', authenticate, async (req, res) => {
  try {
    const { immediate } = req.body;

    const subscription = subscriptionStore.findByUserId(req.user.id);

    if (!subscription) {
      return res.status(404).json({
        error: 'Subscription not found',
        message: 'No subscription found for this user'
      });
    }

    if (subscription.status === SubscriptionStatus.CANCELLED) {
      return res.status(400).json({
        error: 'Already cancelled',
        message: 'Subscription is already cancelled'
      });
    }

    // Cancel subscription
    subscription.cancel(immediate);

    // Update user premium status if immediate cancellation
    if (immediate) {
      userStore.update(req.user.id, {
        isPremium: false,
        subscriptionId: null
      });
    }

    res.json({
      success: true,
      message: immediate ? 'Subscription cancelled immediately' : 'Subscription will cancel at end of period',
      data: subscription.toJSON()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to cancel subscription',
      message: error.message
    });
  }
});

/**
 * POST /api/subscriptions/renew
 * Renew subscription (for auto-renewal or manual renewal)
 */
router.post('/renew', authenticate, async (req, res) => {
  try {
    const subscription = subscriptionStore.findByUserId(req.user.id);

    if (!subscription) {
      return res.status(404).json({
        error: 'Subscription not found',
        message: 'No subscription found for this user'
      });
    }

    // Renew subscription
    const durationDays = subscription.billingCycle === 'yearly' ? 365 : 30;
    subscription.renew(durationDays);

    // Update user premium status
    const isPremium = subscription.tier !== SubscriptionTiers.FREE;
    userStore.update(req.user.id, {
      isPremium,
      subscriptionId: subscription.id
    });

    res.json({
      success: true,
      message: 'Subscription renewed successfully',
      data: subscription.toJSON()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to renew subscription',
      message: error.message
    });
  }
});

/**
 * Helper function to get features by tier
 */
function getFeaturesByTier(tier) {
  const features = {
    [SubscriptionTiers.BASIC]: [
      'Basic predictions',
      'Limited analysis history',
      'Standard support',
      'No billing required'
    ],
    [SubscriptionTiers.ADVANCED]: [
      'All basic features',
      'Advanced predictions',
      'Extended analysis history (30 days)',
      'Real-time updates',
      'Priority support'
    ],
    [SubscriptionTiers.PREMIUM]: [
      'All advanced features',
      'Unlimited analysis history',
      'Advanced analytics dashboard',
      'Premium support',
      'Export to PDF',
      'Custom integrations'
    ]
  };

  return features[tier] || [];
}

export default router;
