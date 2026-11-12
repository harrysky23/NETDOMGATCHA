import { useEffect, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { motion, useAnimate, useReducedMotion } from 'motion/react'
import { useSession } from '../../hooks/useSession'
import type { PlacedSticker, QuestionTarget } from '../../types'
import { ErrorNotice } from '../Feedback'
import { HomeLink } from '../HomeLink'
import { ScrapbookHeader } from './scrapbook/ScrapbookHeader'
import { StickerComposer } from './scrapbook/StickerComposer'
import {
  DEFAULT_TARGET_BADGE,
  pickStickerChoices,
} from '../../services/questionDecoration'
import { SubmitQuestionButton } from './scrapbook/SubmitQuestionButton'
import './scrapbook/scrapbook.css'

export function QuestionSheet({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const { profile, selectedTableId, submitQuestion } = useSession()
  const dialog = useRef<HTMLDialogElement>(null)
  const textarea = useRef<HTMLTextAreaElement>(null)
  const [content, setContent] = useState('')
  const [targetBadge, setTargetBadge] = useState({ ...DEFAULT_TARGET_BADGE })
  const [stickers, setStickers] = useState<PlacedSticker[]>([])
  const [choices, setChoices] = useState(pickStickerChoices)
  const [target, setTarget] = useState<QuestionTarget>('all')
  const [pending, setPending] = useState(false)
  const [saved, setSaved] = useState(false)
  const [composing, setComposing] = useState(false)
  const [error, setError] = useState('')
  const locked = useRef(false)
  const mounted = useRef(true)
  const [scope, animate] = useAnimate<HTMLElement>()
  const reduceMotion = useReducedMotion()
  const count = Array.from(content).length
  const valid =
    !!selectedTableId && !!profile && !!content.trim() && count <= 200

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

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
    const onResize = () => {
      resize()
      if (document.activeElement === textarea.current)
        textarea.current?.scrollIntoView({
          block: 'nearest',
          inline: 'nearest',
        })
    }
    resize()
    viewport?.addEventListener('resize', onResize)
    viewport?.addEventListener('scroll', resize)
    return () => {
      element.close()
      document.body.style.overflow = overflow
      viewport?.removeEventListener('resize', onResize)
      viewport?.removeEventListener('scroll', resize)
    }
  }, [open])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!valid || composing || locked.current) return
    locked.current = true
    setPending(true)
    setError('')
    const tableId = selectedTableId
    try {
      await submitQuestion(tableId, {
        content,
        target,
        decoration: {
          version: 1,
          paper: 'lined',
          target_badge: targetBadge,
          stickers,
        },
      })
      if (!mounted.current || !dialog.current?.open) return
      setSaved(true)
      // 성공한 요청은 되돌리지 않습니다. 연출 실패 시에도 재요청 없이 닫습니다.
      if (!reduceMotion) {
        try {
          await animate(
            '.scrapbook-submit',
            { scale: [1, 1.04, 1] },
            { duration: 0.16 },
          )
          if (!mounted.current || !dialog.current?.open) return
          await animate(
            '.scrapbook-paper',
            { scale: 0.9, opacity: 0, y: -8 },
            { duration: 0.22, ease: 'easeIn' },
          )
        } catch {
          /* 영상/API와 무관한 로컬 연출만 생략합니다. */
        }
      }
      if (!mounted.current || !dialog.current?.open) return
      setContent('')
      setTarget('all')
      setStickers([])
      setTargetBadge({ ...DEFAULT_TARGET_BADGE })
      setChoices(pickStickerChoices())
      onSuccess()
    } catch (cause) {
      if (mounted.current)
        setError(
          cause instanceof Error
            ? cause.message
            : '질문을 넣지 못했어요. 다시 시도해 주세요.',
        )
    } finally {
      locked.current = false
      if (mounted.current) {
        setPending(false)
        setSaved(false)
      }
    }
  }

  return createPortal(
    <dialog
      ref={dialog}
      className="question-sheet-dialog scrapbook-dialog"
      aria-labelledby="question-sheet-title"
      onCancel={(event) => {
        event.preventDefault()
        if (!locked.current) onClose()
      }}
      onClick={(event) => {
        if (event.target === dialog.current && !locked.current) onClose()
      }}
    >
      <HomeLink overlay />
      {open && (
        <motion.section
          ref={scope}
          className="scrapbook-sheet"
          aria-busy={pending}
          initial={reduceMotion ? false : { y: 32, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
        >
          <ScrapbookHeader disabled={pending} onClose={onClose} />
          <form
            onSubmit={(event) => {
              void submit(event)
            }}
            className="scrapbook-form"
          >
            <div className="scrapbook-body">
              <fieldset disabled={pending} className="scrapbook-fields">
                <StickerComposer
                  target={target}
                  onTargetChange={setTarget}
                  targetBadge={targetBadge}
                  onTargetBadgeChange={setTargetBadge}
                  choices={choices}
                  stickers={stickers}
                  onChange={setStickers}
                  disabled={pending}
                  value={content}
                  onTextChange={setContent}
                  onCompositionChange={setComposing}
                  textareaRef={textarea}
                />
              </fieldset>
              {error && <ErrorNotice message={error} />}
            </div>
            <footer className="scrapbook-footer">
              <SubmitQuestionButton
                disabled={!valid || pending || composing}
                pending={pending}
                saved={saved}
              />
            </footer>
          </form>
        </motion.section>
      )}
    </dialog>,
    document.body,
  )
}
