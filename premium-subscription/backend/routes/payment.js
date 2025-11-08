/**
 * Payment Routes
 * 
 * Handles payment processing for subscriptions
 * This is a mock implementation - in production, integrate with Stripe, PayPal, etc.
 * 
 * SECURITY NOTE: For production deployment:
 * - Add rate limiting to prevent abuse (especially on payment endpoints)
 * - Use a PCI-compliant payment processor
 * - Never store full credit card numbers or CVV codes
 * - Implement fraud detection
 * - Add webhook signature verification for payment gateway callbacks
 */

import express from 'express';
import crypto from 'crypto';
import { subscriptionStore, SubscriptionStatus } from '../models/Subscription.js';
import { userStore } from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * Payment methods
 */
const PaymentMethods = {
  CREDIT_CARD: 'credit_card',
  PAYPAL: 'paypal',
  BANK_TRANSFER: 'bank_transfer',
  CRYPTO: 'crypto'
};

/**
 * Payment status
 */
const PaymentStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

/**
 * In-memory payment storage (for demonstration)
 */
class PaymentStore {
  constructor() {
    this.payments = new Map();
    this.nextId = 1;
  }

  create(paymentData) {
    const payment = {
      id: this.nextId++,
      userId: paymentData.userId,
      subscriptionId: paymentData.subscriptionId,
      amount: paymentData.amount,
      currency: paymentData.currency || 'USD',
      method: paymentData.method,
      status: PaymentStatus.PENDING,
      transactionId: crypto.randomBytes(16).toString('hex'),
      metadata: paymentData.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.payments.set(payment.id, payment);
    return payment;
  }

  findById(id) {
    return this.payments.get(id) || null;
  }

  update(id, updates) {
    const payment = this.findById(id);
    if (!payment) {
      throw new Error('Payment not found');
    }

    Object.assign(payment, updates);
    payment.updatedAt = new Date().toISOString();
    return payment;
  }

  getByUserId(userId) {
    return Array.from(this.payments.values())
      .filter(p => p.userId === userId);
  }

  clear() {
    this.payments.clear();
    this.nextId = 1;
  }
}

const paymentStore = new PaymentStore();

/**
 * GET /api/payment/methods
 * Get available payment methods
 */
router.get('/methods', async (req, res) => {
  try {
    const methods = Object.values(PaymentMethods).map(method => ({
      method,
      name: formatPaymentMethod(method),
      enabled: true
    }));

    res.json({
      success: true,
      data: methods
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get payment methods',
      message: error.message
    });
  }
});

/**
 * POST /api/payment/initiate
 * Initiate a payment for a subscription
 */
router.post('/initiate', authenticate, async (req, res) => {
  try {
    const { subscriptionId, method, paymentDetails } = req.body;

    // Validate input
    if (!subscriptionId || !method) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Subscription ID and payment method are required'
      });
    }

    if (!Object.values(PaymentMethods).includes(method)) {
      return res.status(400).json({
        error: 'Invalid payment method',
        message: 'Payment method is not supported'
      });
    }

    // Get subscription
    const subscription = subscriptionStore.findById(subscriptionId);

    if (!subscription) {
      return res.status(404).json({
        error: 'Subscription not found',
        message: 'Subscription not found'
      });
    }

    // Verify ownership
    if (subscription.userId !== req.user.id) {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'You can only pay for your own subscriptions'
      });
    }

    // Create payment record
    const payment = paymentStore.create({
      userId: req.user.id,
      subscriptionId: subscription.id,
      amount: subscription.price,
      currency: subscription.currency,
      method,
      metadata: {
        tier: subscription.tier,
        billingCycle: subscription.billingCycle,
        paymentDetails: paymentDetails || {}
      }
    });

    res.status(201).json({
      success: true,
      message: 'Payment initiated',
      data: {
        paymentId: payment.id,
        transactionId: payment.transactionId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to initiate payment',
      message: error.message
    });
  }
});

/**
 * POST /api/payment/process
 * Process a payment (mock implementation)
 */
router.post('/process', authenticate, async (req, res) => {
  try {
    const { paymentId, cardDetails } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        error: 'Missing payment ID',
        message: 'Payment ID is required'
      });
    }

    // Get payment
    const payment = paymentStore.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        error: 'Payment not found',
        message: 'Payment not found'
      });
    }

    // Verify ownership
    if (payment.userId !== req.user.id) {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'You can only process your own payments'
      });
    }

    // Check if already processed
    if (payment.status === PaymentStatus.COMPLETED) {
      return res.status(400).json({
        error: 'Already processed',
        message: 'Payment has already been processed'
      });
    }

    // Update to processing
    paymentStore.update(paymentId, { status: PaymentStatus.PROCESSING });

    // Simulate payment processing (in production, call payment gateway API)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock validation - in production, validate with payment provider
    const success = validateMockPayment(cardDetails);

    if (success) {
      // Mark payment as completed
      paymentStore.update(paymentId, {
        status: PaymentStatus.COMPLETED,
        completedAt: new Date().toISOString()
      });

      // Activate subscription
      const subscription = subscriptionStore.findById(payment.subscriptionId);
      if (subscription) {
        const durationDays = subscription.billingCycle === 'yearly' ? 365 : 30;
        subscription.activate(durationDays);

        // Update user premium status
        const isPremium = subscription.tier !== 'free';
        userStore.update(payment.userId, {
          isPremium,
          subscriptionId: subscription.id
        });
      }

      res.json({
        success: true,
        message: 'Payment processed successfully',
        data: {
          paymentId: payment.id,
          transactionId: payment.transactionId,
          status: payment.status,
          subscription: subscription ? subscription.toJSON() : null
        }
      });
    } else {
      // Mark payment as failed
      paymentStore.update(paymentId, {
        status: PaymentStatus.FAILED,
        failureReason: 'Payment declined'
      });

      res.status(400).json({
        error: 'Payment failed',
        message: 'Payment was declined. Please check your payment details.'
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Failed to process payment',
      message: error.message
    });
  }
});

/**
 * GET /api/payment/history
 * Get payment history for current user
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    const payments = paymentStore.getByUserId(req.user.id);

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get payment history',
      message: error.message
    });
  }
});

/**
 * GET /api/payment/:id
 * Get payment details
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const paymentId = parseInt(req.params.id);
    const payment = paymentStore.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        error: 'Payment not found',
        message: 'Payment not found'
      });
    }

    // Verify ownership
    if (payment.userId !== req.user.id) {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'You can only view your own payments'
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get payment',
      message: error.message
    });
  }
});

/**
 * POST /api/payment/refund
 * Request a refund (mock implementation)
 */
router.post('/refund', authenticate, async (req, res) => {
  try {
    const { paymentId, reason } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        error: 'Missing payment ID',
        message: 'Payment ID is required'
      });
    }

    const payment = paymentStore.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        error: 'Payment not found',
        message: 'Payment not found'
      });
    }

    if (payment.userId !== req.user.id) {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'You can only refund your own payments'
      });
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      return res.status(400).json({
        error: 'Cannot refund',
        message: 'Only completed payments can be refunded'
      });
    }

    // Process refund
    paymentStore.update(paymentId, {
      status: PaymentStatus.REFUNDED,
      refundedAt: new Date().toISOString(),
      refundReason: reason || 'User requested'
    });

    // Cancel subscription
    const subscription = subscriptionStore.findById(payment.subscriptionId);
    if (subscription) {
      subscription.cancel(true);
      
      // Update user premium status
      userStore.update(payment.userId, {
        isPremium: false,
        subscriptionId: null
      });
    }

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to process refund',
      message: error.message
    });
  }
});

/**
 * Helper: Format payment method name
 */
function formatPaymentMethod(method) {
  const names = {
    [PaymentMethods.CREDIT_CARD]: 'Credit Card',
    [PaymentMethods.PAYPAL]: 'PayPal',
    [PaymentMethods.BANK_TRANSFER]: 'Bank Transfer',
    [PaymentMethods.CRYPTO]: 'Cryptocurrency'
  };
  return names[method] || method;
}

/**
 * Helper: Mock payment validation
 * In production, this would call the payment gateway API
 */
function validateMockPayment(cardDetails) {
  // For demo purposes, accept any card that's not explicitly a test failure card
  if (!cardDetails) return true;
  
  // Test card numbers that should fail
  const failureCards = ['4000000000000002', '4000000000000069'];
  
  return !failureCards.includes(cardDetails.cardNumber);
}

export default router;
export { PaymentMethods, PaymentStatus, paymentStore };
