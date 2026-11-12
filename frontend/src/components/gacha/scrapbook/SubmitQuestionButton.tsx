import { Icon } from '../../Icon'

export function SubmitQuestionButton({
  disabled,
  pending,
  saved,
}: {
  disabled: boolean
  pending: boolean
  saved: boolean
}) {
  return (
    <button
      type="submit"
      className="scrapbook-submit"
      disabled={disabled}
      aria-busy={pending && !saved}
    >
      {saved ? (
        <>
          <Icon name="check" size={18} />
          캡슐에 담았어요!
        </>
      ) : pending ? (
        <>
          <span className="spinner" />
          캡슐에 담는 중…
        </>
      ) : (
        <>
          캡슐에 쏙 넣기
          <Icon name="arrow" size={18} />
        </>
      )}
    </button>
  )
}
