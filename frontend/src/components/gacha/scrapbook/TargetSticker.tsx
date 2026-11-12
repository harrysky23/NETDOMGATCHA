import type { QuestionTarget, StickerPosition } from '../../../types'
import { TARGET_LABELS } from '../../../types'
import { recipientStickers } from './RecipientStickerSelector'

export function TargetStickerImage({ target }: { target: QuestionTarget }) {
  const badge = recipientStickers[target]
  return (
    <img
      src={badge.src}
      width={badge.width}
      height={badge.height}
      alt=""
      draggable={false}
    />
  )
}
export function TargetSticker({
  target,
  position,
  id,
}: {
  target: QuestionTarget
  position: StickerPosition
  id?: string
}) {
  return (
    <span
      id={id}
      role="img"
      aria-label={TARGET_LABELS[target]}
      className="letter-sticker letter-target-sticker letter-sticker-static"
      style={{
        left: `${position.x * 100}%`,
        top: `${position.y * 100}%`,
        transform: `translate(-50%, -50%) rotate(${position.rotation}deg)`,
      }}
    >
      <TargetStickerImage target={target} />
    </span>
  )
}
