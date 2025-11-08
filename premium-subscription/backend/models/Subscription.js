/**
 * Subscription Model
 * 
 * Represents a premium subscription in the system
 * Handles subscription tiers, status, and billing cycles
 */

export const SubscriptionTiers = {
  FREE: 'free',
  BASIC: 'basic',
  PREMIUM: 'premium',
  ENTERPRISE: 'enterprise'
};

export const SubscriptionStatus = {
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  PENDING: 'pending',
  TRIAL: 'trial'
};

export class Subscription {
  constructor(data = {}) {
    this.id = data.id || null;
    this.userId = data.userId || null;
    this.tier = data.tier || SubscriptionTiers.FREE;
    this.status = data.status || SubscriptionStatus.PENDING;
    this.price = data.price || 0;
    this.currency = data.currency || 'USD';
    this.billingCycle = data.billingCycle || 'monthly'; // monthly, yearly
    this.startDate = data.startDate || new Date().toISOString();
    this.endDate = data.endDate || null;
    this.nextBillingDate = data.nextBillingDate || null;
    this.autoRenew = data.autoRenew !== undefined ? data.autoRenew : true;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.metadata = data.metadata || {};
  }

  /**
   * Validates subscription data
   * @returns {Object} - { valid: boolean, errors: string[] }
   */
  validate() {
    const errors = [];

    if (!this.userId) {
      errors.push('User ID is required');
    }

    if (!Object.values(SubscriptionTiers).includes(this.tier)) {
      errors.push('Invalid subscription tier');
    }

    if (!Object.values(SubscriptionStatus).includes(this.status)) {
      errors.push('Invalid subscription status');
    }

    if (this.price < 0) {
      errors.push('Price cannot be negative');
    }

    if (!['monthly', 'yearly', 'lifetime'].includes(this.billingCycle)) {
      errors.push('Invalid billing cycle');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Checks if subscription is active
   * @returns {boolean}
   */
  isActive() {
    if (this.status !== SubscriptionStatus.ACTIVE && this.status !== SubscriptionStatus.TRIAL) {
      return false;
    }

    if (this.endDate) {
      const now = new Date();
      const end = new Date(this.endDate);
      return now <= end;
    }

    return true;
  }

  /**
   * Activates the subscription
   * @param {number} durationDays - Duration in days
   */
  activate(durationDays = 30) {
    this.status = SubscriptionStatus.ACTIVE;
    this.startDate = new Date().toISOString();
    
    if (durationDays) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);
      this.endDate = endDate.toISOString();

      if (this.autoRenew) {
        this.nextBillingDate = this.endDate;
      }
    }

    this.updatedAt = new Date().toISOString();
  }

  /**
   * Cancels the subscription
   * @param {boolean} immediate - If true, cancels immediately. Otherwise, cancels at end of period
   */
  cancel(immediate = false) {
    this.status = SubscriptionStatus.CANCELLED;
    this.autoRenew = false;

    if (immediate) {
      this.endDate = new Date().toISOString();
    }

    this.updatedAt = new Date().toISOString();
  }

  /**
   * Renews the subscription
   * @param {number} durationDays 
   */
  renew(durationDays = 30) {
    const startDate = this.endDate ? new Date(this.endDate) : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationDays);

    this.startDate = startDate.toISOString();
    this.endDate = endDate.toISOString();
    this.status = SubscriptionStatus.ACTIVE;

    if (this.autoRenew) {
      this.nextBillingDate = this.endDate;
    }

    this.updatedAt = new Date().toISOString();
  }

  /**
   * Converts subscription to JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      tier: this.tier,
      status: this.status,
      price: this.price,
      currency: this.currency,
      billingCycle: this.billingCycle,
      startDate: this.startDate,
      endDate: this.endDate,
      nextBillingDate: this.nextBillingDate,
      autoRenew: this.autoRenew,
      isActive: this.isActive(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      metadata: this.metadata
    };
  }
}

/**
 * In-memory subscription storage (for demonstration)
 * In production, this would be replaced with a database
 */
class SubscriptionStore {
  constructor() {
    this.subscriptions = new Map();
    this.userIndex = new Map();
    this.nextId = 1;
  }

  /**
   * Creates a new subscription
   * @param {Object} subscriptionData 
   * @returns {Subscription}
   */
  create(subscriptionData) {
    const subscription = new Subscription(subscriptionData);
    const validation = subscription.validate();

    if (!validation.valid) {
      throw new Error(`Invalid subscription data: ${validation.errors.join(', ')}`);
    }

    subscription.id = this.nextId++;
    this.subscriptions.set(subscription.id, subscription);
    this.userIndex.set(subscription.userId, subscription.id);

    return subscription;
  }

  /**
   * Finds subscription by ID
   * @param {number} id 
   * @returns {Subscription|null}
   */
  findById(id) {
    return this.subscriptions.get(id) || null;
  }

  /**
   * Finds subscription by user ID
   * @param {number} userId 
   * @returns {Subscription|null}
   */
  findByUserId(userId) {
    const subscriptionId = this.userIndex.get(userId);
    return subscriptionId ? this.subscriptions.get(subscriptionId) : null;
  }

  /**
   * Updates a subscription
   * @param {number} id 
   * @param {Object} updates 
   * @returns {Subscription}
   */
  update(id, updates) {
    const subscription = this.findById(id);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    Object.assign(subscription, updates);
    subscription.updatedAt = new Date().toISOString();

    const validation = subscription.validate();
    if (!validation.valid) {
      throw new Error(`Invalid subscription data: ${validation.errors.join(', ')}`);
    }

    return subscription;
  }

  /**
   * Deletes a subscription
   * @param {number} id 
   * @returns {boolean}
   */
  delete(id) {
    const subscription = this.findById(id);
    if (!subscription) {
      return false;
    }

    this.userIndex.delete(subscription.userId);
    return this.subscriptions.delete(id);
  }

  /**
   * Gets all subscriptions
   * @returns {Subscription[]}
   */
  getAll() {
    return Array.from(this.subscriptions.values());
  }

  /**
   * Gets active subscriptions
   * @returns {Subscription[]}
   */
  getActive() {
    return this.getAll().filter(sub => sub.isActive());
  }

  /**
   * Clears all subscriptions (for testing)
   */
  clear() {
    this.subscriptions.clear();
    this.userIndex.clear();
    this.nextId = 1;
  }
}

// Export singleton instance
export const subscriptionStore = new SubscriptionStore();

export default Subscription;
