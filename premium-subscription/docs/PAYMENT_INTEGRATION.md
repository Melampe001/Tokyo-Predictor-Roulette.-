# Payment Integration Guide

This document provides comprehensive guidance on integrating the premium subscription and payment system into the Tokyo Predictor Roulette application.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Backend Integration](#backend-integration)
4. [Frontend Integration](#frontend-integration)
5. [Payment Flow](#payment-flow)
6. [Security Considerations](#security-considerations)
7. [Testing](#testing)
8. [Production Deployment](#production-deployment)

## Overview

The premium subscription system allows users to upgrade from the free tier to paid plans, unlocking advanced features. The system includes:

- Multiple subscription tiers (Free, Basic, Premium, Enterprise)
- Flexible billing cycles (Monthly, Yearly)
- Multiple payment methods (Credit Card, PayPal, Bank Transfer, Cryptocurrency)
- Secure authentication and authorization
- Payment processing and history tracking

## Architecture

### Components

```
premium-subscription/
├── backend/          # Node.js/Express API
│   ├── routes/
│   │   ├── auth.js          # User authentication
│   │   ├── subscription.js  # Subscription management
│   │   └── payment.js       # Payment processing
│   ├── models/
│   │   ├── User.js          # User data model
│   │   └── Subscription.js  # Subscription data model
│   └── middleware/
│       └── auth.js          # Authentication middleware
└── frontend/         # React Native UI
    ├── screens/
    │   ├── PremiumScreen.js  # Subscription selection
    │   └── PaymentScreen.js  # Payment form
    └── components/
        └── AnimatedButton.js # Reusable button component
```

### Data Flow

```
User → Frontend → Backend API → Payment Processor → Database
                      ↓
                 Subscription
                  Activated
```

## Backend Integration

### 1. Install Dependencies

The backend uses the existing Express server. No additional dependencies are required for the mock implementation.

### 2. Import Routes

Add the premium subscription routes to your main server file (`server.js`):

```javascript
import authRoutes from './premium-subscription/backend/routes/auth.js';
import subscriptionRoutes from './premium-subscription/backend/routes/subscription.js';
import paymentRoutes from './premium-subscription/backend/routes/payment.js';

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/payment', paymentRoutes);
```

### 3. API Endpoints

#### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get token
- `POST /api/auth/logout` - Logout and revoke token
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/me` - Update user profile
- `POST /api/auth/change-password` - Change password

#### Subscription Endpoints

- `GET /api/subscriptions/tiers` - Get available tiers
- `GET /api/subscriptions/me` - Get user's subscription
- `POST /api/subscriptions/create` - Create/upgrade subscription
- `POST /api/subscriptions/activate` - Activate subscription after payment
- `POST /api/subscriptions/cancel` - Cancel subscription
- `POST /api/subscriptions/renew` - Renew subscription

#### Payment Endpoints

- `GET /api/payment/methods` - Get payment methods
- `POST /api/payment/initiate` - Initiate payment
- `POST /api/payment/process` - Process payment
- `GET /api/payment/history` - Get payment history
- `GET /api/payment/:id` - Get payment details
- `POST /api/payment/refund` - Request refund

### 4. Authentication

All protected routes require a Bearer token in the Authorization header:

```
Authorization: Bearer <token>
```

Example with fetch:

```javascript
fetch('/api/subscriptions/me', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

### 5. Database Integration

The current implementation uses in-memory storage for demonstration. For production:

**Replace with MongoDB:**

```javascript
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: String,
  isPremium: { type: Boolean, default: false },
  subscriptionId: mongoose.Schema.Types.ObjectId
});

export const User = mongoose.model('User', UserSchema);
```

**Replace with PostgreSQL:**

```javascript
import { Sequelize, DataTypes } from 'sequelize';

const User = sequelize.define('User', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: DataTypes.STRING,
  isPremium: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});
```

## Frontend Integration

### 1. Install Dependencies

For React Native:

```bash
npm install @react-navigation/native @react-navigation/stack
npm install react-native-gesture-handler react-native-reanimated
```

### 2. Navigation Setup

Add the premium screens to your navigation:

```javascript
import PremiumScreen from './premium-subscription/frontend/screens/PremiumScreen';
import PaymentScreen from './premium-subscription/frontend/screens/PaymentScreen';

const Stack = createStackNavigator();

function AppNavigator() {
  return (
    <Stack.Navigator>
      {/* Existing screens */}
      <Stack.Screen name="Premium" component={PremiumScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
    </Stack.Navigator>
  );
}
```

### 3. API Integration

Create an API service to interact with the backend:

```javascript
// services/api.js
const API_BASE_URL = 'http://your-server.com/api';

export const login = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return response.json();
};

export const getSubscriptionTiers = async () => {
  const response = await fetch(`${API_BASE_URL}/subscriptions/tiers`);
  return response.json();
};

export const createSubscription = async (token, tier, billingCycle) => {
  const response = await fetch(`${API_BASE_URL}/subscriptions/create`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ tier, billingCycle })
  });
  return response.json();
};

export const processPayment = async (token, paymentId, cardDetails) => {
  const response = await fetch(`${API_BASE_URL}/payment/process`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ paymentId, cardDetails })
  });
  return response.json();
};
```

### 4. State Management

Use Context API or Redux to manage authentication state:

```javascript
// contexts/AuthContext.js
import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    setUser(data.user);
    setToken(data.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

## Payment Flow

### Complete Payment Flow

1. **User Registration/Login**
   - User creates account or logs in
   - Backend returns authentication token

2. **View Subscription Tiers**
   - User navigates to Premium screen
   - Frontend fetches available tiers from `/api/subscriptions/tiers`

3. **Select Subscription**
   - User selects tier and billing cycle
   - Frontend calls `/api/subscriptions/create`
   - Backend creates pending subscription

4. **Payment Initiation**
   - User navigates to Payment screen
   - User selects payment method
   - Frontend calls `/api/payment/initiate`
   - Backend creates payment record

5. **Payment Processing**
   - User enters payment details
   - Frontend calls `/api/payment/process`
   - Backend processes payment (or calls payment gateway)

6. **Subscription Activation**
   - On successful payment, backend activates subscription
   - User's premium status is updated
   - Frontend receives confirmation

### Sequence Diagram

```
User    Frontend    Backend    Payment Gateway
 |         |          |              |
 |-------->|          |              |  Select Tier
 |         |--------->|              |  POST /subscriptions/create
 |         |<---------|              |  Subscription created
 |-------->|          |              |  Enter Payment
 |         |--------->|              |  POST /payment/initiate
 |         |<---------|              |  Payment ID
 |-------->|          |              |  Submit Payment
 |         |--------->|              |  POST /payment/process
 |         |          |------------->|  Process Payment
 |         |          |<-------------|  Payment Success
 |         |<---------|              |  Subscription Activated
 |<--------|          |              |  Confirmation
```

## Security Considerations

### 1. Password Security

**Current Implementation:**
- Uses SHA-256 hashing (for demonstration only)

**Production Recommendation:**
```javascript
import bcrypt from 'bcrypt';

// Hash password
const hash = await bcrypt.hash(password, 10);

// Verify password
const isValid = await bcrypt.compare(password, hash);
```

### 2. Token Security

**Current Implementation:**
- Random token generation
- In-memory token storage

**Production Recommendation:**
```javascript
import jwt from 'jsonwebtoken';

// Create token
const token = jwt.sign(
  { userId: user.id },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

// Verify token
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

### 3. Payment Security

**Never store:**
- Full credit card numbers
- CVV codes
- Unencrypted payment details

**Always:**
- Use HTTPS/TLS in production
- Tokenize payment methods
- Use PCI-compliant payment processors
- Validate input on both frontend and backend
- Log all payment attempts for fraud detection

### 4. Rate Limiting

Implement rate limiting to prevent abuse:

```javascript
import rateLimit from 'express-rate-limit';

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // 5 requests per window
});

app.use('/api/payment', paymentLimiter);
```

## Testing

### Backend Testing

Create test files for each route:

```javascript
// test/auth.test.js
describe('Authentication', () => {
  test('should register new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
```

### Frontend Testing

Test components with React Native Testing Library:

```javascript
import { render, fireEvent } from '@testing-library/react-native';
import PremiumScreen from './PremiumScreen';

test('renders subscription tiers', async () => {
  const { getByText } = render(<PremiumScreen />);
  
  await waitFor(() => {
    expect(getByText('Basic')).toBeTruthy();
    expect(getByText('Premium')).toBeTruthy();
  });
});
```

## Production Deployment

### 1. Environment Variables

Create `.env` file:

```bash
NODE_ENV=production
PORT=8080
JWT_SECRET=your-secret-key-here
DATABASE_URL=postgresql://user:pass@host:5432/db

# Payment Gateway (e.g., Stripe)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Email Service (for receipts)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 2. Payment Gateway Integration

**Stripe Example:**

```javascript
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/payment/process', authenticate, async (req, res) => {
  try {
    const { paymentMethodId, amount } = req.body;
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
      metadata: {
        userId: req.user.id,
        subscriptionId: subscription.id
      }
    });
    
    // Handle success...
  } catch (error) {
    // Handle error...
  }
});
```

### 3. Database Migration

Run migrations to set up production database:

```javascript
// migrations/001_create_users.js
export async function up(knex) {
  await knex.schema.createTable('users', (table) => {
    table.increments('id');
    table.string('email').unique().notNullable();
    table.string('password_hash').notNullable();
    table.string('name');
    table.boolean('is_premium').defaultTo(false);
    table.integer('subscription_id').references('subscriptions.id');
    table.timestamps(true, true);
  });
}
```

### 4. Monitoring and Logging

Set up monitoring for payment events:

```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'payment.log' })
  ]
});

// Log all payment attempts
router.post('/payment/process', authenticate, async (req, res) => {
  logger.info('Payment attempt', {
    userId: req.user.id,
    amount: req.body.amount,
    method: req.body.method
  });
  
  // Process payment...
});
```

### 5. Webhook Handling

Handle payment gateway webhooks:

```javascript
router.post('/webhook/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    switch (event.type) {
      case 'payment_intent.succeeded':
        // Activate subscription
        break;
      case 'payment_intent.payment_failed':
        // Handle failure
        break;
    }
    
    res.json({ received: true });
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});
```

## Additional Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [PayPal Developer Docs](https://developer.paypal.com/docs/api/overview/)
- [PCI DSS Compliance](https://www.pcisecuritystandards.org/)
- [React Native Best Practices](https://reactnative.dev/docs/performance)

## Support

For questions or issues with the payment integration, please contact the development team or refer to the main project documentation.
