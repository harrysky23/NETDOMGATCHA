import test, { beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { mockApi, TABLES } from '../src/services/mockApi.ts'
import { readStorage, writeStorage } from '../src/services/storage.ts'

// 브라우저와 독립적인 인메모리 저장소. 실제 브라우저 데이터는 변경하지 않습니다.
let values
beforeEach(() => {
  values = new Map()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    },
  })
})

const enter = (table = 0, nickname = 'NET') =>
  mockApi.createParticipant({ nickname, table_id: TABLES[table].id })
const hasCode = (code) => (error) => error.code === code

test('정확히 5개 고정 테이블과 독립적인 반환값', async () => {
  const tables = await mockApi.listTables()
  assert.deepEqual(
    tables.map((t) => t.name),
    ['TABLE 01', 'TABLE 02', 'TABLE 03', 'TABLE 04', 'TABLE 05'],
  )
  assert.equal(new Set(tables.map((t) => t.id)).size, 5)
  tables[0].name = '변경 시도'
  assert.equal((await mockApi.listTables())[0].name, 'TABLE 01')
})

test('입장 검증, 중복 닉네임 허용, 서로 다른 참가자 ID', async () => {
  const first = await enter(0, '  NET  ')
  const second = await enter(0)
  assert.equal(first.participant.nickname, 'NET')
  assert.notEqual(first.participant.id, second.participant.id)
  await assert.rejects(enter(0, '   '), hasCode('VALIDATION_ERROR'))
  await assert.rejects(enter(0, '가'.repeat(13)), hasCode('VALIDATION_ERROR'))
  await assert.rejects(
    mockApi.createParticipant({ nickname: 'NET', table_id: 'invalid' }),
    hasCode('TABLE_NOT_FOUND'),
  )
})

test('질문은 현재 테이블에만 저장하고 재조회 시 시드를 중복 추가하지 않음', async () => {
  const one = await enter(0)
  const two = await enter(1)
  const initial = await mockApi.getStatus(one, TABLES[0].id)
  const question = await mockApi.submitQuestion(one, TABLES[0].id, {
    content: '  오늘 어땠나요?  ',
    target: 'senior',
  })
  assert.equal(question.content, '오늘 어땠나요?')
  assert.equal(question.target, 'senior')
  assert.equal('author_id' in question, false)
  assert.equal(
    (await mockApi.getStatus(one, TABLES[0].id)).remaining_count,
    initial.remaining_count + 1,
  )
  assert.equal(
    (await mockApi.getStatus(one, TABLES[0].id)).total_count,
    initial.total_count + 1,
  )
  assert.equal((await mockApi.getStatus(two, TABLES[1].id)).remaining_count, 12)
})

test('질문 1자/200자/공백/201자/잘못된 대상 경계 검증', async () => {
  const session = await enter()
  const submit = (content, target = 'all') =>
    mockApi.submitQuestion(session, TABLES[0].id, { content, target })
  await submit('가')
  await submit('가'.repeat(200))
  await submit('🎉'.repeat(200))
  await assert.rejects(submit('   '), hasCode('VALIDATION_ERROR'))
  await assert.rejects(submit('가'.repeat(201)), hasCode('VALIDATION_ERROR'))
  await assert.rejects(submit('안녕', 'invalid'), hasCode('VALIDATION_ERROR'))
  assert.equal((await mockApi.getStatus(session, TABLES[0].id)).total_count, 15)
})

test('테이블 변경 시 ID/토큰 유지, 변경된 세션의 이전 테이블 접근 차단', async () => {
  const original = await enter()
  const moved = await mockApi.changeTable(original, TABLES[4].id)
  assert.equal(moved.participant.id, original.participant.id)
  assert.equal(moved.token, original.token)
  assert.equal(
    (await mockApi.getStatus(moved, TABLES[4].id)).table.name,
    'TABLE 05',
  )
  await assert.rejects(
    mockApi.getStatus(moved, TABLES[0].id),
    hasCode('TABLE_ACCESS_DENIED'),
  )
  await assert.rejects(
    mockApi.submitQuestion(moved, TABLES[0].id, {
      content: '질문',
      target: 'all',
    }),
    hasCode('TABLE_ACCESS_DENIED'),
  )
  await assert.rejects(
    mockApi.getHistory(moved, TABLES[0].id),
    hasCode('TABLE_ACCESS_DENIED'),
  )
})

test('실제 추첨은 실행하지 않고 질문 수/기록을 변경하지 않음', async () => {
  const session = await enter()
  const before = await mockApi.getStatus(session, TABLES[0].id)
  await assert.rejects(
    mockApi.draw(session, TABLES[0].id, 'same-key'),
    hasCode('NOT_IMPLEMENTED'),
  )
  assert.deepEqual(await mockApi.getStatus(session, TABLES[0].id), before)
  assert.deepEqual(await mockApi.getHistory(session, TABLES[0].id), [])
  assert.equal(await mockApi.getLatestDraw(session, TABLES[0].id), null)
})

test('손상된 저장 데이터는 안전하게 기본값으로 복원', async () => {
  const session = await enter()
  const key = `net:mock:questions:v1:${TABLES[0].id}`
  values.set(key, '{broken')
  assert.equal(
    (await mockApi.getStatus(session, TABLES[0].id)).remaining_count,
    12,
  )
  values.set(key, JSON.stringify([{ id: 'wrong' }]))
  assert.equal(
    (await mockApi.getStatus(session, TABLES[0].id)).remaining_count,
    12,
  )
  assert.equal(
    readStorage(key, (value) => typeof value === 'string'),
    null,
  )
})

test('저장소 차단 시 저장 성공으로 오인하지 않고 오류 반환', async () => {
  const session = await enter()
  globalThis.localStorage.setItem = () => {
    throw new Error('quota')
  }
  assert.throws(
    () => writeStorage('sample', 'value'),
    hasCode('STORAGE_UNAVAILABLE'),
  )
  await assert.rejects(
    mockApi.submitQuestion(session, TABLES[0].id, {
      content: '질문',
      target: 'all',
    }),
    hasCode('STORAGE_UNAVAILABLE'),
  )
})
