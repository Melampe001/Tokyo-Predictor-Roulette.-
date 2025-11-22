/**
 * Example: Authentication and Data Usage
 * 
 * This script demonstrates how to:
 * 1. Register a new user
 * 2. Login and get JWT token
 * 3. Submit results with authentication
 * 4. Get statistics and analysis
 * 5. Export user data
 */

// Note: This example uses fetch API which requires Node.js 18+ or a polyfill

const BASE_URL = process.env.API_URL || 'http://localhost:8080';

/**
 * Register a new user
 */
async function registerUser(username, password) {
  console.log(`\n📝 Registering user: ${username}`);
  
  const response = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await response.json();
  
  if (response.ok) {
    console.log('✅ User registered successfully:', data.user);
    return data.user;
  } else {
    console.log('❌ Registration failed:', data.message);
    return null;
  }
}

/**
 * Login and get authentication token
 */
async function loginUser(username, password) {
  console.log(`\n🔑 Logging in: ${username}`);
  
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await response.json();
  
  if (response.ok) {
    console.log('✅ Login successful');
    console.log('   Token:', data.token.substring(0, 30) + '...');
    console.log('   User:', data.user);
    return data.token;
  } else {
    console.log('❌ Login failed:', data.message);
    return null;
  }
}

/**
 * Verify token
 */
async function verifyToken(token) {
  console.log('\n🔍 Verifying token...');
  
  const response = await fetch(`${BASE_URL}/api/auth/verify`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await response.json();
  
  if (response.ok) {
    console.log('✅ Token is valid for user:', data.user.username);
    return true;
  } else {
    console.log('❌ Token verification failed:', data.message);
    return false;
  }
}

/**
 * Submit a result
 */
async function submitResult(token, value) {
  console.log(`\n📊 Submitting result: ${value}`);
  
  const response = await fetch(`${BASE_URL}/api/result`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ value })
  });

  const data = await response.json();
  
  if (response.ok) {
    console.log('✅ Result submitted:', data.data);
    return data.data;
  } else {
    console.log('❌ Failed to submit result:', data.message);
    return null;
  }
}

/**
 * Get results
 */
async function getResults(token, limit = 10) {
  console.log(`\n📋 Fetching last ${limit} results...`);
  
  const response = await fetch(`${BASE_URL}/api/results?limit=${limit}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await response.json();
  
  if (response.ok) {
    console.log(`✅ Retrieved ${data.data.length} results`);
    data.data.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.resultado} (${result.fecha} ${result.hora})`);
    });
    return data.data;
  } else {
    console.log('❌ Failed to get results:', data.message);
    return null;
  }
}

/**
 * Get statistics
 */
async function getStatistics(token) {
  console.log('\n📈 Fetching statistics...');
  
  const response = await fetch(`${BASE_URL}/api/statistics`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await response.json();
  
  if (response.ok) {
    console.log('✅ Statistics:');
    console.log('   Total Results:', data.data.totalResults);
    console.log('   Frequencies:', data.data.frequencies);
    console.log('   Last Updated:', data.data.lastUpdated);
    return data.data;
  } else {
    console.log('❌ Failed to get statistics:', data.message);
    return null;
  }
}

/**
 * Get analysis
 */
async function getAnalysis(token, count = 10) {
  console.log(`\n🔮 Getting analysis (last ${count} results)...`);
  
  const response = await fetch(`${BASE_URL}/api/analysis?count=${count}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await response.json();
  
  if (response.ok) {
    console.log('✅ Analysis:');
    console.log('   Suggestion:', data.data.suggestion);
    console.log('   Batch Size:', data.data.batchSize);
    return data.data;
  } else {
    console.log('❌ Failed to get analysis:', data.message);
    return null;
  }
}

/**
 * Export user data
 */
async function exportData(token) {
  console.log('\n💾 Exporting user data...');
  
  const response = await fetch(`${BASE_URL}/api/export`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await response.json();
  
  if (response.ok) {
    console.log('✅ Data exported successfully');
    console.log('   Export Date:', data.data.exportDate);
    console.log('   Results count:', data.data.results.length);
    console.log('   History count:', data.data.history.length);
    return data.data;
  } else {
    console.log('❌ Failed to export data:', data.message);
    return null;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🎰 Tokyo Predictor Roulette - Authentication Example');
  console.log('=' .repeat(60));

  // Generate unique username for this example
  const username = `demo_user_${Date.now()}`;
  const password = 'SecurePass123!';

  try {
    // 1. Register
    const user = await registerUser(username, password);
    if (!user) {
      console.log('\n❌ Registration failed, cannot continue');
      return;
    }

    // 2. Login
    const token = await loginUser(username, password);
    if (!token) {
      console.log('\n❌ Login failed, cannot continue');
      return;
    }

    // 3. Verify token
    await verifyToken(token);

    // 4. Submit some results
    console.log('\n' + '-'.repeat(60));
    console.log('Submitting sample results...');
    const sampleResults = [12, 7, 35, 0, 23, 15, 8, 29, 11, 34];
    
    for (const value of sampleResults) {
      await submitResult(token, value);
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 5. Get results
    console.log('\n' + '-'.repeat(60));
    await getResults(token, 10);

    // 6. Get statistics
    console.log('\n' + '-'.repeat(60));
    await getStatistics(token);

    // 7. Get analysis
    console.log('\n' + '-'.repeat(60));
    await getAnalysis(token, 10);

    // 8. Export data
    console.log('\n' + '-'.repeat(60));
    await exportData(token);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Example completed successfully!');
    console.log('\n💡 Tips:');
    console.log('   - Token expires in 24 hours');
    console.log('   - All data is encrypted at rest');
    console.log('   - Each user has isolated data');
    console.log('   - WebSocket also supports authentication');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export {
  registerUser,
  loginUser,
  verifyToken,
  submitResult,
  getResults,
  getStatistics,
  getAnalysis,
  exportData
};
