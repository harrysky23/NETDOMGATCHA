import { useEffect, useId, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import type { DrawResult, QuestionTarget } from '../../types'
import { Icon } from '../Icon'
import clipboardImage from '../../assets/question-clipboard.png'
import './question-clipboard.css'

const RESULT_TARGET_LABELS = {
  senior: 'OB',
  junior: 'YB',
  all: '전체',
} satisfies Record<QuestionTarget, string>

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
  const [imageState, setImageState] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  )
  const length = Array.from(result.question.content).length
  const density = length <= 16 ? 'short' : length <= 80 ? 'medium' : 'long'

  useEffect(() => {
    title.current?.focus({ preventScroll: true })
  }, [result.id])

  return (
    <motion.section
      className="question-clipboard"
      initial={
        reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.82, rotate: -3 }
      }
      animate={
        reduceMotion
          ? { opacity: 1 }
          : {
              opacity: [0, 1, 1],
              scale: [0.82, 1.035, 1],
              rotate: [-3, 1, 0],
            }
      }
      transition={
        reduceMotion
          ? { duration: 0.12 }
          : {
              duration: 0.55,
              times: [0, 0.65, 1],
              ease: 'easeOut',
            }
      }
      aria-labelledby={titleId}
      aria-describedby={targetId}
    >
      <div className="clipboard-art" data-image={imageState}>
        <img
          className="clipboard-image"
          src={clipboardImage}
          width={1362}
          height={1155}
          alt=""
          aria-hidden="true"
          draggable={false}
          onLoad={() => setImageState('ready')}
          onError={() => setImageState('error')}
        />
        <button
          type="button"
          className="clipboard-close"
          onClick={onReset}
          aria-label="질문 결과 닫기"
        >
          <Icon name="close" size={17} />
        </button>
        <div className="clipboard-copy" data-density={density}>
          <span className="clipboard-target" id={targetId}>
            {RESULT_TARGET_LABELS[result.question.target]}
          </span>
          <h2
            className="clipboard-question"
            ref={title}
            tabIndex={0}
            id={titleId}
          >
            {result.question.content}
          </h2>
          {warning && (
            <p className="clipboard-warning" role="alert">
              {warning}
            </p>
          )}
        </div>
      </div>
      {imageState === 'error' && (
        <span className="sr-only" role="status">
          메모 이미지를 불러오지 못했어요. 추첨한 질문은 확인할 수 있어요.
        </span>
      )}
      {recovered && (
        <span className="sr-only" role="status">
          이전에 추첨한 질문을 다시 열었어요.
        </span>
      )}
      {isMock && (
        <span className="sr-only">목업 질문함의 추첨 결과입니다.</span>
      )}
    </motion.section>
  )
}
