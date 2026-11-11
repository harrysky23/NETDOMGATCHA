import type { RefObject } from 'react'
import { Icon } from '../Icon'
import {
  hotspotRect,
  MACHINE_HOTSPOTS,
  type MachineSize,
} from './machineGeometry'

export function MachineHotspots({
  size,
  disabled,
  requesting,
  showHints,
  drawRef,
  onDraw,
  onSubmit,
}: {
  size: MachineSize
  disabled: boolean
  requesting: boolean
  showHints: boolean
  drawRef: RefObject<HTMLButtonElement | null>
  onDraw: () => void
  onSubmit: () => void
}) {
  if (!size.width || !size.height) return null
  return (
    <div className="machine-hotspots" data-hints={showHints}>
      <button
        ref={drawRef}
        className="machine-hotspot machine-hotspot-handle"
        style={hotspotRect(size, MACHINE_HOTSPOTS.handle)}
        type="button"
        disabled={disabled}
        onClick={onDraw}
        aria-label="손잡이를 눌러 질문 뽑기"
        aria-busy={requesting}
      >
        <span className="hotspot-hint" aria-hidden="true">
          {requesting ? (
            <>
              <span className="spinner" />
              뽑는 중
            </>
          ) : (
            <>
              <Icon name="sparkles" size={13} />
              눌러서 뽑기
            </>
          )}
        </span>
      </button>
      <button
        className="machine-hotspot machine-hotspot-capsule"
        style={hotspotRect(size, MACHINE_HOTSPOTS.capsule)}
        type="button"
        disabled={disabled}
        onClick={onSubmit}
        aria-label="캡슐 보관통을 눌러 질문 넣기"
        aria-haspopup="dialog"
      >
        <span className="hotspot-hint" aria-hidden="true">
          <Icon name="pen" size={13} />
          질문 넣기
        </span>
      </button>
    </div>
  )
}
