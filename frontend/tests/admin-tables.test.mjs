import test, { beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { createMockAdminApi } from '../src/services/adminApi.ts'
import { mockApi } from '../src/services/mockApi.ts'
import { getMockTables } from '../src/services/tableStore.ts'

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

test('초기 3개 테이블, 미리보기 입장 전 추가 거절', async () => {
  const admin = createMockAdminApi()
  assert.equal(getMockTables().length, 3)
  await assert.rejects(
    admin.addTable('forged-token'),
    (error) => error.code === 'UNAUTHORIZED',
  )
  assert.equal(getMockTables().length, 3)
})

test('관리자 추가 후 TABLE 04부터 순서대로 저장·참가자 목록에 반영', async () => {
  const admin = createMockAdminApi()
  const token = await admin.login('')
  const fourth = await admin.addTable(token)
  assert.equal(fourth.name, 'TABLE 04')
  assert.equal(fourth.number, 4)
  await admin.addTable(token)
  const tables = await mockApi.listTables()
  assert.equal(tables.length, 5)
  assert.equal(tables[4].name, 'TABLE 05')
  assert.equal(new Set(tables.map((table) => table.id)).size, 5)
  assert.equal(getMockTables().length, 5)
})

test('추가된 테이블도 입장·질문·추첨이 독립 동작', async () => {
  const admin = createMockAdminApi()
  const table = await admin.addTable(await admin.login(''))
  const guest = await mockApi.createParticipant({
    nickname: '게스트',
    table_id: table.id,
  })
  assert.equal((await mockApi.getStatus(guest, table.id)).remaining_count, 12)
  await mockApi.draw(guest, table.id, 'draw-1')
  assert.equal((await mockApi.getStatus(guest, table.id)).remaining_count, 11)
  const initial = getMockTables()[0]
  const other = await mockApi.createParticipant({
    nickname: '게스트',
    table_id: initial.id,
  })
  assert.equal((await mockApi.getStatus(other, initial.id)).remaining_count, 12)
})
