import type { ButtonHTMLAttributes } from 'react'
import { TARGET_LABELS, type QuestionTarget } from '../../../types'
import senior from '../../../assets/question-target-senior.png'
import junior from '../../../assets/question-target-junior.png'
import all from '../../../assets/question-target-all.png'

export const recipientStickers = {
  senior: { src: senior, width: 2164, height: 727 },
  junior: { src: junior, width: 2103, height: 748 },
  all: { src: all, width: 2164, height: 727 },
} satisfies Record<
  QuestionTarget,
  { src: string; width: number; height: number }
>

export function RecipientStickerSelector({
  value,
  onChange,
  interactions,
}: {
  interactions?: (
    target: QuestionTarget,
  ) => ButtonHTMLAttributes<HTMLButtonElement>
  value: QuestionTarget
  onChange: (value: QuestionTarget) => void
}) {
  return (
    <fieldset className="scrapbook-recipients">
      <legend>누구에게 남길까요?</legend>
      <div className="recipient-stickers">
        {(['senior', 'junior', 'all'] as const).map((target) => (
          <button
            type="button"
            key={target}
            className="recipient-sticker"
            aria-label={TARGET_LABELS[target]}
            aria-pressed={value === target}
            onClick={() => onChange(target)}
            {...interactions?.(target)}
          >
            <img
              src={recipientStickers[target].src}
              width={recipientStickers[target].width}
              height={recipientStickers[target].height}
              alt=""
              draggable={false}
            />
          </button>
        ))}
      </div>
    </fieldset>
  )
}
