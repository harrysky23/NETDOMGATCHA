export const MACHINE_ART = { width: 720, height: 1280 } as const

export interface MachineSize {
  width: number
  height: number
}
export interface HotspotRegion {
  x: number
  y: number
  width: number
  height: number
}

/** 원본 720×1280 이미지의 중심 좌표와 크기를 백분율로 정의합니다. */
export const MACHINE_HOTSPOTS = {
  handle: { x: 30.3, y: 64.3, width: 21.5, height: 11 },
  capsule: { x: 46, y: 46.2, width: 55, height: 22 },
} satisfies Record<string, HotspotRegion>

export function fitMachine(width: number, height: number): MachineSize {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  )
    return { width: 0, height: 0 }
  const scale = Math.min(width / MACHINE_ART.width, height / MACHINE_ART.height)
  return {
    width: MACHINE_ART.width * scale,
    height: MACHINE_ART.height * scale,
  }
}

/** 실제 표시되는 이미지 프레임 기준으로 계산하므로 contain 여백은 클릭 영역에 포함하지 않습니다. */
export function hotspotRect(size: MachineSize, region: HotspotRegion) {
  const width = Math.max(44, (size.width * region.width) / 100)
  const height = Math.max(44, (size.height * region.height) / 100)
  return {
    width,
    height,
    left: (size.width * region.x) / 100 - width / 2,
    top: (size.height * region.y) / 100 - height / 2,
  }
}
