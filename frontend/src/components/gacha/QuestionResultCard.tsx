import { useEffect, useId, useRef } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { TARGET_LABELS, type DrawResult } from '../../types'
import { Icon } from '../Icon'

// 티켓이 표시되는 동안에만 기존 결과 레이어의 어두운 배경·블러를 해제합니다.
// 영상의 재생 상태, 이벤트, 전환 타이밍은 변경하지 않습니다.
const ticketStyles = `
  .gacha-cinema .question-reveal-layer:has(> .question-ticket) {
    padding: 18px 0;
    overflow: hidden;
    background: rgb(18 8 30 / 16%);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
  .gacha-cinema.is-revealed:has(.question-ticket) .gacha-film { opacity: 1; }
  .question-ticket {
    position: relative;
    display: flex;
    flex-direction: column;
    flex: 0 1 auto;
    width: 86vw;
    max-width: 390px;
    height: auto;
    min-height: 0;
    max-height: calc(100vh - 140px);
    max-height: min(68dvh, calc(100svh - var(--machine-header-height, 68px) - 48px));
    margin: auto;
    padding: 24px;
    border: 1px solid #fffaf1;
    border-radius: 7px;
    background-color: #f8f1e7;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.76' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' opacity='.045' filter='url(%23grain)'/%3E%3C/svg%3E");
    color: #34233f;
    box-shadow: 0 12px 38px #16052550, 0 2px 5px #16052526;
    transform-origin: center;
    text-align: left;
    color-scheme: light;
  }
  .ticket-topline {
    display: flex;
    align-items: baseline;
    flex: 0 0 auto;
    gap: 13px;
    min-height: 24px;
    padding-right: 26px;
  }
  .ticket-brand { font-family: Arial, sans-serif; font-size: 22px; line-height: 1; font-weight: 900; letter-spacing: -1.1px; color: #5d4473; }
  .ticket-number { color: #918493; font-family: ui-monospace, monospace; font-size: 10px; letter-spacing: .8px; }
  .question-ticket .ticket-close {
    position: absolute;
    top: 5px;
    right: 5px;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: #746779;
    cursor: pointer;
  }
  .question-ticket .ticket-close:hover { background: #76538a0c; color: #34233f; }
  .question-ticket .ticket-close:focus-visible { outline: 2px solid #76538a; outline-offset: -5px; }
  .ticket-target {
    display: block;
    flex: 0 0 auto;
    align-self: flex-start;
    margin-top: 20px;
    padding: 5px 8px;
    border-radius: 4px;
    background: #e9deee;
    color: #71567f;
    font-size: 10px;
    line-height: 1.3;
    font-weight: 600;
  }
  .question-ticket .ticket-question {
    flex: 0 1 auto;
    min-height: 0;
    margin: 12px 0 0;
    padding: 0 3px 2px 0;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior-y: contain;
    -webkit-overflow-scrolling: touch;
    font-size: clamp(21px, 5.7vw, 26px);
    line-height: 1.55;
    font-weight: 650;
    letter-spacing: -.65px;
    color: #34233f;
    white-space: pre-wrap;
    word-break: keep-all;
    overflow-wrap: anywhere;
    scrollbar-width: thin;
    scrollbar-color: #b9a2c3 transparent;
    outline: none;
  }
  .question-ticket .ticket-question:focus-visible { outline: 1px dashed #a88bb5; outline-offset: 4px; }
  .ticket-question::-webkit-scrollbar { width: 3px; }
  .ticket-question::-webkit-scrollbar-thumb { background: #b9a2c3; border-radius: 4px; }
  .ticket-warning { flex: 0 0 auto; margin-top: 12px; color: #8d414b; font-size: 11px; line-height: 1.6; }
  @media (max-width: 360px) { .question-ticket { padding: 21px; } }
  @media (prefers-reduced-motion: reduce) { .question-ticket { scroll-behavior: auto; } }
`

export function QuestionResultCard({
  result,
  onReset,
  warning,
  recovered,
  isMock,
}: {
  result: DrawResult
  onReset: () => void
  warning: string
  recovered: boolean
  isMock: boolean
}) {
  const reduceMotion = useReducedMotion()
  const title = useRef<HTMLHeadingElement>(null)
  const titleId = useId()
  const targetId = useId()
  const ticketNumber = result.id
    .replace(/[^a-z0-9]/gi, '')
    .slice(-4)
    .toUpperCase()
    .padStart(4, '0')

  useEffect(() => {
    title.current?.focus({ preventScroll: true })
  }, [result.id])

  return (
    <>
      <style>{ticketStyles}</style>
      <motion.section
        className="question-ticket"
        initial={
          reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.7, rotate: -5 }
        }
        animate={
          reduceMotion
            ? { opacity: 1 }
            : { opacity: [0, 1, 1], scale: [0.7, 1.05, 1], rotate: [-5, 2, 0] }
        }
        transition={
          reduceMotion
            ? { duration: 0.12 }
            : { duration: 0.6, times: [0, 0.65, 1], ease: 'easeOut' }
        }
        aria-labelledby={titleId}
        aria-describedby={targetId}
      >
        <header className="ticket-topline" aria-hidden="true">
          <span className="ticket-brand">NET.</span>
          <span className="ticket-number">#{ticketNumber}</span>
        </header>
        <button
          type="button"
          className="ticket-close"
          onClick={onReset}
          aria-label="질문 티켓 닫기"
        >
          <Icon name="close" size={16} />
        </button>
        <span className="ticket-target" id={targetId}>
          {TARGET_LABELS[result.question.target]}
        </span>
        <h2 className="ticket-question" ref={title} tabIndex={0} id={titleId}>
          {result.question.content}
        </h2>
        {recovered && (
          <span className="sr-only" role="status">
            이전에 추첨한 질문을 다시 열었어요.
          </span>
        )}
        {isMock && (
          <span className="sr-only">목업 질문함의 추첨 결과입니다.</span>
        )}
        {warning && (
          <p className="ticket-warning" role="alert">
            {warning}
          </p>
        )}
      </motion.section>
    </>
  )
}
