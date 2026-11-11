import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api, apiMode } from '../services/api'
import { useSession } from '../hooks/useSession'
import { TARGET_LABELS, type QuestionTarget } from '../types'
import { Icon } from '../components/Icon'
import { ErrorNotice } from '../components/Feedback'

export function QuestionSubmitPage() {
  const { nickname, selectedTableId, ensureParticipant } = useSession()
  const [name, setName] = useState(nickname)
  const [content, setContent] = useState('')
  const [target, setTarget] = useState<QuestionTarget>('all')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const busy = useRef(false)
  const textarea = useRef<HTMLTextAreaElement>(null)
  const count = Array.from(content).length
  const nameCount = Array.from(name.trim()).length
  const valid =
    !!selectedTableId &&
    nameCount > 0 &&
    nameCount <= 12 &&
    !!content.trim() &&
    count <= 200

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!valid || busy.current) return
    busy.current = true
    setPending(true)
    setError('')
    try {
      const participant = await ensureParticipant(selectedTableId, name)
      await api.submitQuestion(participant, selectedTableId, {
        content,
        target,
      })
      setContent('')
      setSuccess(true)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : '질문을 넣지 못했어요. 다시 시도해 주세요.',
      )
    } finally {
      busy.current = false
      setPending(false)
    }
  }

  return (
    <div className="simple-form-page">
      <Link to="/" className="back-link">
        <Icon name="back" size={17} />
        머신으로
      </Link>
      {success ? (
        <section className="simple-submit-success">
          <div className="success-icon">
            <Icon name="check" size={32} />
          </div>
          <h1 role="status">질문을 넣었어요!</h1>
          <p>우리 테이블의 다음 이야기가 될 거예요.</p>
          <button
            className="button button-primary w-full"
            onClick={() => {
              setSuccess(false)
              setTarget('all')
              requestAnimationFrame(() => textarea.current?.focus())
            }}
          >
            하나 더 넣기
            <Icon name="pen" size={18} />
          </button>
          <Link to="/" className="button button-ghost w-full">
            머신으로 돌아가기
          </Link>
        </section>
      ) : (
        <>
          <h1>질문 넣기</h1>
          <p className="simple-form-intro">
            이름만 알려주고, 궁금한 이야기를 남겨 주세요.
          </p>
          <form className="simple-question-form" onSubmit={submit}>
            <fieldset disabled={pending} className="simple-form-fields">
              <div>
                <label htmlFor="submit-nickname" className="simple-field-label">
                  닉네임
                </label>
                <input
                  id="submit-nickname"
                  className="simple-input"
                  autoComplete="nickname"
                  value={name}
                  required
                  onChange={(event) => setName(event.target.value)}
                  placeholder="어떤 이름으로 남길까요?"
                  aria-describedby="submit-name-hint"
                  aria-invalid={nameCount > 12}
                />
                <p className="field-hint" id="submit-name-hint">
                  1–12자 · 질문에는 이름이 표시되지 않아요.
                </p>
              </div>
              <fieldset>
                <legend className="simple-field-label">누구에게?</legend>
                <div className="simple-targets">
                  {(['senior', 'junior', 'all'] as QuestionTarget[]).map(
                    (value) => (
                      <label
                        className={target === value ? 'selected' : ''}
                        key={value}
                      >
                        <input
                          type="radio"
                          name="target"
                          value={value}
                          checked={target === value}
                          onChange={() => setTarget(value)}
                        />
                        {TARGET_LABELS[value]}
                      </label>
                    ),
                  )}
                </div>
              </fieldset>
              <div>
                <label
                  htmlFor="question-content"
                  className="simple-field-label"
                >
                  질문
                </label>
                <div
                  className={`textarea-wrap ${count > 200 ? 'invalid' : ''}`}
                >
                  <textarea
                    ref={textarea}
                    id="question-content"
                    placeholder="평소 궁금했던 이야기를 적어 주세요."
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    required
                    aria-describedby="simple-question-hint"
                    aria-invalid={count > 200}
                  />
                  <span className={count > 200 ? 'text-error' : ''}>
                    {count} / 200
                  </span>
                </div>
                <p className="field-hint" id="simple-question-hint">
                  1–200자로 작성해 주세요.
                </p>
              </div>
            </fieldset>
            {!selectedTableId && (
              <p className="simple-recovery">
                상단에서 테이블을 먼저 선택해 주세요.
              </p>
            )}
            {error && <ErrorNotice message={error} />}
            <button
              className="button button-primary w-full"
              type="submit"
              disabled={!valid || pending}
            >
              {pending ? (
                <>
                  <span className="spinner" />
                  넣는 중…
                </>
              ) : (
                <>
                  질문 넣기
                  <Icon name="arrow" size={18} />
                </>
              )}
            </button>
            {apiMode === 'mock' && (
              <p className="simple-bottom-note">
                이 브라우저의 목업 질문함에 저장돼요.
              </p>
            )}
          </form>
        </>
      )}
    </div>
  )
}
