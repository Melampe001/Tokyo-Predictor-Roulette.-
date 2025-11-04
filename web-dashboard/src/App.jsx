import React, { useState, useEffect, useRef } from 'react';

function App() {
  const [connected, setConnected] = useState(false);
  const [results, setResults] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [manualResult, setManualResult] = useState('');
  const [message, setMessage] = useState('');
  const wsRef = useRef(null);

  // WebSocket connection
  useEffect(() => {
    const wsUrl = import.meta.env.DEV 
      ? 'ws://localhost:8080/ws'
      : `ws://${window.location.hostname}:8080/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
      setMessage('Connected to server');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message:', data);

        switch (data.type) {
          case 'connected':
            setStatistics(data.data.statistics);
            break;
          
          case 'result-update':
            setResults(prev => [...prev, data.data].slice(-50));
            break;
          
          case 'analysis':
          case 'analysis-update':
            setAnalysis(data.data);
            break;
          
          case 'results':
            setResults(data.data);
            break;
          
          case 'statistics':
            setStatistics(data.data);
            break;
          
          case 'error':
            setMessage(`Error: ${data.message}`);
            break;
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setMessage('WebSocket error occurred');
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
      setMessage('Disconnected from server');
    };

    // Cleanup on unmount
    return () => {
      ws.close();
    };
  }, []);

  // Send result via WebSocket
  const sendResult = () => {
    const value = parseInt(manualResult);
    if (isNaN(value)) {
      setMessage('Please enter a valid number');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'result',
        value
      }));
      setManualResult('');
      setMessage(`Result ${value} submitted`);
    } else {
      setMessage('Not connected to server');
    }
  };

  // Request analysis via WebSocket
  const requestAnalysis = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'request-analysis'
      }));
      setMessage('Analysis requested');
    } else {
      setMessage('Not connected to server');
    }
  };

  // Request latest results
  const requestResults = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'request-results',
        limit: 50
      }));
      setMessage('Results requested');
    } else {
      setMessage('Not connected to server');
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>🎰 Tokyo Predictor Roulette</h1>
        <div style={{
          ...styles.statusBadge,
          backgroundColor: connected ? '#4caf50' : '#f44336'
        }}>
          {connected ? '● Connected' : '● Disconnected'}
        </div>
      </header>

      {message && (
        <div style={styles.message}>
          {message}
        </div>
      )}

      <div style={styles.grid}>
        {/* Submit Result */}
        <section style={styles.card}>
          <h2>Submit Result</h2>
          <div style={styles.inputGroup}>
            <input
              type="number"
              value={manualResult}
              onChange={(e) => setManualResult(e.target.value)}
              placeholder="Enter result number"
              style={styles.input}
              onKeyPress={(e) => e.key === 'Enter' && sendResult()}
            />
            <button onClick={sendResult} style={styles.button}>
              Submit
            </button>
          </div>
        </section>

        {/* Actions */}
        <section style={styles.card}>
          <h2>Actions</h2>
          <div style={styles.buttonGroup}>
            <button onClick={requestAnalysis} style={styles.button}>
              Request Analysis
            </button>
            <button onClick={requestResults} style={styles.buttonSecondary}>
              Refresh Results
            </button>
          </div>
        </section>

        {/* Statistics */}
        {statistics && (
          <section style={styles.card}>
            <h2>Statistics</h2>
            <div style={styles.statsGrid}>
              <div style={styles.stat}>
                <div style={styles.statLabel}>Total Results</div>
                <div style={styles.statValue}>{statistics.currentResults || 0}</div>
              </div>
              <div style={styles.stat}>
                <div style={styles.statLabel}>Uptime</div>
                <div style={styles.statValue}>
                  {Math.floor((statistics.uptime || 0) / 60)}m
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Recent Results */}
        <section style={styles.card}>
          <h2>Recent Results ({results.length})</h2>
          <div style={styles.resultsList}>
            {results.length === 0 ? (
              <p style={styles.emptyState}>No results yet</p>
            ) : (
              results.slice(-10).reverse().map((result, index) => (
                <div key={index} style={styles.resultItem}>
                  <span style={styles.resultNumber}>{result.resultado}</span>
                  <span style={styles.resultTime}>
                    {result.hora} - {result.fecha}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Analysis */}
        {analysis && (
          <section style={styles.cardWide}>
            <h2>Analysis Results</h2>
            <div style={styles.analysisContent}>
              <div style={styles.analysisSection}>
                <h3>Batch Size: {analysis.batchSize}</h3>
                <p><strong>Suggestion:</strong> {analysis.suggestion}</p>
              </div>

              {analysis.trends && (
                <div style={styles.analysisSection}>
                  <h3>Trends</h3>
                  <p><strong>Most Frequent:</strong> {analysis.trends.mostFrequent} 
                     ({analysis.trends.maxFrequency} times)</p>
                  <p><strong>Dominant Trend:</strong> {analysis.trends.dominant}</p>
                  {analysis.trends.average && (
                    <p><strong>Average:</strong> {analysis.trends.average}</p>
                  )}
                </div>
              )}

              {analysis.frequencies && Object.keys(analysis.frequencies).length > 0 && (
                <div style={styles.analysisSection}>
                  <h3>Frequencies</h3>
                  <div style={styles.frequencyGrid}>
                    {Object.entries(analysis.frequencies)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 10)
                      .map(([num, freq]) => (
                        <div key={num} style={styles.frequencyItem}>
                          <span style={styles.frequencyNumber}>{num}</span>
                          <span style={styles.frequencyCount}>×{freq}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {analysis.patterns && (
                <div style={styles.analysisSection}>
                  <h3>Patterns</h3>
                  <p><strong>Sequences:</strong> {analysis.patterns.sequences?.length || 0}</p>
                  <p><strong>Repetitions:</strong> {analysis.patterns.repetitions?.length || 0}</p>
                </div>
              )}

              {analysis.statistics && (
                <div style={styles.analysisSection}>
                  <h3>Statistics</h3>
                  <p><strong>Total Results:</strong> {analysis.statistics.totalResults}</p>
                  <p><strong>Last Update:</strong> {analysis.statistics.lastUpdate}</p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      <footer style={styles.footer}>
        <p>Tokyo Predictor Roulette Dashboard - Real-time Analysis System</p>
      </footer>
    </div>
  );
}

// Styles
const styles = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  statusBadge: {
    padding: '8px 16px',
    borderRadius: '20px',
    color: '#fff',
    fontWeight: 'bold'
  },
  message: {
    padding: '12px',
    marginBottom: '20px',
    backgroundColor: '#2196f3',
    color: '#fff',
    borderRadius: '4px',
    textAlign: 'center'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '20px'
  },
  card: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  cardWide: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    gridColumn: '1 / -1'
  },
  inputGroup: {
    display: 'flex',
    gap: '10px'
  },
  input: {
    flex: 1,
    padding: '10px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '4px'
  },
  button: {
    padding: '10px 20px',
    fontSize: '16px',
    backgroundColor: '#2196f3',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  buttonSecondary: {
    padding: '10px 20px',
    fontSize: '16px',
    backgroundColor: '#757575',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px'
  },
  stat: {
    textAlign: 'center',
    padding: '10px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px'
  },
  statLabel: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '5px'
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#2196f3'
  },
  resultsList: {
    maxHeight: '300px',
    overflowY: 'auto'
  },
  resultItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px',
    borderBottom: '1px solid #eee'
  },
  resultNumber: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#2196f3'
  },
  resultTime: {
    fontSize: '12px',
    color: '#666'
  },
  emptyState: {
    textAlign: 'center',
    color: '#999',
    padding: '20px'
  },
  analysisContent: {
    display: 'grid',
    gap: '20px'
  },
  analysisSection: {
    padding: '15px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px'
  },
  frequencyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
    gap: '10px',
    marginTop: '10px'
  },
  frequencyItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px',
    backgroundColor: '#fff',
    borderRadius: '4px',
    border: '1px solid #ddd'
  },
  frequencyNumber: {
    fontWeight: 'bold',
    color: '#2196f3'
  },
  frequencyCount: {
    color: '#666'
  },
  footer: {
    textAlign: 'center',
    marginTop: '40px',
    color: '#666',
    fontSize: '14px'
  }
};

export default App;
