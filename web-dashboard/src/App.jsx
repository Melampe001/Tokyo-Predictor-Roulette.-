import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [results, setResults] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [newValue, setNewValue] = useState('');
  const [statistics, setStatistics] = useState(null);
  const [error, setError] = useState('');
  const wsRef = useRef(null);

  // WebSocket connection
  useEffect(() => {
    const wsUrl = `ws://${window.location.hostname}:8080`;
    console.log('Connecting to WebSocket:', wsUrl);
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setConnectionStatus('connected');
      // Request initial data
      ws.send(JSON.stringify({ type: 'request-results', limit: 20 }));
      ws.send(JSON.stringify({ type: 'request-statistics' }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('WebSocket message:', message);

        switch (message.type) {
          case 'connected':
            console.log(message.message);
            break;
          case 'result-update':
            setResults(prev => [...prev.slice(-19), message.data]);
            break;
          case 'result-captured':
            setResults(prev => [...prev.slice(-19), message.data]);
            break;
          case 'results':
            setResults(message.data);
            break;
          case 'analysis':
            setAnalysis(message.data);
            break;
          case 'statistics':
            setStatistics(message.data);
            break;
          case 'results-cleared':
            setResults([]);
            setAnalysis(null);
            break;
          case 'error':
            console.error('Server error:', message.message);
            break;
          default:
            console.log('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('error');
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setConnectionStatus('disconnected');
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleSubmitResult = (e) => {
    e.preventDefault();
    setError('');
    const value = parseInt(newValue);
    
    if (isNaN(value)) {
      setError('Por favor ingrese un número válido');
      return;
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'result',
        value: value
      }));
      setNewValue('');
    } else {
      setError('No conectado al servidor. Verifique la conexión.');
    }
  };

  const handleRequestAnalysis = () => {
    setError('');
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'request-analysis'
      }));
    } else {
      setError('No conectado al servidor. Verifique la conexión.');
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#4ade80';
      case 'disconnected': return '#f87171';
      case 'error': return '#fbbf24';
      default: return '#9ca3af';
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🎰 Tokyo Predictor Dashboard</h1>
        <div className="connection-status">
          <div 
            className="status-indicator" 
            style={{ backgroundColor: getStatusColor() }}
          />
          <span>{connectionStatus}</span>
        </div>
      </header>

      <main className="main">
        <div className="grid">
          {/* Input Section */}
          <div className="card">
            <h2>📝 Nuevo Resultado</h2>
            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}
            <form onSubmit={handleSubmitResult} className="form">
              <input
                type="number"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Ingrese número (ej: 12)"
                className="input"
                min="0"
                max="36"
                disabled={connectionStatus !== 'connected'}
              />
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={connectionStatus !== 'connected'}
              >
                Enviar Resultado
              </button>
            </form>
          </div>

          {/* Analysis Section */}
          <div className="card">
            <h2>📊 Análisis</h2>
            <button 
              onClick={handleRequestAnalysis} 
              className="btn btn-secondary"
              style={{ marginBottom: '1rem' }}
            >
              Solicitar Análisis
            </button>
            {analysis ? (
              <div className="analysis">
                <div className="analysis-item">
                  <strong>Tamaño del lote:</strong> {analysis.batchSize}
                </div>
                <div className="analysis-item">
                  <strong>Sugerencia:</strong>
                  <p>{analysis.suggestion}</p>
                </div>
                {analysis.statistics && (
                  <>
                    <div className="analysis-item">
                      <strong>Más frecuente:</strong> {analysis.statistics.mostFrequent}
                    </div>
                    <div className="analysis-item">
                      <strong>Total resultados:</strong> {analysis.statistics.totalResults}
                    </div>
                  </>
                )}
                {analysis.stub && (
                  <div className="warning">
                    ⚠️ Usando implementación básica (stub)
                  </div>
                )}
              </div>
            ) : (
              <p className="empty-state">No hay análisis disponible</p>
            )}
          </div>

          {/* Statistics Section */}
          <div className="card">
            <h2>📈 Estadísticas</h2>
            {statistics ? (
              <div className="stats">
                <div className="stat-item">
                  <span className="stat-label">Resultados actuales:</span>
                  <span className="stat-value">{statistics.currentResults}</span>
                </div>
                {statistics.totalResults !== undefined && (
                  <div className="stat-item">
                    <span className="stat-label">Total procesados:</span>
                    <span className="stat-value">{statistics.totalResults}</span>
                  </div>
                )}
                {statistics.uptime !== undefined && (
                  <div className="stat-item">
                    <span className="stat-label">Uptime:</span>
                    <span className="stat-value">
                      {Math.floor(statistics.uptime / 1000)}s
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="empty-state">Cargando estadísticas...</p>
            )}
          </div>

          {/* Recent Results */}
          <div className="card results-card">
            <h2>🎲 Resultados Recientes</h2>
            <div className="results-list">
              {results.length > 0 ? (
                results.slice().reverse().map((result, idx) => (
                  <div key={idx} className="result-item">
                    <span className="result-number">{result.resultado}</span>
                    <div className="result-meta">
                      <span>{result.fecha}</span>
                      <span>{result.hora}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-state">No hay resultados todavía</p>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>Tokyo Predictor Roulette © 2024 - Análisis Predictivo en Tiempo Real</p>
      </footer>
    </div>
  );
}

export default App;
