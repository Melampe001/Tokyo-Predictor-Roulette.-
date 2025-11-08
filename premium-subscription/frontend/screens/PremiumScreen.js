/**
 * Premium Screen
 * 
 * Displays premium subscription tiers and features
 * Allows users to view and select subscription plans
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';

const PremiumScreen = ({ navigation, user, onSubscribe }) => {
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');

  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    try {
      setLoading(true);
      // In production, this would be an API call
      // const response = await fetch('/api/subscriptions/tiers');
      // const data = await response.json();
      
      // Mock data for demonstration (prices in Mexican Pesos - MXN)
      const mockTiers = [
        {
          tier: 'basic',
          pricing: { monthly: 0, yearly: 0 },
          features: [
            'Basic predictions',
            'Limited analysis history',
            'Standard support',
            'No billing required'
          ]
        },
        {
          tier: 'advanced',
          pricing: { monthly: 99, yearly: 990 },
          features: [
            'All basic features',
            'Advanced predictions',
            'Extended analysis history (30 days)',
            'Real-time updates',
            'Priority support'
          ]
        },
        {
          tier: 'premium',
          pricing: { monthly: 149, yearly: 1490 },
          features: [
            'All advanced features',
            'Unlimited analysis history',
            'Advanced analytics dashboard',
            'Premium support',
            'Export to PDF',
            'Custom integrations'
          ]
        }
      ];

      setTiers(mockTiers);
    } catch (error) {
      Alert.alert('Error', 'Failed to load subscription tiers');
      console.error('Failed to fetch tiers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTier = (tier) => {
    if (tier.tier === 'basic') {
      Alert.alert('Info', 'You are already on the free Basic tier. Select Advanced or Premium to upgrade.');
      return;
    }
    setSelectedTier(tier);
  };

  const handleSubscribe = () => {
    if (!selectedTier) {
      Alert.alert('Error', 'Please select a subscription tier');
      return;
    }

    // Navigate to payment screen
    navigation.navigate('Payment', {
      tier: selectedTier.tier,
      billingCycle,
      amount: selectedTier.pricing[billingCycle]
    });
  };

  const getTierName = (tier) => {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  const renderTierCard = (tierData) => {
    const isSelected = selectedTier?.tier === tierData.tier;
    const isCurrent = user?.subscription?.tier === tierData.tier;

    return (
      <TouchableOpacity
        key={tierData.tier}
        style={[
          styles.tierCard,
          isSelected && styles.tierCardSelected,
          isCurrent && styles.tierCardCurrent
        ]}
        onPress={() => handleSelectTier(tierData)}
        activeOpacity={0.7}
      >
        <View style={styles.tierHeader}>
          <Text style={styles.tierName}>{getTierName(tierData.tier)}</Text>
          {isCurrent && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeText}>Current</Text>
            </View>
          )}
        </View>

        <View style={styles.pricingContainer}>
          <Text style={styles.price}>
            ${tierData.pricing[billingCycle]}
          </Text>
          <Text style={styles.billingCycleText}>
            /{billingCycle === 'monthly' ? 'month' : 'year'}
          </Text>
        </View>

        {billingCycle === 'yearly' && tierData.pricing.yearly > 0 && (
          <Text style={styles.savingsText}>
            Save ${((tierData.pricing.monthly * 12) - tierData.pricing.yearly).toFixed(2)}/year
          </Text>
        )}

        <View style={styles.featuresContainer}>
          {tierData.features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Text style={styles.selectedText}>Selected</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading subscription options...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Plan</Text>
          <Text style={styles.subtitle}>
            Unlock premium features and enhance your experience
          </Text>
        </View>

        <View style={styles.billingToggle}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              billingCycle === 'monthly' && styles.toggleButtonActive
            ]}
            onPress={() => setBillingCycle('monthly')}
          >
            <Text
              style={[
                styles.toggleText,
                billingCycle === 'monthly' && styles.toggleTextActive
              ]}
            >
              Monthly
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              billingCycle === 'yearly' && styles.toggleButtonActive
            ]}
            onPress={() => setBillingCycle('yearly')}
          >
            <Text
              style={[
                styles.toggleText,
                billingCycle === 'yearly' && styles.toggleTextActive
              ]}
            >
              Yearly
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tiersContainer}>
          {tiers.map(renderTierCard)}
        </View>
      </ScrollView>

      {selectedTier && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={handleSubscribe}
            activeOpacity={0.8}
          >
            <Text style={styles.subscribeButtonText}>
              Continue to Payment
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
    paddingBottom: 100
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666'
  },
  header: {
    marginBottom: 24,
    alignItems: 'center'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
  },
  billingToggle: {
    flexDirection: 'row',
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    padding: 4,
    marginBottom: 24
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6
  },
  toggleButtonActive: {
    backgroundColor: '#007AFF'
  },
  toggleText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600'
  },
  toggleTextActive: {
    color: '#FFF'
  },
  tiersContainer: {
    gap: 16
  },
  tierCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  tierCardSelected: {
    borderColor: '#007AFF',
    borderWidth: 2
  },
  tierCardCurrent: {
    borderColor: '#4CAF50'
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  tierName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333'
  },
  currentBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  currentBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600'
  },
  pricingContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#007AFF'
  },
  billingCycleText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4
  },
  savingsText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 16
  },
  featuresContainer: {
    marginTop: 16
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  checkmark: {
    fontSize: 18,
    color: '#4CAF50',
    marginRight: 8
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20
  },
  selectedIndicator: {
    marginTop: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 6,
    alignItems: 'center'
  },
  selectedText: {
    color: '#FFF',
    fontWeight: '600'
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
  subscribeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  subscribeButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold'
  }
});

export default PremiumScreen;
