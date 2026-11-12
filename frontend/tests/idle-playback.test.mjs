import test from 'node:test'
import assert from 'node:assert/strict'
import {
  attachIdlePlayback,
  mediaPolicy,
} from '../src/components/gacha/idlePlayback.ts'

class Page extends EventTarget {
  visibilityState = 'visible'
  change(value) {
    this.visibilityState = value
    this.dispatchEvent(new Event('visibilitychange'))
  }
}
class Media extends EventTarget {
  muted = false
  plays = 0
  pauses = 0
  playResult = () => Promise.resolve()
  play() {
    this.plays++
    return this.playResult()
  }
  pause() {
    this.pauses++
  }
}
const settle = () => new Promise((resolve) => setImmediate(resolve))

test('대기 재생은 음소거로 시작하고 탭을 숨기면 정지·복귀하면 재생', async () => {
  const media = new Media()
  const page = new Page()
  const control = attachIdlePlayback(media, page, () =>
    assert.fail('재생 실패'),
  )
  control.setActive(true)
  assert.equal(media.plays, 1)
  assert.equal(media.muted, true)
  page.change('hidden')
  assert.ok(media.pauses >= 1)
  page.change('visible')
  assert.equal(media.plays, 2)
  await settle()
  control.dispose()
})

test('추첨·결과·등록 중에는 화면 복귀나 늦은 playing 이벤트도 대기를 재개하지 않음', async () => {
  const media = new Media()
  const page = new Page()
  let resolve
  media.playResult = () =>
    new Promise((done) => {
      resolve = done
    })
  const control = attachIdlePlayback(media, page, () =>
    assert.fail('재생 실패'),
  )
  control.setActive(true)
  control.setActive(false)
  page.change('hidden')
  page.change('visible')
  const pauses = media.pauses
  resolve()
  await settle()
  media.dispatchEvent(new Event('playing'))
  assert.ok(media.pauses > pauses)
  assert.equal(media.plays, 1)
  control.setActive(true)
  assert.equal(media.plays, 2)
  control.dispose()
})

test('자동 재생 거절 시 포스터 대체를 알리고 오래된 요청 취소는 실패로 표시하지 않음', async () => {
  const media = new Media()
  const page = new Page()
  let blocked = 0
  media.playResult = () => Promise.reject(new Error('NotAllowedError'))
  const control = attachIdlePlayback(media, page, () => blocked++)
  control.setActive(true)
  await settle()
  assert.equal(blocked, 1)
  control.setActive(true)
  control.setActive(false)
  await settle()
  assert.equal(blocked, 1)
  control.dispose()
  page.change('visible')
  assert.equal(media.plays, 2)
})

test('데이터 절약·느린 회선은 포스터, 알 수 없는 회선은 추첨 metadata만 준비', () => {
  assert.deepEqual(mediaPolicy(), {
    idleEnabled: true,
    drawPreload: 'metadata',
  })
  for (const connection of [
    { saveData: true },
    { effectiveType: '2g' },
    { effectiveType: 'slow-2g' },
  ]) {
    assert.deepEqual(mediaPolicy(connection), {
      idleEnabled: false,
      drawPreload: 'none',
    })
  }
  assert.deepEqual(mediaPolicy({ type: 'wifi' }), {
    idleEnabled: true,
    drawPreload: 'auto',
  })
})

test('StrictMode 재연결 후 이전 play 응답이 새 대기 재생을 멈추지 않음', async () => {
  const media = new Media()
  const page = new Page()
  let resolveFirst
  media.playResult = () =>
    new Promise((resolve) => {
      resolveFirst = resolve
    })
  const old = attachIdlePlayback(media, page, () =>
    assert.fail('이전 재생 오류'),
  )
  old.setActive(true)
  old.dispose()
  media.playResult = () => Promise.resolve()
  const current = attachIdlePlayback(media, page, () =>
    assert.fail('현재 재생 오류'),
  )
  current.setActive(true)
  const pauses = media.pauses
  resolveFirst()
  await settle()
  assert.equal(media.pauses, pauses)
  current.dispose()
})
