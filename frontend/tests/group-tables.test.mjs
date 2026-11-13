import test, { beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { mockApi, TABLES } from '../src/services/mockApi.ts'
import { createHttpApi } from '../src/services/httpApi.ts'
let storage
beforeEach(() => {
  storage = new Map()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k) => storage.get(k) ?? null,
      setItem: (k, v) => storage.set(k, v),
    },
  })
})
const enter = (table, nickname = 'NET') =>
  mockApi.createParticipant({
    table_id: table,
    nickname,
    visitorId: crypto.randomUUID(),
  })

test('관리자 없이 그룹 추가·이름 변경, 테이블 ID와 기존 질문/추첨 이력 보존', async () => {
  const created = await mockApi.createTable('  동기 모임  ')
  assert.equal(created.name, '동기 모임')
  assert.equal(created.number, 4)
  const session = await enter(created.id)
  const question = await mockApi.submitQuestion(session, created.id, {
    content: '우리 모임 질문',
    target: 'all',
    nickname: 'NET',
    visitorId: session.participant.visitor_id,
  })
  const result = await mockApi.draw(session, created.id, 'before-rename')
  const renamed = await mockApi.renameTable(created.id, '새 그룹 이름')
  assert.equal(renamed.id, created.id)
  assert.equal(renamed.number, 4)
  assert.equal(
    (await mockApi.listTables()).find((t) => t.id === created.id).name,
    '새 그룹 이름',
  )
  assert.ok(
    (await mockApi.listQuestions(session, created.id)).some(
      (q) => q.id === question.id,
    ),
  )
  assert.deepEqual((await mockApi.getHistory(session, created.id))[0], result)
  assert.equal((await mockApi.createTable()).name, 'TABLE 05')
  for (const name of ['', '  ', '가'.repeat(31), '이름\u0000'])
    await assert.rejects(
      mockApi.renameTable(created.id, name),
      (e) => e.code === 'VALIDATION_ERROR',
    )
})

test('입장·닉네임 변경·테이블 이동을 참가자 목록에 반영하고 인증 정보는 숨김', async () => {
  const one = await enter(TABLES[0].id, '동명이인'),
    two = await enter(TABLES[0].id, '동명이인')
  let members = await mockApi.listParticipants(one, TABLES[0].id)
  assert.equal(members.length, 2)
  assert.deepEqual(Object.keys(members[0]).sort(), ['id', 'nickname'])
  const renamed = await mockApi.updateParticipantProfile(two, {
    visitorId: two.participant.visitor_id,
    nickname: '새 이름',
  })
  assert.ok(
    (await mockApi.listParticipants(one, TABLES[0].id)).some(
      (p) => p.nickname === '새 이름',
    ),
  )
  const moved = await mockApi.changeTable(renamed, TABLES[1].id)
  assert.deepEqual(
    (await mockApi.listParticipants(one, TABLES[0].id)).map((p) => p.id),
    [one.participant.id],
  )
  assert.deepEqual(
    (await mockApi.listParticipants(moved, TABLES[1].id)).map((p) => p.id),
    [two.participant.id],
  )
  await assert.rejects(
    mockApi.listParticipants(one, TABLES[1].id),
    (e) => e.code === 'TABLE_ACCESS_DENIED',
  )
  const before = storage.get('net:mock:participants:v1')
  await mockApi.listParticipants(one, TABLES[0].id)
  assert.equal(storage.get('net:mock:participants:v1'), before)
})

test('HTTP 그룹 관리 경로·입력과 참가자 조회 Bearer 토큰 전달', async () => {
  const calls = []
  const api = createHttpApi('/api', async (url, options) => {
    calls.push({ url, ...options })
    return Response.json(
      url.endsWith('/participants')
        ? [{ id: 'p', nickname: 'NET', token: 'hidden' }]
        : { id: 'table', number: 4, name: '그룹' },
    )
  })
  await api.createTable('그룹')
  await api.renameTable('table', '이름 변경')
  const members = await api.listParticipants(
    {
      participant: { id: 'p', nickname: 'NET', table_id: 'table' },
      token: 'server-token',
    },
    'table',
  )
  assert.equal(calls[0].url, '/api/tables')
  assert.equal(calls[0].method, 'POST')
  assert.deepEqual(JSON.parse(calls[0].body), { name: '그룹' })
  assert.equal(calls[1].url, '/api/tables/table')
  assert.equal(calls[1].method, 'PATCH')
  assert.equal(calls[2].headers.Authorization, 'Bearer server-token')
  assert.deepEqual(members, [{ id: 'p', nickname: 'NET' }])
})
