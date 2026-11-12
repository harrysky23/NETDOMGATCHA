import {
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
  type PointerEvent,
  type KeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'
import {
  TARGET_LABELS,
  type PlacedSticker,
  type StickerId,
  type QuestionTarget,
  type StickerPosition,
} from '../../../types'
import { paperPosition } from '../../../services/questionDecoration'
import { stickerCatalog } from './stickerCatalog'
import { PaperQuestionInput } from './PaperQuestionInput'
import { RecipientStickerSelector } from './RecipientStickerSelector'
import { TargetStickerImage } from './TargetSticker'

export function stickerStyle(s: StickerPosition): CSSProperties {
  return {
    left: `${s.x * 100}%`,
    top: `${s.y * 100}%`,
    transform: `translate(-50%, -50%) rotate(${s.rotation}deg)`,
  }
}
export function StickerImages({ stickers }: { stickers: PlacedSticker[] }) {
  return (
    <>
      {stickers.map((s) => (
        <span
          key={s.id}
          className="letter-sticker letter-sticker-static"
          style={stickerStyle(s)}
          aria-hidden="true"
        >
          <img src={stickerCatalog[s.id].src} alt="" draggable={false} />
        </span>
      ))}
    </>
  )
}
type ItemId = StickerId | QuestionTarget
const isTarget = (id: ItemId): id is QuestionTarget =>
  id === 'senior' || id === 'junior' || id === 'all'
const label = (id: ItemId) =>
  isTarget(id) ? TARGET_LABELS[id] : stickerCatalog[id].label
interface Drag {
  id: ItemId
  x: number
  y: number
  originX: number
  originY: number
  moved: boolean
}
export function StickerComposer({
  choices,
  stickers,
  onChange,
  target,
  onTargetChange,
  targetBadge,
  onTargetBadgeChange,
  value,
  onTextChange,
  onCompositionChange,
  textareaRef,
  disabled,
}: {
  choices: StickerId[]
  stickers: PlacedSticker[]
  onChange: (value: PlacedSticker[]) => void
  target: QuestionTarget
  onTargetChange: (value: QuestionTarget) => void
  targetBadge: StickerPosition
  onTargetBadgeChange: (value: StickerPosition) => void
  value: string
  onTextChange: (value: string) => void
  onCompositionChange: (value: boolean) => void
  textareaRef: RefObject<HTMLTextAreaElement | null>
  disabled: boolean
}) {
  const paper = useRef<HTMLDivElement>(null)
  const gesture = useRef<Drag | null>(null)
  const suppressClick = useRef(false)
  const [drag, setDrag] = useState<Drag | null>(null)
  const [selected, setSelected] = useState<StickerId | 'target' | null>(null)
  const [notice, setNotice] = useState('')
  function place(id: ItemId, x: number, y: number) {
    if (isTarget(id)) {
      onTargetChange(id)
      onTargetBadgeChange({ ...targetBadge, x, y })
      setSelected('target')
    } else {
      const previous = stickers.find((s) => s.id === id)
      onChange([
        ...stickers.filter((s) => s.id !== id),
        {
          id,
          x,
          y,
          rotation:
            previous?.rotation ?? [-10, 8, -5][choices.indexOf(id)] ?? 0,
        },
      ])
      setSelected(id)
    }
    setNotice(`${label(id)} 스티커를 붙였어요.`)
  }
  function remove(id: StickerId) {
    onChange(stickers.filter((s) => s.id !== id))
    setSelected(null)
    setNotice('스티커를 떼었어요.')
  }
  function start(event: PointerEvent<HTMLButtonElement>, id: ItemId) {
    if (disabled || !event.isPrimary || event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    gesture.current = {
      id,
      x: event.clientX,
      y: event.clientY,
      originX: event.clientX,
      originY: event.clientY,
      moved: false,
    }
    suppressClick.current = false
    setSelected(isTarget(id) ? 'target' : id)
  }
  function move(event: PointerEvent<HTMLButtonElement>) {
    const g = gesture.current
    if (!g || disabled) return
    const moved =
      g.moved ||
      Math.hypot(event.clientX - g.originX, event.clientY - g.originY) > 6
    gesture.current = { ...g, x: event.clientX, y: event.clientY, moved }
    if (moved) {
      event.preventDefault()
      setDrag(gesture.current)
    }
  }
  function end(event: PointerEvent<HTMLButtonElement>) {
    const g = gesture.current
    gesture.current = null
    setDrag(null)
    if (!g?.moved || disabled || !paper.current) return
    suppressClick.current = true
    const position = paperPosition(
      event.clientX,
      event.clientY,
      paper.current.getBoundingClientRect(),
    )
    if (position) place(g.id, position.x, position.y)
    else setNotice('편지지 안으로 끌어다 놓아 주세요.')
  }
  function cancel() {
    gesture.current = null
    setDrag(null)
    suppressClick.current = true
  }
  function keyboard(
    event: KeyboardEvent<HTMLButtonElement>,
    id: ItemId,
    position: StickerPosition,
  ) {
    const delta: Record<string, [number, number]> = {
      ArrowLeft: [-0.02, 0],
      ArrowRight: [0.02, 0],
      ArrowUp: [0, -0.02],
      ArrowDown: [0, 0.02],
    }
    if (delta[event.key]) {
      event.preventDefault()
      const [dx, dy] = delta[event.key]
      place(
        id,
        Math.max(0.12, Math.min(0.88, position.x + dx)),
        Math.max(0.15, Math.min(0.85, position.y + dy)),
      )
    }
    if (
      !isTarget(id) &&
      (event.key === 'Delete' || event.key === 'Backspace')
    ) {
      event.preventDefault()
      remove(id)
    }
  }
  const handlers = (id: ItemId) => ({
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => start(e, id),
    onPointerMove: move,
    onPointerUp: end,
    onPointerCancel: cancel,
    onLostPointerCapture: () => {
      if (gesture.current) cancel()
    },
    onClick: () => {
      if (suppressClick.current) {
        suppressClick.current = false
        return
      }
      if (isTarget(id)) {
        onTargetChange(id)
        setSelected('target')
        return
      }
      const existing = stickers.find((s) => s.id === id)
      if (existing) setSelected(id)
      else place(id, [0.22, 0.77, 0.5][choices.indexOf(id)] ?? 0.5, 0.81)
    },
  })
  const portal = paper.current?.closest('dialog')
  return (
    <div className="sticker-composer">
      <RecipientStickerSelector
        value={target}
        onChange={onTargetChange}
        interactions={handlers}
      />
      <div className="sticker-tray" aria-label="꾸미기 스티커">
        <p className="sticker-tray-hint" id="sticker-help">
          스티커를 편지지로 끌어다 붙여요
        </p>
        <div className="scattered-stickers">
          {choices.map((id, i) => (
            <button
              key={id}
              type="button"
              className="loose-sticker"
              disabled={disabled}
              data-placed={stickers.some((s) => s.id === id)}
              style={
                { '--sticker-tilt': `${[-12, 9, -5][i]}deg` } as CSSProperties
              }
              aria-label={`${label(id)} 스티커 붙이기`}
              aria-describedby="sticker-help"
              {...handlers(id)}
            >
              <img src={stickerCatalog[id].src} alt="" draggable={false} />
            </button>
          ))}
        </div>
      </div>
      <PaperQuestionInput
        value={value}
        onChange={onTextChange}
        onCompositionChange={onCompositionChange}
        textareaRef={textareaRef}
        paperRef={paper}
      >
        {stickers.map((s) => (
          <button
            type="button"
            key={s.id}
            className="letter-sticker placed-sticker"
            style={stickerStyle(s)}
            disabled={disabled}
            data-selected={selected === s.id}
            data-dragging={drag?.id === s.id}
            aria-label={`${label(s.id)} 스티커 이동`}
            aria-describedby="placed-sticker-help"
            {...handlers(s.id)}
            onKeyDown={(e) => keyboard(e, s.id, s)}
          >
            <img src={stickerCatalog[s.id].src} alt="" draggable={false} />
          </button>
        ))}
        <button
          type="button"
          className="letter-sticker letter-target-sticker placed-sticker"
          style={stickerStyle(targetBadge)}
          disabled={disabled}
          data-selected={selected === 'target'}
          data-dragging={drag && isTarget(drag.id)}
          aria-label={`${TARGET_LABELS[target]} 대상 스티커 이동`}
          aria-describedby="placed-sticker-help"
          {...handlers(target)}
          onKeyDown={(e) => keyboard(e, target, targetBadge)}
        >
          <TargetStickerImage target={target} />
        </button>
      </PaperQuestionInput>
      <div className="sticker-tools">
        <span id="placed-sticker-help">붙인 스티커도 다시 옮길 수 있어요</span>
        {selected &&
          selected !== 'target' &&
          stickers.some((s) => s.id === selected) && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => remove(selected)}
            >
              스티커 떼기
            </button>
          )}
      </div>
      <span className="sr-only">
        스티커를 누르면 붙일 수 있어요. 붙인 스티커는 방향키로 이동, Delete로
        떼기. 대상 스티커는 반드시 하나를 유지합니다.
      </span>
      <span className="sr-only" role="status">
        {notice}
      </span>
      {drag &&
        portal &&
        createPortal(
          <div
            className={`drag-sticker-preview ${isTarget(drag.id) ? 'drag-target-preview' : ''}`}
            style={{ left: drag.x, top: drag.y }}
            aria-hidden="true"
          >
            {isTarget(drag.id) ? (
              <TargetStickerImage target={drag.id} />
            ) : (
              <img src={stickerCatalog[drag.id].src} alt="" draggable={false} />
            )}
          </div>,
          portal,
        )}
    </div>
  )
}
