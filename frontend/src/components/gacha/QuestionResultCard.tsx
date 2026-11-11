import { useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Link } from 'react-router-dom'
import { TARGET_LABELS, type DrawResult } from '../../types'
import { Icon } from '../Icon'

export function QuestionResultCard({ result, onReset, warning, recovered, isMock }: {
  result: DrawResult; onReset: () => void; warning: string; recovered: boolean; isMock: boolean
}) {
  const reduceMotion = useReducedMotion()
  const title = useRef<HTMLHeadingElement>(null)
  useEffect(() => { title.current?.focus({ preventScroll: true }) }, [])

  return <motion.section className="question-result-card"
    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: .94 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: reduceMotion ? .1 : .6, delay: reduceMotion ? 0 : .15, ease: [0.16, 1, 0.3, 1] }}
    aria-labelledby="draw-result-title">
    <span className="result-sparkle" aria-hidden="true">✳</span>
    <span className="eyebrow">YOUR NEXT CONNECTION</span>
    <span className="target-badge">{TARGET_LABELS[result.question.target]}</span>
    <h2 ref={title} tabIndex={-1} id="draw-result-title">{result.question.content}</h2>
    <div className="result-divider" />
    <p>서로의 이야기를 천천히 들려주세요.</p>
    {recovered && <p className="result-recovered" role="status">이전에 추첨한 질문을 다시 열었어요.</p>}
    {isMock && <small>목업 질문함에서 꺼낸 질문이에요.</small>}
    {warning && <p className="result-warning" role="alert">{warning}</p>}
    <div className="result-actions"><button className="button button-primary w-full" onClick={onReset}><Icon name="refresh" size={18} />다시 뽑기</button><Link to="/table" className="button button-ghost w-full">테이블로 돌아가기<Icon name="arrow" size={17} /></Link></div>
  </motion.section>
}
