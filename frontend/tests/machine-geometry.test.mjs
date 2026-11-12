import test from 'node:test'
import assert from 'node:assert/strict'
import {
  fitMachine,
  hotspotRect,
  MACHINE_ART,
  MACHINE_HOTSPOTS,
} from '../src/components/gacha/machineGeometry.ts'

test('모바일·가로 화면·데스크톱에서 원본 비율을 유지하고 크롭하지 않음', () => {
  for (const [width, height] of [
    [320, 512],
    [390, 782],
    [844, 328],
    [1440, 832],
  ]) {
    const frame = fitMachine(width, height)
    assert.ok(frame.width <= width + 0.001)
    assert.ok(frame.height <= height + 0.001)
    assert.ok(
      Math.abs(
        frame.width / frame.height - MACHINE_ART.width / MACHINE_ART.height,
      ) < 0.00001,
    )
  }
})

test('핫스폿은 실제 이미지의 같은 위치에 유지되고 최소 44px 터치 영역을 확보', () => {
  for (const [width, height] of [
    [320, 512],
    [390, 782],
    [844, 328],
    [1440, 832],
  ]) {
    const frame = fitMachine(width, height)
    for (const region of Object.values(MACHINE_HOTSPOTS)) {
      const rect = hotspotRect(frame, region)
      assert.ok(rect.width >= 44 && rect.height >= 44)
      assert.ok(rect.left >= 0 && rect.top >= 0)
      assert.ok(rect.left + rect.width <= frame.width)
      assert.ok(rect.top + rect.height <= frame.height)
      assert.ok(
        Math.abs(
          ((rect.left + rect.width / 2) / frame.width) * 100 - region.x,
        ) < 0.00001,
      )
      assert.ok(
        Math.abs(
          ((rect.top + rect.height / 2) / frame.height) * 100 - region.y,
        ) < 0.00001,
      )
    }
  }
})

test('손잡이와 보관통은 서로 다른 터치 영역이고 contain 여백을 포함하지 않음', () => {
  const frame = fitMachine(1440, 832)
  assert.ok(frame.width < 1440)
  const handle = hotspotRect(frame, MACHINE_HOTSPOTS.handle)
  const capsule = hotspotRect(frame, MACHINE_HOTSPOTS.capsule)
  assert.ok(capsule.top + capsule.height < handle.top)
})

test('숨겨진 영상 모달처럼 크기가 없는 컨테이너는 유효하지 않은 좌표를 생성하지 않음', () => {
  assert.deepEqual(fitMachine(0, 0), { width: 0, height: 0 })
  assert.deepEqual(fitMachine(NaN, 100), { width: 0, height: 0 })
})
