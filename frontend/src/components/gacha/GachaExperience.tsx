import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, useReducedMotion } from 'motion/react'
import type { DrawResult } from '../../types'
import type { GachaPhase } from '../../hooks/useGachaDraw'
import { GachaVideo } from './GachaVideo'
import { QuestionResultCard } from './QuestionResultCard'

interface Props {
  phase: GachaPhase
  result: DrawResult | null
  videoSrc: string
  poster: string
  warning: string
  recovered: boolean
  isMock: boolean
  onReveal: () => void
  onReset: () => void
}

/** body 포털 + 모달로 상위 Motion transform/내비게이션과 독립된 화면을 만듭니다. */
export function GachaExperience({ phase, result, videoSrc, poster, warning, recovered, isMock, onReveal, onReset }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [glow, setGlow] = useState(false)
  const reduceMotion = useReducedMotion()
  const open = phase === 'PLAYING' || phase === 'REVEAL'

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    if (open && !element.open) element.showModal()
    if (!open) { element.close(); setGlow(false) }
  }, [open])

  useEffect(() => {
    if (!open) return
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = overflow }
  }, [open])

  useEffect(() => () => { dialog.current?.close() }, [])

  return createPortal(<dialog ref={dialog} className="gacha-dialog" aria-label={phase === 'REVEAL' ? '추첨한 질문' : '가챠 영상 재생 중'}
    onCancel={event => { event.preventDefault(); if (phase === 'REVEAL') onReset() }}>
    <div className={`gacha-cinema ${phase === 'REVEAL' ? 'is-revealed' : ''}`}>
      <GachaVideo src={videoSrc} poster={poster} status={phase === 'PLAYING' ? 'playing' : phase === 'REVEAL' ? 'revealed' : 'idle'} onEnded={onReveal} onGlow={() => setGlow(true)} onFallback={onReveal} />
      {(glow || phase === 'REVEAL') && !reduceMotion && <motion.div className="gacha-light-bridge" aria-hidden="true"
        initial={{ opacity: 0 }} animate={{ opacity: phase === 'REVEAL' ? [0.75, 0] : .75 }}
        transition={{ duration: phase === 'REVEAL' ? .8 : .4 }} />}
      {phase === 'REVEAL' && result && <div className="question-reveal-layer"><QuestionResultCard result={result} onReset={onReset} warning={warning} recovered={recovered} isMock={isMock} /></div>}
    </div>
  </dialog>, document.body)
}
