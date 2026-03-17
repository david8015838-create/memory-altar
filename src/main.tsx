// ============================================================
// main.tsx - 應用程式入口點
// ============================================================

import React, { Component, type ReactNode, type ErrorInfo } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Root-level error boundary: catches any uncaught error to prevent blank screen
class RootErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[RootErrorBoundary]', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16,
          background: 'linear-gradient(135deg, #0f0a28 0%, #1a1040 100%)',
          color: 'rgba(255,255,255,0.8)', fontFamily: 'sans-serif', padding: 24,
        }}>
          <div style={{ fontSize: 40 }}>😢</div>
          <p style={{ fontSize: 16, margin: 0 }}>出了點問題，請重新整理頁面</p>
          <button
            style={{
              marginTop: 8, padding: '10px 24px', borderRadius: 20, border: 'none',
              background: 'rgba(167,139,250,0.9)', color: '#000', fontSize: 14, cursor: 'pointer',
            }}
            onClick={() => window.location.reload()}
          >
            重新整理
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>,
)
