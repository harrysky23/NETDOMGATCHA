import test from 'node:test'
import assert from 'node:assert/strict'
import {
  isDecoration,
  paperPosition,
  pickStickerChoices,
} from '../src/services/questionDecoration.ts'
import { mockApi, TABLES } from '../src/services/mockApi.ts'
import { createHttpApi } from '../src/services/httpApi.ts'
import { isDrawResult } from '../src/services/validation.ts'

const decoration = {
  version: 1,
  paper: 'lined',
  target_badge: { x: 0.67, y: 0.31, rotation: 8 },
  stickers: [
    { id: 'clover-cat', x: 0.21, y: 0.81, rotation: -10 },
    { id: 'stars', x: 0.77, y: 0.72, rotation: 8 },
  ],
}

test('꾸미기 데이터는 허용된 스티커 3개 이하·유한한 편지지 좌표만 허용', () => {
  assert.ok(isDecoration(decoration))
  for (const bad of [
    { ...decoration, version: 2 },
    { ...decoration, target_badge: { x: 2, y: 0.2, rotation: 0 } },
    {
      ...decoration,
      stickers: [...decoration.stickers, ...decoration.stickers],
    },
    ...[
      { id: 'https://evil/image.png' },
      { x: NaN },
      { x: Infinity },
      { x: -0.1 },
      { y: 2 },
      { rotation: 21 },
    ].map((s) => ({
      ...decoration,
      stickers: [{ ...decoration.stickers[0], ...s }],
    })),
  ])
    assert.equal(isDecoration(bad), false)
  for (let i = 0; i < 30; i++) {
    const choices = pickStickerChoices()
    assert.ok(choices.length === 2 || choices.length === 3)
    assert.equal(new Set(choices).size, choices.length)
  }
})

test('모바일·데스크톱에서 같은 위치로 드롭하고 편지지 밖/숨긴 영역은 거절', () => {
  for (const width of [292, 362, 560]) {
    const rect = { left: 20, top: 300, width, height: (width * 1054) / 1493 }
    const p = paperPosition(
      rect.left + width * 0.6,
      rect.top + rect.height * 0.7,
      rect,
    )
    assert.ok(Math.abs(p.x - 0.6) < 1e-9)
    assert.ok(Math.abs(p.y - 0.7) < 1e-9)
    assert.equal(paperPosition(0, 0, rect), null)
  }
  assert.equal(
    paperPosition(0, 0, { left: 0, top: 0, width: 0, height: 0 }),
    null,
  )
})

test('작성→같은 테이블 다른 참가자의 추첨→멱등 재요청·복구에도 편지지 스티커 유지', async () => {
  const values = new Map()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k) => values.get(k) ?? null,
      setItem: (k, v) => values.set(k, v),
    },
  })
  const table = TABLES[0].id
  const enter = () =>
    mockApi.createParticipant({
      visitorId: crypto.randomUUID(),
      nickname: '꾸미기',
      table_id: table,
    })
  const author = await enter(),
    reader = await enter()
  const input = {
    content: '꾸민 편지',
    target: 'junior',
    decoration: structuredClone(decoration),
    visitorId: author.participant.visitor_id,
    nickname: '꾸미기',
  }
  const q = await mockApi.submitQuestion(author, table, input)
  input.decoration.stickers[0].x = 0.5
  assert.deepEqual(q.decoration, decoration)
  assert.deepEqual(
    (await mockApi.listQuestions(reader, table)).find((x) => x.id === q.id)
      .decoration,
    decoration,
  )
  let draw
  for (let i = 0; i < 13; i++) {
    const result = await mockApi.draw(reader, table, `key-${i}`)
    if (result.question.id === q.id) {
      draw = result
      assert.deepEqual(await mockApi.draw(reader, table, `key-${i}`), draw)
    }
  }
  assert.ok(draw)
  assert.deepEqual(draw.question.decoration, decoration)
  assert.ok(isDrawResult(draw))
  assert.deepEqual(
    (await mockApi.getLatestDraw(reader, table)).question.decoration,
    decoration,
  )
  assert.deepEqual(
    (await mockApi.getHistory(reader, table)).find((x) => x.id === draw.id)
      .question.decoration,
    decoration,
  )
})

test('HTTP 요청/목록/추첨/최근 결과에서 스티커를 누락하지 않고 잘못된 응답은 거절', async () => {
  const q = {
    id: 'q',
    table_id: 'table',
    content: '꾸민 편지',
    target: 'all',
    is_drawn: false,
    created_at: '2026-11-12',
    decoration,
  }
  const result = {
    id: 'draw',
    table_id: 'table',
    drawn_at: '2026-11-12',
    question: q,
  }
  const session = {
    participant: { id: 'p', nickname: 'NET', table_id: 'table' },
    token: 'server-token',
  }
  const requests = []
  const api = createHttpApi('/api', async (url, options) => {
    requests.push(options)
    return Response.json(
      url.endsWith('/questions')
        ? options.method === 'POST'
          ? q
          : [q]
        : result,
    )
  })
  await api.submitQuestion(session, 'table', {
    content: q.content,
    target: 'all',
    decoration,
    nickname: 'NET',
    visitorId: crypto.randomUUID(),
  })
  assert.deepEqual(JSON.parse(requests[0].body).decoration, decoration)
  assert.deepEqual(
    (await api.listQuestions(session, 'table'))[0].decoration,
    decoration,
  )
  assert.deepEqual(
    (await api.draw(session, 'table', 'key')).question.decoration,
    decoration,
  )
  assert.deepEqual(
    (await api.getLatestDraw(session, 'table')).question.decoration,
    decoration,
  )
  const broken = createHttpApi('/api', async () =>
    Response.json({
      ...result,
      question: {
        ...q,
        decoration: {
          ...decoration,
          stickers: [{ ...decoration.stickers[0], id: 'unknown' }],
        },
      },
    }),
  )
  await assert.rejects(
    broken.draw(session, 'table', 'bad'),
    (e) => e.code === 'INVALID_RESPONSE',
  )
  assert.ok(
    isDrawResult({ ...result, question: { ...q, decoration: undefined } }),
  )
})
