import test, { beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  prepareDraw,
  getDrawCheckpoint,
  saveDrawResult,
  clearDrawCheckpoint,
} from '../src/services/drawCheckpoint.ts'
import { mockApi, TABLES } from '../src/services/mockApi.ts'

beforeEach(() => {
  const values = new Map()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    },
  })
})

const enter = () =>
  mockApi.createParticipant({
    visitorId: crypto.randomUUID(),
    nickname: 'NET',
    table_id: TABLES[0].id,
  })

test('미완료 요청은 재진입·재시도에도 최초 키를 재사용', async () => {
  const session = await enter()
  const first = prepareDraw(session)
  const retry = prepareDraw(session)
  assert.equal(first.idempotencyKey, retry.idempotencyKey)
  assert.equal(retry.result, null)
})

test('영상 전에 저장한 결과 복구, 초기화 후에만 새 추첨 키 발급', async () => {
  const session = await enter()
  const request = prepareDraw(session)
  const result = await mockApi.draw(
    session,
    session.participant.table_id,
    request.idempotencyKey,
  )
  saveDrawResult(session, request.idempotencyKey, result)
  assert.deepEqual(getDrawCheckpoint(session).result, result)
  assert.deepEqual(prepareDraw(session).result, result)
  clearDrawCheckpoint(session)
  assert.equal(getDrawCheckpoint(session), null)
  assert.notEqual(prepareDraw(session).idempotencyKey, request.idempotencyKey)
})

test('참가자와 테이블별 복구 저장소 분리', async () => {
  const session = await enter()
  prepareDraw(session)
  const other = await enter()
  assert.equal(getDrawCheckpoint(other), null)
  const moved = await mockApi.changeTable(session, TABLES[1].id)
  assert.equal(getDrawCheckpoint(moved), null)
})

test('키를 저장하지 못하면 추첨 준비를 실패시켜 유실 가능한 요청을 방지', async () => {
  const session = await enter()
  globalThis.localStorage.setItem = () => {
    throw new Error('quota')
  }
  assert.throws(
    () => prepareDraw(session),
    (error) => error.code === 'STORAGE_UNAVAILABLE',
  )
})
