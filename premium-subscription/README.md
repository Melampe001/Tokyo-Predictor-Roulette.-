# Premium Subscription System

A complete subscription and payment system for the Tokyo Predictor Roulette application.

## Features

### Backend (Node.js/Express)
- **User Authentication**: Registration, login, logout with token-based authentication
- **Multiple Subscription Tiers**: Free, Basic, Premium, Enterprise
- **Flexible Billing**: Monthly and yearly billing cycles  
- **Payment Processing**: Mock implementation supporting multiple payment methods
- **In-Memory Storage**: Ready to integrate with MongoDB, PostgreSQL, or other databases

### Frontend (React Native)
- **Premium Screen**: Beautiful UI for viewing and selecting subscription plans
- **Payment Screen**: Secure payment form with validation
- **Animated Button**: Reusable component with loading states

## Quick Start

### Backend Setup

1. **Import routes into your Express server:**

```javascript
// server.js
import authRoutes from './premium-subscription/backend/routes/auth.js';
import subscriptionRoutes from './premium-subscription/backend/routes/subscription.js';
import paymentRoutes from './premium-subscription/backend/routes/payment.js';

app.use('/api/auth', authRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/payment', paymentRoutes);
```

2. **Start your server:**

```bash
npm start
```

3. **Test the API:**

```bash
# Register a user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"Test User"}'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get subscription tiers
curl http://localhost:8080/api/subscriptions/tiers
```

### Frontend Setup

1. **Add navigation screens:**

```javascript
import PremiumScreen from './premium-subscription/frontend/screens/PremiumScreen';
import PaymentScreen from './premium-subscription/frontend/screens/PaymentScreen';

// In your navigator
<Stack.Screen name="Premium" component={PremiumScreen} />
<Stack.Screen name="Payment" component={PaymentScreen} />
```

2. **Navigate to premium screen:**

```javascript
navigation.navigate('Premium');
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/me` - Update user profile
- `POST /api/auth/change-password` - Change password

### Subscriptions
- `GET /api/subscriptions/tiers` - Get available tiers
- `GET /api/subscriptions/me` - Get user subscription
- `POST /api/subscriptions/create` - Create subscription
- `POST /api/subscriptions/activate` - Activate subscription
- `POST /api/subscriptions/cancel` - Cancel subscription
- `POST /api/subscriptions/renew` - Renew subscription

### Payments
- `GET /api/payment/methods` - Get payment methods
- `POST /api/payment/initiate` - Initiate payment
- `POST /api/payment/process` - Process payment
- `GET /api/payment/history` - Get payment history
- `GET /api/payment/:id` - Get payment details
- `POST /api/payment/refund` - Request refund

## Subscription Tiers

| Tier | Monthly | Yearly | Features |
|------|---------|--------|----------|
| **Basic** | FREE | FREE | Basic predictions, Limited history, Standard support, No billing required |
| **Advanced** | $9.99 | $99.99 | All basic features + Advanced predictions, Real-time updates, 30-day history, Priority support |
| **Premium** | $19.99 | $199.99 | All advanced features + Unlimited history, Advanced analytics dashboard, Premium support, PDF export, Custom integrations |

## Testing

Run the test suite:

```bash
npm test -- --testPathPattern=premium-subscription
```

All 23 tests cover:
- User registration and authentication
- Login/logout flows
- Subscription creation and management
- Payment processing
- Error handling

## Security

### Current Implementation (Demo)
- ⚠️ SHA-256 password hashing (NOT SECURE for production)
- ⚠️ In-memory token storage
- ⚠️ No rate limiting
- ⚠️ Mock payment processing

### Production Requirements
- ✅ Use bcrypt/argon2 for password hashing
- ✅ Implement rate limiting (express-rate-limit)
- ✅ Use Redis for token storage
- ✅ Integrate real payment gateway (Stripe, PayPal)
- ✅ Add CAPTCHA for registration
- ✅ Implement email verification
- ✅ Use HTTPS/TLS
- ✅ Never store card numbers or CVV

See [PAYMENT_INTEGRATION.md](docs/PAYMENT_INTEGRATION.md) for detailed security guidelines.

## Database Integration

The current implementation uses in-memory storage. For production:

### MongoDB Example
```javascript
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: String,
  name: String,
  isPremium: Boolean,
  subscriptionId: mongoose.Schema.Types.ObjectId
});

export const User = mongoose.model('User', UserSchema);
```

### PostgreSQL Example
```javascript
import { Sequelize, DataTypes } from 'sequelize';

const User = sequelize.define('User', {
  email: { type: DataTypes.STRING, unique: true },
  passwordHash: DataTypes.STRING,
  name: DataTypes.STRING,
  isPremium: DataTypes.BOOLEAN
});
```

## Payment Gateway Integration

### Stripe Example
```javascript
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(subscription.price * 100),
  currency: 'usd',
  payment_method: paymentMethodId
});
```

### PayPal Example
```javascript
import paypal from '@paypal/checkout-server-sdk';

const request = new paypal.orders.OrdersCreateRequest();
request.requestBody({
  intent: 'CAPTURE',
  purchase_units: [{
    amount: { currency_code: 'USD', value: subscription.price }
  }]
});
```

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────>│   Backend   │────>│   Database  │
│ React Native│     │   Express   │     │  MongoDB/   │
│             │<────│     API     │<────│  PostgreSQL │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ↓
                    ┌─────────────┐
                    │   Payment   │
                    │   Gateway   │
                    │ Stripe/etc  │
                    └─────────────┘
```

## Support

For detailed integration instructions, see:
- [PAYMENT_INTEGRATION.md](docs/PAYMENT_INTEGRATION.md) - Complete integration guide
- [Test Suite](../test/premium-subscription.test.js) - Example usage

## License

Part of the Tokyo Predictor Roulette project.
