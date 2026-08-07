import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] caught:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#FEF2F2' }}>
            <AlertTriangle size={22} style={{ color: '#EF4444' }} />
          </div>
          <div className="text-center max-w-md">
            <p className="text-slate-800 font-bold text-[16px] mb-1">Something went wrong</p>
            <p className="text-slate-500 text-[13px] mb-3">
              {this.props.label || 'This page'} encountered an unexpected error.
            </p>
            <pre className="text-left bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-red-600 overflow-x-auto max-w-full whitespace-pre-wrap break-words mb-4">
              {this.state.error.message}
            </pre>
            <button
              onClick={() => this.setState({ error: null })}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-[13px] font-semibold mx-auto"
              style={{ background: 'linear-gradient(135deg,#5B5CEB,#818CF8)' }}
            >
              <RefreshCw size={13} /> Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
