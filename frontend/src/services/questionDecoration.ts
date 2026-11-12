import {
  STICKER_IDS,
  type QuestionDecoration,
  type StickerId,
  type StickerPosition,
} from '../types/index.ts'

export const DEFAULT_TARGET_BADGE: StickerPosition = {
  x: 0.77,
  y: 0.22,
  rotation: 8,
}
export function isStickerPosition(s: unknown): s is StickerPosition {
  if (!s || typeof s !== 'object') return false
  const p = s as Partial<StickerPosition>
  return (
    typeof p.x === 'number' &&
    Number.isFinite(p.x) &&
    p.x >= 0.12 &&
    p.x <= 0.88 &&
    typeof p.y === 'number' &&
    Number.isFinite(p.y) &&
    p.y >= 0.15 &&
    p.y <= 0.85 &&
    typeof p.rotation === 'number' &&
    Number.isFinite(p.rotation) &&
    Math.abs(p.rotation) <= 20
  )
}
export function isDecoration(value: unknown): value is QuestionDecoration {
  if (!value || typeof value !== 'object') return false
  const d = value as Partial<QuestionDecoration>
  return (
    d.version === 1 &&
    d.paper === 'lined' &&
    (d.target_badge == null || isStickerPosition(d.target_badge)) &&
    Array.isArray(d.stickers) &&
    d.stickers.length <= 3 &&
    new Set(d.stickers.map((s) => s?.id)).size === d.stickers.length &&
    d.stickers.every(
      (s) => s && STICKER_IDS.includes(s.id) && isStickerPosition(s),
    )
  )
}

/** Fisher–Yates: 화면 재렌더/입력 중에는 다시 호출하지 않습니다. */
export function pickStickerChoices(): StickerId[] {
  const items = [...STICKER_IDS]
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return items.slice(0, Math.random() < 0.5 ? 2 : 3)
}

export function paperPosition(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
) {
  if (
    rect.width <= 0 ||
    rect.height <= 0 ||
    clientX < rect.left ||
    clientX > rect.left + rect.width ||
    clientY < rect.top ||
    clientY > rect.top + rect.height
  )
    return null
  return {
    x: Math.min(0.88, Math.max(0.12, (clientX - rect.left) / rect.width)),
    y: Math.min(0.85, Math.max(0.15, (clientY - rect.top) / rect.height)),
  }
}
