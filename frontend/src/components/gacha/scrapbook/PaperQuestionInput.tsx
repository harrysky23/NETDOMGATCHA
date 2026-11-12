import type { ReactNode, RefObject } from 'react'
import { LetterPaper } from './LetterPaper'

export function PaperQuestionInput({
  value,
  onChange,
  onCompositionChange,
  textareaRef,
  paperRef,
  children,
}: {
  children?: ReactNode
  paperRef?: RefObject<HTMLDivElement | null>
  value: string
  onChange: (value: string) => void
  onCompositionChange: (composing: boolean) => void
  textareaRef: RefObject<HTMLTextAreaElement | null>
}) {
  const count = Array.from(value).length
  return (
    <div className="scrapbook-question-field">
      <label htmlFor="sheet-question" className="sr-only">
        질문
      </label>
      <LetterPaper className="scrapbook-paper" paperRef={paperRef}>
        <textarea
          ref={textareaRef}
          id="sheet-question"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onCompositionStart={() => onCompositionChange(true)}
          onCompositionEnd={(event) => {
            onChange(event.currentTarget.value)
            onCompositionChange(false)
          }}
          onFocus={(event) =>
            event.currentTarget.scrollIntoView({
              block: 'nearest',
              inline: 'nearest',
            })
          }
          placeholder="평소 궁금했던 이야기를 적어 주세요…"
          required
          aria-invalid={count > 200}
          aria-describedby="sheet-question-count sheet-question-limit"
        />
        <span
          id="sheet-question-count"
          className="scrapbook-count"
          data-invalid={count > 200}
        >
          {count} / 200
        </span>
        {children}
      </LetterPaper>
      <p id="sheet-question-limit" className="scrapbook-input-hint">
        {count > 200
          ? '200자 이하로 줄여 주세요.'
          : '질문에는 작성자의 이름이 표시되지 않아요.'}
      </p>
    </div>
  )
}
