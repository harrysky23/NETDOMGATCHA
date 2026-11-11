import { useEffect, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { motion, useReducedMotion } from 'motion/react'
import { useSession } from '../../hooks/useSession'
import { api } from '../../services/api'
import { TARGET_LABELS, type QuestionTarget } from '../../types'
import { ErrorNotice } from '../Feedback'
import { Icon } from '../Icon'

export function QuestionSheet({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const { nickname, selectedTableId, ensureParticipant } = useSession()
  const dialog = useRef<HTMLDialogElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const textarea = useRef<HTMLTextAreaElement>(null)
  const [name, setName] = useState(nickname)
  const [content, setContent] = useState('')
  const [target, setTarget] = useState<QuestionTarget>('all')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const locked = useRef(false)
  const reduceMotion = useReducedMotion()
  const count = Array.from(content).length
  const nameCount = Array.from(name.trim()).length
  const valid =
    !!selectedTableId &&
    nameCount > 0 &&
    nameCount <= 12 &&
    !!content.trim() &&
    count <= 200

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    if (!open) {
      element.close()
      return
    }
    setError('')
    if (!element.open) element.showModal()
    // 첫 진입은 제목으로 포커스를 이동해 모바일 키보드가 머신 전체를 가리지 않게 합니다.
    element
      .querySelector<HTMLElement>('[data-sheet-title]')
      ?.focus({ preventScroll: true })
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const viewport = window.visualViewport
    const resize = () => {
      element.style.setProperty(
        '--sheet-height',
        `${viewport?.height ?? window.innerHeight}px`,
      )
      element.style.setProperty('--sheet-top', `${viewport?.offsetTop ?? 0}px`)
    }
    resize()
    viewport?.addEventListener('resize', resize)
    viewport?.addEventListener('scroll', resize)
    return () => {
      element.close()
      document.body.style.overflow = overflow
      viewport?.removeEventListener('resize', resize)
      viewport?.removeEventListener('scroll', resize)
    }
  }, [open])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!valid || locked.current) return
    locked.current = true
    setPending(true)
    setError('')
    const tableId = selectedTableId
    try {
      const participant = await ensureParticipant(tableId, name)
      await api.submitQuestion(participant, tableId, { content, target })
      setContent('')
      setTarget('all')
      onSuccess()
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : '질문을 넣지 못했어요. 다시 시도해 주세요.',
      )
    } finally {
      locked.current = false
      setPending(false)
    }
  }

  return createPortal(
    <dialog
      ref={dialog}
      className="question-sheet-dialog"
      aria-labelledby="question-sheet-title"
      onCancel={(event) => {
        event.preventDefault()
        if (!locked.current) onClose()
      }}
      onClick={(event) => {
        if (event.target === dialog.current && !locked.current) onClose()
      }}
    >
      {open && (
        <motion.section
          className="question-sheet"
          initial={reduceMotion ? false : { y: 32, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
        >
          <span className="sheet-grip" aria-hidden="true" />
          <div className="question-sheet-heading">
            <h2 id="question-sheet-title" data-sheet-title tabIndex={-1}>
              캡슐에 질문 넣기
            </h2>
            <button
              type="button"
              className="icon-button"
              disabled={pending}
              onClick={onClose}
              aria-label="질문 등록 닫기"
            >
              <Icon name="close" />
            </button>
          </div>
          <form
            onSubmit={(event) => {
              void submit(event)
            }}
            className="machine-question-form"
          >
            <fieldset disabled={pending}>
              <label className="sheet-label" htmlFor="sheet-nickname">
                닉네임 <span>질문에는 공개되지 않아요</span>
              </label>
              <input
                ref={input}
                id="sheet-nickname"
                className="simple-input"
                autoComplete="nickname"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="닉네임 (1–12자)"
                required
                aria-invalid={nameCount > 12}
              />
              <fieldset className="sheet-target-group">
                <legend className="sheet-label">누구에게?</legend>
                <div className="simple-targets">
                  {(['senior', 'junior', 'all'] as QuestionTarget[]).map(
                    (value) => (
                      <label
                        key={value}
                        className={target === value ? 'selected' : ''}
                      >
                        <input
                          type="radio"
                          name="sheet-target"
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
              <label className="sheet-label" htmlFor="sheet-question">
                질문
              </label>
              <div className={`textarea-wrap ${count > 200 ? 'invalid' : ''}`}>
                <textarea
                  ref={textarea}
                  id="sheet-question"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="평소 궁금했던 이야기를 남겨 주세요."
                  required
                  aria-invalid={count > 200}
                  aria-describedby="sheet-question-count"
                />
                <span
                  id="sheet-question-count"
                  className={count > 200 ? 'text-error' : ''}
                >
                  {count} / 200
                </span>
              </div>
            </fieldset>
            {error && <ErrorNotice message={error} />}
            <button
              type="submit"
              className="button button-primary w-full sheet-submit"
              disabled={!valid || pending}
            >
              {pending ? (
                <>
                  <span className="spinner" />
                  질문 넣는 중…
                </>
              ) : (
                <>
                  질문 넣기
                  <Icon name="arrow" size={18} />
                </>
              )}
            </button>
          </form>
        </motion.section>
      )}
    </dialog>,
    document.body,
  )
}
