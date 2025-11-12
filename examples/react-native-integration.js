// React Native Integration Example for TokioAI Backend
// This example demonstrates how to integrate the TokioAI backend with a React Native app

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';

// ==================== TokioAI Client Class ====================

class TokioAIClient {
  constructor(baseUrl, wsUrl) {
    this.baseUrl = baseUrl;
    this.wsUrl = wsUrl;
    this.ws = null;
    this.messageHandlers = [];
  }

  // REST API Methods

  async submitResult(value) {
    const response = await fetch(`${this.baseUrl}/api/result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });

    if (!response.ok) {
      throw new Error(`Failed to submit result: ${response.status}`);
    }

    return await response.json();
  }

  async getAnalysis(count = null) {
    const url = count
      ? `${this.baseUrl}/api/analysis?count=${count}`
      : `${this.baseUrl}/api/analysis`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to get analysis: ${response.status}`);
    }

    return await response.json();
  }

  async getResults(limit = 50) {
    const response = await fetch(
      `${this.baseUrl}/api/results?limit=${limit}`
    );

    if (!response.ok) {
      throw new Error(`Failed to get results: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  }

  async getStatistics() {
    const response = await fetch(`${this.baseUrl}/api/statistics`);

    if (!response.ok) {
      throw new Error(`Failed to get statistics: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  }

  async clearResults() {
    const response = await fetch(`${this.baseUrl}/api/clear`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to clear results: ${response.status}`);
    }

    return await response.json();
  }

  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch (e) {
      return false;
    }
  }

  // WebSocket Methods

  connectWebSocket(onMessage, onError, onClose) {
    if (this.ws) {
      this.ws.close();
    }

    this.ws = new WebSocket(this.wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (onMessage) {
          onMessage(message);
        }
      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (onError) {
        onError(error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      if (onClose) {
        onClose();
      }
    };
  }

  sendMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  sendResultViaWebSocket(value) {
    this.sendMessage({ type: 'result', value });
  }

  requestAnalysis(count = null) {
    const message = { type: 'request-analysis' };
    if (count) {
      message.count = count;
    }
    this.sendMessage(message);
  }

  requestResults(limit = null) {
    const message = { type: 'request-results' };
    if (limit) {
      message.limit = limit;
    }
    this.sendMessage(message);
  }

  requestStatistics() {
    this.sendMessage({ type: 'request-statistics' });
  }

  sendPing() {
    this.sendMessage({ type: 'ping' });
  }

  disconnectWebSocket() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  dispose() {
    this.disconnectWebSocket();
  }
}

// ==================== React Native Component Example ====================

const TokioAIApp = () => {
  const [client] = useState(
    () =>
      new TokioAIClient('http://localhost:8080', 'ws://localhost:8080')
  );

  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [suggestion, setSuggestion] = useState('');
  const [statistics, setStatistics] = useState(null);

  // Connect to WebSocket on mount
  useEffect(() => {
    const handleMessage = (message) => {
      console.log('WebSocket message:', message.type);

      switch (message.type) {
        case 'connected':
          setIsConnected(true);
          // Request initial data
          client.requestResults(50);
          client.requestStatistics();
          break;

        case 'result-update':
        case 'result-captured':
          setResults((prev) => [message.data, ...prev].slice(0, 50));
          break;

        case 'analysis':
          setSuggestion(message.data.suggestion);
          break;

        case 'results':
          setResults(message.data);
          break;

        case 'statistics':
          setStatistics(message.data);
          break;

        case 'results-cleared':
          setResults([]);
          setSuggestion('');
          break;

        case 'error':
          Alert.alert('Error', message.message);
          break;
      }
    };

    const handleError = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    const handleClose = () => {
      setIsConnected(false);
    };

    client.connectWebSocket(handleMessage, handleError, handleClose);

    // Check health
    client.healthCheck().then((healthy) => {
      if (!healthy) {
        Alert.alert(
          'Backend Unavailable',
          'Cannot connect to TokioAI backend'
        );
      }
    });

    // Cleanup on unmount
    return () => {
      client.dispose();
    };
  }, [client]);

  // Submit result handler
  const handleSubmitResult = useCallback(
    async (value) => {
      setIsLoading(true);
      try {
        // Submit via REST API
        await client.submitResult(value);

        // Request updated analysis
        const analysisData = await client.getAnalysis();
        setSuggestion(analysisData.data.suggestion);
      } catch (error) {
        Alert.alert('Error', error.message);
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  // Clear results handler
  const handleClearResults = useCallback(async () => {
    Alert.alert(
      'Clear Results',
      'Are you sure you want to clear all results?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await client.clearResults();
              setResults([]);
              setSuggestion('');
              setStatistics(null);
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  }, [client]);

  // Render number button
  const renderNumberButton = (number) => (
    <TouchableOpacity
      key={number}
      style={[
        styles.numberButton,
        number === 0 && styles.numberButtonZero,
      ]}
      onPress={() => handleSubmitResult(number)}
      disabled={isLoading}
    >
      <Text style={styles.numberButtonText}>{number}</Text>
    </TouchableOpacity>
  );

  // Render result item
  const renderResultItem = ({ item }) => (
    <View style={styles.resultItem}>
      <Text style={styles.resultValue}>{item.resultado}</Text>
      <Text style={styles.resultTime}>
        {item.fecha} {item.hora}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>TokioAI Client</Text>
        <View style={[styles.statusDot, isConnected && styles.statusConnected]} />
      </View>

      {/* Suggestion */}
      <View style={styles.suggestionCard}>
        <Text style={styles.suggestionLabel}>Analysis:</Text>
        <Text style={styles.suggestionText}>
          {suggestion || 'Submit results to get analysis'}
        </Text>
      </View>

      {/* Statistics */}
      {statistics && (
        <View style={styles.statisticsCard}>
          <Text style={styles.statisticsText}>
            Results: {statistics.currentResults}
          </Text>
        </View>
      )}

      {/* Number Grid (0-36) */}
      <View style={styles.numberGrid}>
        {Array.from({ length: 37 }, (_, i) => i).map(renderNumberButton)}
      </View>

      {/* Results List */}
      <View style={styles.resultsContainer}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>Recent Results</Text>
          <TouchableOpacity onPress={handleClearResults}>
            <Text style={styles.clearButton}>Clear</Text>
          </TouchableOpacity>
        </View>

        {isLoading && <ActivityIndicator size="large" color="#6366f1" />}

        <FlatList
          data={results}
          renderItem={renderResultItem}
          keyExtractor={(item, index) => `${item.timestamp}-${index}`}
          style={styles.resultsList}
          contentContainerStyle={styles.resultsListContent}
        />
      </View>
    </View>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#6366f1',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ef4444',
  },
  statusConnected: {
    backgroundColor: '#22c55e',
  },
  suggestionCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 16,
    color: '#1f2937',
  },
  statisticsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#dbeafe',
    borderRadius: 8,
  },
  statisticsText: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '600',
  },
  numberGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  numberButton: {
    width: '13%',
    aspectRatio: 1,
    margin: '1%',
    backgroundColor: '#1f2937',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberButtonZero: {
    backgroundColor: '#22c55e',
  },
  numberButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  clearButton: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
  },
  resultsList: {
    flex: 1,
  },
  resultsListContent: {
    paddingBottom: 16,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  resultValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  resultTime: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default TokioAIApp;

// ==================== Usage in App.js ====================

/*
import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import TokioAIApp from './TokioAIApp';

const App = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor="#6366f1" />
      <TokioAIApp />
    </SafeAreaView>
  );
};

export default App;
*/

// ==================== Installation Instructions ====================

/*
# React Native Setup

1. Install dependencies:
   npm install --save react-native-webview
   # or
   yarn add react-native-webview

2. For iOS:
   cd ios && pod install && cd ..

3. Update your server URL:
   - Replace 'http://localhost:8080' with your actual server IP
   - For Android emulator: use 'http://10.0.2.2:8080'
   - For iOS simulator: use 'http://localhost:8080'
   - For physical devices: use your computer's IP address

4. Run the app:
   npx react-native run-android
   # or
   npx react-native run-ios
*/
