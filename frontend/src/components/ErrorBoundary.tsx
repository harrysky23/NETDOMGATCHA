import { Component, type ErrorInfo, type ReactNode } from 'react'

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('NET 화면 오류', error, info.componentStack)
  }
  render() {
    if (this.state.failed)
      return (
        <main className="container form-width empty-state not-found">
          <span className="eyebrow">잠시만요</span>
          <h1>화면을 불러오지 못했어요.</h1>
          <p>잠시 후 새로고침해 주세요. 저장된 질문은 그대로 남아 있어요.</p>
          <button
            className="button button-primary"
            onClick={() => window.location.reload()}
          >
            새로고침
          </button>
        </main>
      )
    return this.props.children
  }
}
