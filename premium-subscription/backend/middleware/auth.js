/**
 * Authentication Middleware
 * 
 * Provides authentication and authorization for protected routes
 * Implements JWT-like token verification and user validation
 */

import { userStore } from '../models/User.js';
import crypto from 'crypto';

/**
 * Simple token store (in production, use Redis or similar)
 */
class TokenStore {
  constructor() {
    this.tokens = new Map(); // token -> { userId, expiresAt }
  }

  create(userId, expiresIn = 24 * 60 * 60 * 1000) { // 24 hours default
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + expiresIn;

    this.tokens.set(token, {
      userId,
      expiresAt
    });

    return token;
  }

  verify(token) {
    const tokenData = this.tokens.get(token);

    if (!tokenData) {
      return null;
    }

    if (Date.now() > tokenData.expiresAt) {
      this.tokens.delete(token);
      return null;
    }

    return tokenData;
  }

  revoke(token) {
    return this.tokens.delete(token);
  }

  clear() {
    this.tokens.clear();
  }
}

export const tokenStore = new TokenStore();

/**
 * Authentication middleware
 * Verifies that the request has a valid authentication token
 */
export function authenticate(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No authorization header provided'
      });
    }

    // Expected format: "Bearer <token>"
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        error: 'Invalid authorization header',
        message: 'Format should be: Bearer <token>'
      });
    }

    const token = parts[1];

    // Verify token
    const tokenData = tokenStore.verify(token);

    if (!tokenData) {
      return res.status(401).json({
        error: 'Invalid or expired token',
        message: 'Please log in again'
      });
    }

    // Get user
    const user = userStore.findById(tokenData.userId);

    if (!user) {
      return res.status(401).json({
        error: 'User not found',
        message: 'Invalid authentication'
      });
    }

    // Attach user to request
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    return res.status(500).json({
      error: 'Authentication error',
      message: error.message
    });
  }
}

/**
 * Authorization middleware for premium users
 * Verifies that the authenticated user has an active premium subscription
 */
export function requirePremium(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please log in first'
    });
  }

  if (!req.user.isPremium) {
    return res.status(403).json({
      error: 'Premium subscription required',
      message: 'This feature is only available to premium users'
    });
  }

  next();
}

/**
 * Optional authentication middleware
 * Attaches user if authenticated, but doesn't require authentication
 */
export function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return next();
    }

    const token = parts[1];
    const tokenData = tokenStore.verify(token);

    if (tokenData) {
      const user = userStore.findById(tokenData.userId);
      if (user) {
        req.user = user;
        req.token = token;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication on error
    next();
  }
}

/**
 * Simple password hashing utility
 * In production, use bcrypt or similar
 */
export function hashPassword(password) {
  return crypto
    .createHash('sha256')
    .update(password)
    .digest('hex');
}

/**
 * Verifies password against hash
 */
export function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

export default {
  authenticate,
  requirePremium,
  optionalAuth,
  tokenStore,
  hashPassword,
  verifyPassword
};
