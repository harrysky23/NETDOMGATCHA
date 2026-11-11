import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import { useSession } from '../hooks/useSession'
import { TARGET_LABELS, type QuestionTarget } from '../types'
import { PageHeading } from '../components/PageHeading'
import { Icon } from '../components/Icon'
import { ErrorNotice } from '../components/Feedback'

const targets: { value: QuestionTarget; symbol: string; subtitle: string }[] = [
  { value: 'senior', symbol: '↗', subtitle: '경험이 궁금해요' },
  { value: 'junior', symbol: '↘', subtitle: '요즘이 궁금해요' },
  { value: 'all', symbol: '✳', subtitle: '함께 나누고 싶어요' },
]

export function QuestionSubmitPage() {
  const { session } = useSession()
  const [content, setContent] = useState('')
  const [target, setTarget] = useState<QuestionTarget>('all')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [savedContent, setSavedContent] = useState('')
  const busy = useRef(false)
  const textarea = useRef<HTMLTextAreaElement>(null)
  const count = Array.from(content).length
  const valid = !!content.trim() && count <= 200

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!valid || busy.current) return
    busy.current = true
    setPending(true)
    setError('')
    try {
      const question = await api.submitQuestion(
        session!,
        session!.participant.table_id,
        { content, target },
      )
      setSavedContent(question.content)
      setContent('')
      setSuccess(true)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : '질문을 담지 못했어요. 다시 시도해 주세요.',
      )
    } finally {
      busy.current = false
      setPending(false)
    }
  }

  function writeAgain() {
    setSuccess(false)
    setSavedContent('')
    setTarget('all')
    requestAnimationFrame(() => textarea.current?.focus())
  }

  return (
    <div className="container form-width">
      <PageHeading
        eyebrow="LEAVE A LITTLE QUESTION"
        title="어떤 이야기가 궁금한가요?"
        description="작은 호기심 하나가, 뜻밖의 이야기를 꺼내줄 거예요."
      />
      {success ? (
        <section className="success-panel" aria-labelledby="success-title">
          <div className="success-icon">
            <Icon name="check" size={32} />
          </div>
          <span className="eyebrow">QUESTION DELIVERED</span>
          <h2 id="success-title" role="status">
            질문함에 마음을 담았어요!
          </h2>
          <p>우리 테이블의 다음 이야기가 될지도 몰라요.</p>
          <blockquote>{savedContent}</blockquote>
          <p className="small muted">이 브라우저의 목업 질문함에 저장했어요.</p>
          <button
            className="button button-primary w-full mt-6"
            onClick={writeAgain}
          >
            <Icon name="pen" size={18} />
            질문 하나 더 남기기
          </button>
          <Link to="/table" className="button button-ghost w-full">
            테이블로 돌아가기
            <Icon name="arrow" size={17} />
          </Link>
        </section>
      ) : (
        <form className="question-form" onSubmit={submit}>
          <fieldset disabled={pending}>
            <legend>누구에게 묻고 싶나요?</legend>
            <div className="target-grid">
              {targets.map((item) => (
                <label
                  key={item.value}
                  className={`target-option ${target === item.value ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="target"
                    value={item.value}
                    checked={target === item.value}
                    onChange={() => setTarget(item.value)}
                  />
                  <span className="target-symbol">{item.symbol}</span>
                  <strong>{TARGET_LABELS[item.value]}</strong>
                  <small>{item.subtitle}</small>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="question-label">
            <label htmlFor="question-content">질문을 남겨 주세요</label>
            <span>
              <Icon name="lock" size={13} />
              익명으로 전달돼요
            </span>
          </div>
          <div className={`textarea-wrap ${count > 200 ? 'invalid' : ''}`}>
            <textarea
              ref={textarea}
              id="question-content"
              name="question"
              placeholder={
                '예를 들면,\nNET에서 가장 기억에 남는 순간은 언제인가요?'
              }
              value={content}
              onChange={(event) => {
                setContent(event.target.value)
                setError('')
              }}
              required
              disabled={pending}
              aria-describedby="question-hint question-count"
              aria-invalid={count > 200}
            />
            <span
              className={count > 200 ? 'text-error' : ''}
              id="question-count"
            >
              {count}
              <span> / 200</span>
            </span>
          </div>
          <p className="field-hint" id="question-hint">
            1–200자로 작성해 주세요. 서로를 배려하는 질문을 부탁드려요.
          </p>
          {error && <ErrorNotice message={error} />}
          <button
            type="submit"
            className="button button-primary w-full"
            disabled={!valid || pending}
          >
            {pending ? (
              <>
                <span className="spinner" />
                질문을 담는 중...
              </>
            ) : (
              <>
                <Icon name="pen" size={18} />
                질문함에 담기
                <Icon name="arrow" size={19} />
              </>
            )}
          </button>
          <p className="form-privacy">작성자 정보는 질문에 표시되지 않아요.</p>
        </form>
      )}
    </div>
  )
}
