import { Component, type ErrorInfo, type ReactNode } from 'react'
import Card from '../ui/Card'

type Props = { children: ReactNode }
type State = { hasError: boolean; errorMessage: string }

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorMessage: '' }

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      errorMessage: error instanceof Error ? error.message : 'An unexpected application error occurred.',
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Startup OS render error:', error, info.componentStack)
  }

  private recover = () => {
    this.setState({ hasError: false, errorMessage: '' })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main className="min-h-screen bg-[var(--os-bg)] p-6 text-[var(--os-text)] sm:p-10">
        <div className="mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center">
          <Card className="w-full p-7 sm:p-9">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--os-danger-soft)] text-[var(--os-danger)] text-xl font-bold">!</div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--os-accent)]">Startup OS recovery</p>
            <h1 className="mt-2 text-2xl font-semibold">Something went wrong while rendering the portal.</h1>
            <p className="mt-3 text-sm leading-6 text-[var(--os-text-secondary)]">The application caught the error instead of leaving you with a blank white screen. Your saved workspace data has not been deleted.</p>
            <pre className="mt-5 max-h-40 overflow-auto rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-4 text-xs text-[var(--os-danger)] whitespace-pre-wrap">{this.state.errorMessage}</pre>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" onClick={this.recover} className="os-focus-ring rounded-xl bg-[var(--os-accent)] px-4 py-2.5 text-sm font-semibold text-white">Try again</button>
              <button type="button" onClick={() => window.location.reload()} className="os-focus-ring rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] px-4 py-2.5 text-sm font-semibold text-[var(--os-text)]">Reload portal</button>
            </div>
          </Card>
        </div>
      </main>
    )
  }
}