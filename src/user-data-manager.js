/**
 * User Data Manager - Handles encrypted user-specific data storage
 * Provides secure storage for user statistics and history
 */

import { CryptoUtils } from './crypto-utils.js';
import fs from 'fs/promises';
import path from 'path';

export class UserDataManager {
  constructor(storageDir = './data') {
    this.storageDir = storageDir;
    this.userData = new Map(); // In-memory cache
    this.crypto = new CryptoUtils();
  }

  /**
   * Initialize storage directory
   */
  async initialize() {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create storage directory:', error);
    }
  }

  /**
   * Get user-specific data file path
   */
  getUserFilePath(username) {
    return path.join(this.storageDir, `${username}.enc`);
  }

  /**
   * Store result for a specific user
   */
  async storeUserResult(username, result) {
    if (!this.userData.has(username)) {
      await this.loadUserData(username);
    }

    const userData = this.userData.get(username) || {
      results: [],
      statistics: {
        totalResults: 0,
        frequencies: {},
        lastUpdated: null
      },
      history: []
    };

    // Add result
    userData.results.push(result);
    userData.statistics.totalResults++;
    
    // Update frequency
    const value = result.resultado;
    userData.statistics.frequencies[value] = 
      (userData.statistics.frequencies[value] || 0) + 1;
    
    userData.statistics.lastUpdated = new Date().toISOString();

    // Add to history
    userData.history.push({
      timestamp: result.timestamp,
      action: 'result_added',
      value: result.resultado
    });

    // Keep only last 1000 results
    if (userData.results.length > 1000) {
      userData.results = userData.results.slice(-1000);
    }

    // Keep only last 500 history entries
    if (userData.history.length > 500) {
      userData.history = userData.history.slice(-500);
    }

    this.userData.set(username, userData);
    await this.saveUserData(username);

    return userData;
  }

  /**
   * Get user results
   */
  async getUserResults(username, limit = 50) {
    if (!this.userData.has(username)) {
      await this.loadUserData(username);
    }

    const userData = this.userData.get(username);
    if (!userData) {
      return [];
    }

    return userData.results.slice(-limit);
  }

  /**
   * Get user statistics
   */
  async getUserStatistics(username) {
    if (!this.userData.has(username)) {
      await this.loadUserData(username);
    }

    const userData = this.userData.get(username);
    if (!userData) {
      return {
        totalResults: 0,
        frequencies: {},
        lastUpdated: null
      };
    }

    return userData.statistics;
  }

  /**
   * Get user history
   */
  async getUserHistory(username, limit = 100) {
    if (!this.userData.has(username)) {
      await this.loadUserData(username);
    }

    const userData = this.userData.get(username);
    if (!userData) {
      return [];
    }

    return userData.history.slice(-limit);
  }

  /**
   * Clear user results
   */
  async clearUserResults(username) {
    if (!this.userData.has(username)) {
      await this.loadUserData(username);
    }

    const userData = this.userData.get(username) || {
      results: [],
      statistics: {
        totalResults: 0,
        frequencies: {},
        lastUpdated: null
      },
      history: []
    };

    userData.results = [];
    userData.statistics = {
      totalResults: 0,
      frequencies: {},
      lastUpdated: new Date().toISOString()
    };

    userData.history.push({
      timestamp: Date.now(),
      action: 'results_cleared'
    });

    this.userData.set(username, userData);
    await this.saveUserData(username);

    return true;
  }

  /**
   * Load user data from encrypted file
   */
  async loadUserData(username) {
    try {
      const filePath = this.getUserFilePath(username);
      const encryptedDataString = await fs.readFile(filePath, 'utf8');
      
      // Parse encrypted object from JSON string
      const encryptedData = JSON.parse(encryptedDataString);
      
      const decryptedData = this.crypto.decrypt(encryptedData);
      const userData = JSON.parse(decryptedData);
      this.userData.set(username, userData);
      return userData;
    } catch (error) {
      // File doesn't exist or can't be read - create new user data
      const newUserData = {
        results: [],
        statistics: {
          totalResults: 0,
          frequencies: {},
          lastUpdated: null
        },
        history: []
      };
      this.userData.set(username, newUserData);
      return newUserData;
    }
  }

  /**
   * Save user data to encrypted file
   */
  async saveUserData(username) {
    try {
      const userData = this.userData.get(username);
      if (!userData) {
        return;
      }

      const jsonData = JSON.stringify(userData);
      const encryptedData = this.crypto.encrypt(jsonData);
      
      // Serialize encrypted object to JSON string
      const encryptedDataString = JSON.stringify(encryptedData);
      
      const filePath = this.getUserFilePath(username);
      
      await fs.writeFile(filePath, encryptedDataString, 'utf8');
    } catch (error) {
      console.error(`Failed to save user data for ${username}:`, error);
      throw error;
    }
  }

  /**
   * Export user data (unencrypted for user download)
   */
  async exportUserData(username) {
    if (!this.userData.has(username)) {
      await this.loadUserData(username);
    }

    const userData = this.userData.get(username);
    if (!userData) {
      return null;
    }

    return {
      username,
      exportDate: new Date().toISOString(),
      ...userData
    };
  }

  /**
   * Delete all user data
   */
  async deleteUserData(username) {
    try {
      this.userData.delete(username);
      const filePath = this.getUserFilePath(username);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      // File might not exist, which is fine
      this.userData.delete(username);
      return true;
    }
  }
}
