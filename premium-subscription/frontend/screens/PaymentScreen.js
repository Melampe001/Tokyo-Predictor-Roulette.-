/**
 * Payment Screen
 * 
 * Handles payment form and processing for subscriptions
 * Supports multiple payment methods
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import AnimatedButton from '../components/AnimatedButton';

const PaymentScreen = ({ route, navigation, onPaymentComplete }) => {
  const { tier, billingCycle, amount } = route.params;

  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [processing, setProcessing] = useState(false);

  const paymentMethods = [
    { id: 'credit_card', name: 'Credit Card', icon: '💳' },
    { id: 'paypal', name: 'PayPal', icon: '🅿️' },
    { id: 'bank_transfer', name: 'Bank Transfer', icon: '🏦' },
    { id: 'crypto', name: 'Cryptocurrency', icon: '₿' }
  ];

  const formatCardNumber = (text) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, '');
    // Add space every 4 digits
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.substring(0, 19); // Max 16 digits + 3 spaces
  };

  const formatExpiryDate = (text) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, '');
    // Add slash after 2 digits
    if (cleaned.length >= 2) {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
    }
    return cleaned;
  };

  const validateCardDetails = () => {
    if (paymentMethod !== 'credit_card') {
      return true; // Skip validation for other payment methods
    }

    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 13) {
      Alert.alert('Validation Error', 'Please enter a valid card number');
      return false;
    }

    if (!expiryDate || expiryDate.length < 5) {
      Alert.alert('Validation Error', 'Please enter a valid expiry date (MM/YY)');
      return false;
    }

    if (!cvv || cvv.length < 3) {
      Alert.alert('Validation Error', 'Please enter a valid CVV');
      return false;
    }

    if (!cardholderName || cardholderName.trim().length < 3) {
      Alert.alert('Validation Error', 'Please enter the cardholder name');
      return false;
    }

    // Validate expiry date
    const [month, year] = expiryDate.split('/');
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(`20${year}`, 10);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (monthNum < 1 || monthNum > 12) {
      Alert.alert('Validation Error', 'Invalid expiry month');
      return false;
    }

    if (yearNum < currentYear || (yearNum === currentYear && monthNum < currentMonth)) {
      Alert.alert('Validation Error', 'Card has expired');
      return false;
    }

    return true;
  };

  const handlePayment = async () => {
    if (!validateCardDetails()) {
      return;
    }

    setProcessing(true);

    try {
      // In production, this would be an API call to your backend
      // which would then communicate with the payment processor
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock payment processing
      const paymentData = {
        tier,
        billingCycle,
        amount,
        method: paymentMethod,
        cardDetails: paymentMethod === 'credit_card' ? {
          cardNumber: cardNumber.replace(/\s/g, ''),
          expiryDate,
          cvv,
          cardholderName
        } : null
      };

      // Simulate successful payment (90% success rate)
      const success = Math.random() > 0.1;

      if (success) {
        Alert.alert(
          'Payment Successful',
          `Your ${tier} subscription has been activated!`,
          [
            {
              text: 'OK',
              onPress: () => {
                onPaymentComplete?.(paymentData);
                navigation.navigate('Premium');
              }
            }
          ]
        );
      } else {
        throw new Error('Payment was declined. Please try again.');
      }
    } catch (error) {
      Alert.alert('Payment Failed', error.message || 'An error occurred processing your payment');
      console.error('Payment error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const renderCreditCardForm = () => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Card Details</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Card Number</Text>
        <TextInput
          style={styles.input}
          placeholder="1234 5678 9012 3456"
          keyboardType="numeric"
          value={cardNumber}
          onChangeText={(text) => setCardNumber(formatCardNumber(text))}
          maxLength={19}
          editable={!processing}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputContainer, styles.halfWidth]}>
          <Text style={styles.label}>Expiry Date</Text>
          <TextInput
            style={styles.input}
            placeholder="MM/YY"
            keyboardType="numeric"
            value={expiryDate}
            onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
            maxLength={5}
            editable={!processing}
          />
        </View>

        <View style={[styles.inputContainer, styles.halfWidth]}>
          <Text style={styles.label}>CVV</Text>
          <TextInput
            style={styles.input}
            placeholder="123"
            keyboardType="numeric"
            value={cvv}
            onChangeText={setCvv}
            maxLength={4}
            secureTextEntry
            editable={!processing}
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Cardholder Name</Text>
        <TextInput
          style={styles.input}
          placeholder="John Doe"
          value={cardholderName}
          onChangeText={setCardholderName}
          autoCapitalize="words"
          editable={!processing}
        />
      </View>
    </View>
  );

  const renderOtherPaymentMethod = () => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>
        {paymentMethods.find(m => m.id === paymentMethod)?.name}
      </Text>
      <Text style={styles.placeholderText}>
        {paymentMethod === 'paypal' && 'You will be redirected to PayPal to complete the payment.'}
        {paymentMethod === 'bank_transfer' && 'Bank transfer instructions will be provided after confirmation.'}
        {paymentMethod === 'crypto' && 'Cryptocurrency payment options will be shown after confirmation.'}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Complete Payment</Text>
          <View style={styles.orderSummary}>
            <Text style={styles.orderLabel}>Subscription:</Text>
            <Text style={styles.orderValue}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)} - {billingCycle}
            </Text>
            <Text style={styles.orderLabel}>Amount:</Text>
            <Text style={styles.orderAmount}>${amount}</Text>
          </View>
        </View>

        <View style={styles.paymentMethodsSection}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentMethodsGrid}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethodCard,
                  paymentMethod === method.id && styles.paymentMethodCardSelected
                ]}
                onPress={() => setPaymentMethod(method.id)}
                disabled={processing}
              >
                <Text style={styles.paymentMethodIcon}>{method.icon}</Text>
                <Text style={styles.paymentMethodName}>{method.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {paymentMethod === 'credit_card' ? renderCreditCardForm() : renderOtherPaymentMethod()}

        <View style={styles.securityNote}>
          <Text style={styles.securityIcon}>🔒</Text>
          <Text style={styles.securityText}>
            Your payment information is encrypted and secure
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <AnimatedButton
          onPress={handlePayment}
          disabled={processing}
          loading={processing}
        >
          {processing ? 'Processing...' : `Pay $${amount}`}
        </AnimatedButton>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={processing}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120
  },
  header: {
    marginBottom: 24
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16
  },
  orderSummary: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  orderLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 8
  },
  orderValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600'
  },
  orderAmount: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: 'bold',
    marginTop: 4
  },
  paymentMethodsSection: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12
  },
  paymentMethodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  paymentMethodCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0'
  },
  paymentMethodCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF'
  },
  paymentMethodIcon: {
    fontSize: 32,
    marginBottom: 8
  },
  paymentMethodName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center'
  },
  formSection: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16
  },
  inputContainer: {
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333'
  },
  row: {
    flexDirection: 'row',
    gap: 12
  },
  halfWidth: {
    flex: 1
  },
  placeholderText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 8
  },
  securityIcon: {
    fontSize: 20,
    marginRight: 8
  },
  securityText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500'
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default PaymentScreen;
