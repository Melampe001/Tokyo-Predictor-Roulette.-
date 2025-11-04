import { useState, useEffect, useRef } from 'react'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

function App() {
  const [connected, setConnected] = useState(false)
  const [usingStub, setUsingStub] = useState(false)
  const [results, setResults] = useState([])
  const [analysis, setAnalysis] = useState(null)
  const [resultInput, setResultInput] = useState('')
  const [status, setStatus] = useState('')
  const wsRef = useRef(null)

  useEffect(() => {
    connectWebSocket()
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  const connectWebSocket = () => {
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      setStatus('Connected to server')
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        
        switch (message.type) {
          case 'connected':
            setUsingStub(message.usingStub)
            break
          
          case 'result-update':
            setResults(prev => [...prev, message.data])
            setStatus(`New result: ${message.data.resultado}`)
            break
          
          case 'analysis':
          case 'analysis-update':
            setAnalysis(message.data)
            setStatus('Analysis updated')
            break
          
          case 'results':
            setResults(message.data)
            break
          
          case 'error':
            setStatus(`Error: ${message.message}`)
            break
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    ws.onerror = (error) => {
      setStatus('WebSocket error')
      console.error('WebSocket error:', error)
    }

    ws.onclose = () => {
      setConnected(false)
      setStatus('Disconnected from server')
      
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        setStatus('Reconnecting...')
        connectWebSocket()
      }, 3000)
    }
  }

  const sendResult = () => {
    const value = parseInt(resultInput)
    
    if (isNaN(value)) {
      setStatus('Please enter a valid number')
      return
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'result',
        value: value
      }))
      setResultInput('')
      setStatus(`Sent result: ${value}`)
    } else {
      setStatus('Not connected to server')
    }
  }

  const requestAnalysis = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'request-analysis'
      }))
      setStatus('Requesting analysis...')
    } else {
      setStatus('Not connected to server')
    }
  }

  const requestResults = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'request-results',
        count: 50
      }))
      setStatus('Requesting results...')
    } else {
      setStatus('Not connected to server')
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h1>Tokyo Predictor Roulette - Dashboard</h1>
      
      {/* Connection Status */}
      <div style={{ 
        padding: '15px', 
        marginBottom: '20px', 
        backgroundColor: connected ? '#d4edda' : '#f8d7da',
        borderRadius: '5px',
        border: `1px solid ${connected ? '#c3e6cb' : '#f5c6cb'}`
      }}>
        <strong>Status:</strong> {status}
        {usingStub && (
          <div style={{ marginTop: '5px', color: '#856404', backgroundColor: '#fff3cd', padding: '8px', borderRadius: '3px' }}>
            ⚠ Running with stub implementation - real TokioAI should be integrated
          </div>
        )}
      </div>

      {/* Input Section */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
        <h2>Submit Result</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="number"
            value={resultInput}
            onChange={(e) => setResultInput(e.target.value)}
            placeholder="Enter result value"
            style={{ 
              padding: '8px 12px', 
              fontSize: '16px', 
              borderRadius: '4px', 
              border: '1px solid #ced4da',
              width: '200px'
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') sendResult()
            }}
          />
          <button 
            onClick={sendResult}
            disabled={!connected}
            style={{ 
              padding: '8px 20px', 
              fontSize: '16px', 
              backgroundColor: connected ? '#007bff' : '#6c757d',
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: connected ? 'pointer' : 'not-allowed'
            }}
          >
            Submit Result
          </button>
        </div>
      </div>

      {/* Actions */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button 
          onClick={requestAnalysis}
          disabled={!connected}
          style={{ 
            padding: '10px 20px', 
            fontSize: '16px', 
            backgroundColor: connected ? '#28a745' : '#6c757d',
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: connected ? 'pointer' : 'not-allowed'
          }}
        >
          Request Analysis
        </button>
        <button 
          onClick={requestResults}
          disabled={!connected}
          style={{ 
            padding: '10px 20px', 
            fontSize: '16px', 
            backgroundColor: connected ? '#17a2b8' : '#6c757d',
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: connected ? 'pointer' : 'not-allowed'
          }}
        >
          Fetch Recent Results
        </button>
      </div>

      {/* Analysis Display */}
      {analysis && (
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '5px', border: '1px solid #b3d9ff' }}>
          <h2>Analysis</h2>
          <div style={{ marginBottom: '10px' }}>
            <strong>Suggestion:</strong> {analysis.suggestion}
          </div>
          {analysis.statistics && (
            <div style={{ fontSize: '14px' }}>
              <p><strong>Total Results:</strong> {analysis.statistics.totalResults}</p>
              <p><strong>Most Frequent:</strong> {analysis.statistics.mostFrequent}</p>
              <p><strong>Dominant Trend:</strong> {analysis.statistics.dominantTrend}</p>
              <p><strong>Accuracy:</strong> {(analysis.statistics.accuracy * 100).toFixed(1)}%</p>
              <p><strong>Last Update:</strong> {analysis.statistics.lastUpdate}</p>
            </div>
          )}
        </div>
      )}

      {/* Results Display */}
      <div style={{ marginTop: '20px' }}>
        <h2>Recent Results ({results.length})</h2>
        <div style={{ 
          maxHeight: '300px', 
          overflowY: 'auto', 
          border: '1px solid #dee2e6', 
          borderRadius: '5px',
          backgroundColor: 'white'
        }}>
          {results.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
              No results yet. Submit a result to get started.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Result</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Date</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {results.slice().reverse().map((result, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '10px' }}><strong>{result.resultado}</strong></td>
                    <td style={{ padding: '10px' }}>{result.fecha}</td>
                    <td style={{ padding: '10px' }}>{result.hora}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #dee2e6', color: '#6c757d', fontSize: '14px' }}>
        <p>Tokyo Predictor Roulette Backend v1.0.0</p>
        <p>WebSocket URL: {WS_URL}</p>
        <p>API URL: {API_URL}</p>
      </div>
    </div>
  )
}

export default App
