/**
 * Authentication Middleware for Tokyo Predictor Roulette
 * Provides JWT-based authentication and authorization
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Secret key for JWT (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';

// In-memory user storage (in production, use database)
const users = new Map();

// Default admin user for testing/demo
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Tokyo2024!';

/**
 * Initialize authentication system
 */
export async function initializeAuth() {
  // Create default admin user if not exists
  if (!users.has(ADMIN_USERNAME)) {
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    users.set(ADMIN_USERNAME, {
      username: ADMIN_USERNAME,
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date().toISOString()
    });
  }
}

/**
 * Register a new user
 */
export async function registerUser(username, password, role = 'user') {
  if (!username || !password) {
    throw new Error('Username and password are required');
  }

  if (users.has(username)) {
    throw new Error('User already exists');
  }

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = {
    username,
    password: hashedPassword,
    role,
    createdAt: new Date().toISOString()
  };

  users.set(username, user);
  return { username, role, createdAt: user.createdAt };
}

/**
 * Authenticate user and generate JWT token
 */
export async function authenticateUser(username, password) {
  const user = users.get(username);
  
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  
  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }

  // Generate JWT token
  const token = jwt.sign(
    { 
      username: user.username, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION }
  );

  return {
    token,
    user: {
      username: user.username,
      role: user.role
    }
  };
}

/**
 * Verify JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Express middleware to authenticate requests
 */
export function authMiddleware(req, res, next) {
  try {
    // Extract token from Authorization header or query parameter
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : req.query.token;

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Authentication failed',
      message: error.message
    });
  }
}

/**
 * Express middleware to check for admin role
 */
export function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required'
    });
  }
  next();
}

/**
 * WebSocket authentication
 */
export function authenticateWebSocket(url) {
  try {
    const urlObj = new URL(url, 'ws://localhost');
    const token = urlObj.searchParams.get('token');
    
    if (!token) {
      throw new Error('No token provided');
    }

    return verifyToken(token);
  } catch (error) {
    throw new Error('WebSocket authentication failed: ' + error.message);
  }
}

/**
 * Get all users (admin only)
 */
export function getAllUsers() {
  return Array.from(users.values()).map(user => ({
    username: user.username,
    role: user.role,
    createdAt: user.createdAt
  }));
}

/**
 * Delete user (admin only)
 */
export function deleteUser(username) {
  if (username === ADMIN_USERNAME) {
    throw new Error('Cannot delete admin user');
  }
  
  if (!users.has(username)) {
    throw new Error('User not found');
  }
  
  users.delete(username);
  return true;
}

export { JWT_SECRET };
