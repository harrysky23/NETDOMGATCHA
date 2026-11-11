import test from 'node:test'
import assert from 'node:assert/strict'
import { createHttpApi } from '../src/services/httpApi.ts'

const session = { token: 'server-token', participant: { id: 'p', nickname: 'NET', table_id: 'table' } }
const result = { id: 'draw', table_id: 'table', drawn_at: '2026-11-11T10:00:00Z', question: {
  id: 'q', table_id: 'table', content: '요즘 어떤가요?', target: 'junior', is_drawn: true, created_at: '2026-11-11T10:00:00Z'
} }

test('실제 추첨 POST에 세션 토큰·동일 멱등 키를 전달', async () => {
  const calls = []
  const api = createHttpApi('https://api.example/api/', async (url, options) => {
    calls.push({ url, options })
    return Response.json(result)
  })
  assert.deepEqual(await api.draw(session, 'table', 'same-key'), result)
  await api.draw(session, 'table', 'same-key')
  for (const call of calls) {
    assert.equal(call.url, 'https://api.example/api/tables/table/draw')
    assert.equal(call.options.method, 'POST')
    assert.equal(call.options.headers.Authorization, 'Bearer server-token')
    assert.equal(call.options.headers['Idempotency-Key'], 'same-key')
  }
})

test('서버 오류·네트워크 오류에서는 성공 결과를 만들지 않고 자동 재시도하지 않음', async () => {
  const empty = createHttpApi('/api', async () => Response.json({ detail: { code: 'NO_QUESTIONS_AVAILABLE' } }, { status: 409 }))
  await assert.rejects(empty.draw(session, 'table', 'key'), error => error.code === 'NO_QUESTIONS_AVAILABLE')
  let requests = 0
  const offline = createHttpApi('/api', async () => { requests++; throw new TypeError('offline') })
  await assert.rejects(offline.draw(session, 'table', 'key'), error => error.code === 'NETWORK_ERROR')
  assert.equal(requests, 1)
})

test('다른 테이블·잘못된 질문 대상·깨진 JSON 응답 거절', async () => {
  for (const value of [{ ...result, table_id: 'other' }, { ...result, question: { ...result.question, target: 'invalid' } }]) {
    const api = createHttpApi('/api', async () => Response.json(value))
    await assert.rejects(api.draw(session, 'table', 'key'), error => error.code === 'INVALID_RESPONSE')
  }
  const broken = createHttpApi('/api', async () => new Response('not-json'))
  await assert.rejects(broken.draw(session, 'table', 'key'), error => error.code === 'INVALID_RESPONSE')
})

test('최근 추첨이 없는 정상 null 응답 허용', async () => {
  const api = createHttpApi('/api', async () => Response.json(null))
  assert.equal(await api.getLatestDraw(session, 'table'), null)
})
