/**
 * User Model
 * 
 * Represents a user in the premium subscription system
 * Handles user data, authentication credentials, and subscription relationship
 */

export class User {
  constructor(data = {}) {
    this.id = data.id || null;
    this.email = data.email || '';
    this.passwordHash = data.passwordHash || '';
    this.name = data.name || '';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.subscriptionId = data.subscriptionId || null;
    this.isPremium = data.isPremium || false;
  }

  /**
   * Validates user data
   * @returns {Object} - { valid: boolean, errors: string[] }
   */
  validate() {
    const errors = [];

    if (!this.email || !this.isValidEmail(this.email)) {
      errors.push('Valid email is required');
    }

    if (!this.passwordHash && !this.id) {
      errors.push('Password is required for new users');
    }

    if (!this.name || this.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates email format
   * @param {string} email 
   * @returns {boolean}
   */
  isValidEmail(email) {
    // Simple email validation to prevent ReDoS attacks
    // For production, consider using a library like validator.js
    if (!email || typeof email !== 'string' || email.length > 320) {
      return false;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  /**
   * Converts user to JSON (excludes sensitive data)
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      subscriptionId: this.subscriptionId,
      isPremium: this.isPremium
    };
  }

  /**
   * Updates user's premium status
   * @param {boolean} isPremium 
   * @param {string} subscriptionId 
   */
  updatePremiumStatus(isPremium, subscriptionId = null) {
    this.isPremium = isPremium;
    this.subscriptionId = subscriptionId;
    this.updatedAt = new Date().toISOString();
  }
}

/**
 * In-memory user storage (for demonstration)
 * In production, this would be replaced with a database
 */
class UserStore {
  constructor() {
    this.users = new Map();
    this.emailIndex = new Map();
    this.nextId = 1;
  }

  /**
   * Creates a new user
   * @param {Object} userData 
   * @returns {User}
   */
  create(userData) {
    const user = new User(userData);
    const validation = user.validate();

    if (!validation.valid) {
      throw new Error(`Invalid user data: ${validation.errors.join(', ')}`);
    }

    if (this.emailIndex.has(user.email)) {
      throw new Error('Email already exists');
    }

    user.id = this.nextId++;
    this.users.set(user.id, user);
    this.emailIndex.set(user.email, user.id);

    return user;
  }

  /**
   * Finds user by ID
   * @param {number} id 
   * @returns {User|null}
   */
  findById(id) {
    return this.users.get(id) || null;
  }

  /**
   * Finds user by email
   * @param {string} email 
   * @returns {User|null}
   */
  findByEmail(email) {
    const userId = this.emailIndex.get(email);
    return userId ? this.users.get(userId) : null;
  }

  /**
   * Updates a user
   * @param {number} id 
   * @param {Object} updates 
   * @returns {User}
   */
  update(id, updates) {
    const user = this.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Update fields
    Object.assign(user, updates);
    user.updatedAt = new Date().toISOString();

    const validation = user.validate();
    if (!validation.valid) {
      throw new Error(`Invalid user data: ${validation.errors.join(', ')}`);
    }

    return user;
  }

  /**
   * Deletes a user
   * @param {number} id 
   * @returns {boolean}
   */
  delete(id) {
    const user = this.findById(id);
    if (!user) {
      return false;
    }

    this.emailIndex.delete(user.email);
    return this.users.delete(id);
  }

  /**
   * Gets all users
   * @returns {User[]}
   */
  getAll() {
    return Array.from(this.users.values());
  }

  /**
   * Clears all users (for testing)
   */
  clear() {
    this.users.clear();
    this.emailIndex.clear();
    this.nextId = 1;
  }
}

// Export singleton instance
export const userStore = new UserStore();

export default User;
