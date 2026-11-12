import { Icon } from '../../Icon'
import netLabel from '../../../assets/scrapbook/net-label.png'

export function ScrapbookHeader({
  disabled,
  onClose,
}: {
  disabled: boolean
  onClose: () => void
}) {
  return (
    <header className="scrapbook-header">
      <div className="scrapbook-header-title">
        <img
          className="scrapbook-net-label"
          src={netLabel}
          alt="NET"
          draggable={false}
        />
        <h2 id="question-sheet-title" data-sheet-title tabIndex={-1}>
          캡슐에 질문 넣기
        </h2>
      </div>
      <button
        type="button"
        className="scrapbook-close"
        disabled={disabled}
        onClick={onClose}
        aria-label="질문 등록 닫기"
      >
        <Icon name="close" size={19} />
      </button>
    </header>
  )
}
