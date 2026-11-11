import { Icon } from './Icon'

export function ErrorNotice({
  message,
  retry,
}: {
  message: string
  retry?: () => void
}) {
  return (
    <div className="notice notice-error" role="alert">
      <Icon name="info" />
      <div>
        <p>{message}</p>
        {retry && (
          <button className="text-button" onClick={retry}>
            다시 시도하기 <Icon name="refresh" size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

export function Loading({
  label = '잠시만요, 질문함을 불러오고 있어요.',
}: {
  label?: string
}) {
  return (
    <div className="loading-state" role="status">
      <span className="spinner" />
      <p>{label}</p>
      <small>조금 늦어져도 잠시만 기다려 주세요.</small>
    </div>
  )
}
