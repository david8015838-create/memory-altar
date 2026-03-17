import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props { children: ReactNode; widgetId: string }
interface State { hasError: boolean }

export class WidgetErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[WidgetErrorBoundary] widget=${this.props.widgetId}`, error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)', borderRadius: 12,
          border: '1px solid rgba(255,80,80,0.3)',
          fontSize: 11, color: 'rgba(255,100,100,0.8)',
          textAlign: 'center', padding: 8,
        }}>
          顯示錯誤
        </div>
      )
    }
    return this.props.children
  }
}
