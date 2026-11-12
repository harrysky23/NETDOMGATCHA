import type { NetApi } from './contracts'
import {
  ApiError,
  type EventTable,
  type ParticipantSession,
  type Question,
  type QuestionTarget,
  type DrawResult,
} from '../types/index.ts'
import { readStorage, writeStorage } from './storage.ts'
import { isDrawResult } from './validation.ts'
import { getMockTables, INITIAL_TABLES } from './tableStore.ts'
import { isVisitorId, normalizeNickname } from './visitorProfile.ts'

interface StoredQuestion extends Question {
  author_id?: string
  author_visitor_id?: string
  author_nickname?: string
}
// 작성자 스냅샷은 저장소에만 기록하고 모든 참가자 응답에서는 제외합니다.
function publicQuestion(q: Question): Question {
  return {
    id: q.id,
    table_id: q.table_id,
    content: q.content,
    target: q.target,
    is_drawn: q.is_drawn,
    created_at: q.created_at,
  }
}

interface MockDrawReceipt {
  idempotencyKey: string
  participantId: string
  result: DrawResult
}

function readDraws(tableId: string): MockDrawReceipt[] {
  return (
    readStorage(
      `net:mock:draws:v1:${tableId}`,
      (value): value is MockDrawReceipt[] =>
        Array.isArray(value) &&
        value.every(
          (item) =>
            item &&
            typeof item.idempotencyKey === 'string' &&
            typeof item.participantId === 'string' &&
            isDrawResult(item.result) &&
            item.result.table_id === tableId,
        ),
    ) ?? []
  )
}

export const TABLES: EventTable[] = INITIAL_TABLES

const SEEDS: { content: string; target: QuestionTarget }[] = [
  { content: 'NET에서 가장 기억에 남는 순간은 언제인가요?', target: 'all' },
  { content: '학부 시절로 돌아간다면 꼭 해보고 싶은 일은?', target: 'senior' },
  { content: '요즘 가장 푹 빠져 있는 것은 무엇인가요?', target: 'all' },
  { content: 'NET에 들어오게 된 계기가 궁금해요!', target: 'junior' },
  { content: '지금의 나에게 가장 큰 영향을 준 경험은?', target: 'senior' },
  { content: '최근 나를 웃게 만든 작은 일은 무엇인가요?', target: 'all' },
  { content: '올해 꼭 이루고 싶은 목표가 있나요?', target: 'junior' },
  { content: '나만 알고 싶은 학교 근처 맛집을 알려주세요.', target: 'all' },
  { content: '처음 개발을 시작했을 때 만든 것은 무엇인가요?', target: 'all' },
  { content: '후배에게 추천하고 싶은 대학 생활 경험은?', target: 'senior' },
  { content: '선배에게 가장 궁금했던 질문 하나는?', target: 'junior' },
  { content: '다 같이 하루를 보낸다면 어디에 가고 싶나요?', target: 'all' },
]

function tableById(id: string) {
  const table = getMockTables().find((table) => table.id === id)
  if (!table)
    throw new ApiError('TABLE_NOT_FOUND', '존재하지 않는 테이블이에요.')
  return table
}

function checkAccess(session: ParticipantSession, tableId: string) {
  tableById(tableId)
  if (!session.token.startsWith('mock-'))
    throw new ApiError('UNAUTHORIZED', '다시 입장해 주세요.')
  if (session.participant.table_id !== tableId)
    throw new ApiError(
      'TABLE_ACCESS_DENIED',
      '입장한 테이블에서만 이용할 수 있어요.',
    )
}

function isQuestions(value: unknown): value is StoredQuestion[] {
  return (
    Array.isArray(value) &&
    value.every(
      (q) =>
        q &&
        typeof q.id === 'string' &&
        typeof q.table_id === 'string' &&
        typeof q.content === 'string' &&
        ['senior', 'junior', 'all'].includes(q.target) &&
        typeof q.is_drawn === 'boolean' &&
        typeof q.created_at === 'string',
    )
  )
}

function readQuestions(tableId: string) {
  tableById(tableId)
  const key = `net:mock:questions:v1:${tableId}`
  const saved = readStorage(key, isQuestions)
  if (saved && saved.every((q) => q.table_id === tableId)) return saved
  // 동일한 ID를 사용하는 테이블별 초기화. 재방문 시 질문이 중복 추가되지 않습니다.
  return SEEDS.map(
    (q, index): Question => ({
      ...q,
      id: `${tableId}-seed-${index + 1}`,
      table_id: tableId,
      is_drawn: false,
      created_at: '2026-01-01T00:00:00.000Z',
    }),
  )
}

export const mockApi: NetApi = {
  async listTables() {
    return getMockTables()
  },
  async getParticipant(session) {
    checkAccess(session, session.participant.table_id)
    return { ...session, participant: { ...session.participant } }
  },
  async createParticipant({ nickname, table_id, visitorId }) {
    tableById(table_id)
    const trimmed = normalizeNickname(nickname)
    if (!isVisitorId(visitorId))
      throw new ApiError('VALIDATION_ERROR', '방문자 ID가 올바르지 않아요.')
    return {
      participant: {
        id: crypto.randomUUID(),
        nickname: trimmed,
        table_id,
        visitor_id: visitorId,
      },
      token: `mock-${crypto.randomUUID()}`,
    }
  },
  async updateParticipantProfile(session, profile) {
    checkAccess(session, session.participant.table_id)
    const nickname = normalizeNickname(profile.nickname)
    if (
      !isVisitorId(profile.visitorId) ||
      (session.participant.visitor_id &&
        session.participant.visitor_id !== profile.visitorId)
    )
      throw new ApiError('UNAUTHORIZED', '다른 방문자 정보로 변경할 수 없어요.')
    return {
      ...session,
      participant: {
        ...session.participant,
        visitor_id: profile.visitorId,
        nickname,
      },
    }
  },
  async changeTable(session, tableId) {
    checkAccess(session, session.participant.table_id)
    tableById(tableId)
    return {
      ...session,
      participant: { ...session.participant, table_id: tableId },
    }
  },
  async getStatus(session, tableId) {
    checkAccess(session, tableId)
    const questions = readQuestions(tableId)
    const drawnIds = new Set(
      readDraws(tableId).map((draw) => draw.result.question.id),
    )
    const remaining = questions.filter(
      (q) => !q.is_drawn && !drawnIds.has(q.id),
    ).length
    return {
      table: tableById(tableId),
      remaining_count: remaining,
      drawn_count: questions.length - remaining,
      total_count: questions.length,
    }
  },
  async submitQuestion(session, tableId, input) {
    checkAccess(session, tableId)
    if (
      !isVisitorId(input.visitorId) ||
      normalizeNickname(input.nickname) !== session.participant.nickname ||
      input.visitorId !== session.participant.visitor_id
    )
      throw new ApiError(
        'UNAUTHORIZED',
        '질문 작성자와 입장 정보가 일치하지 않아요.',
      )
    const content = input.content.trim()
    if (
      !content ||
      Array.from(content).length > 200 ||
      !['senior', 'junior', 'all'].includes(input.target)
    ) {
      throw new ApiError(
        'VALIDATION_ERROR',
        '질문은 1–200자로 입력하고 대상을 선택해 주세요.',
      )
    }
    const question: StoredQuestion = {
      id: crypto.randomUUID(),
      table_id: tableId,
      content,
      target: input.target,
      is_drawn: false,
      created_at: new Date().toISOString(),
      author_id: session.participant.id,
      author_visitor_id: input.visitorId,
      author_nickname: session.participant.nickname,
    }
    writeStorage(`net:mock:questions:v1:${tableId}`, [
      ...readQuestions(tableId),
      question,
    ])
    return publicQuestion(question)
  },
  async listQuestions(session, tableId) {
    checkAccess(session, tableId)
    const drawnIds = new Set(
      readDraws(tableId).map((draw) => draw.result.question.id),
    )
    return readQuestions(tableId)
      .map((question) => ({
        id: question.id,
        table_id: question.table_id,
        content: question.content,
        target: question.target,
        is_drawn: question.is_drawn || drawnIds.has(question.id),
        created_at: question.created_at,
      }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  },
  async draw(session, tableId, idempotencyKey) {
    checkAccess(session, tableId)
    if (!idempotencyKey.trim())
      throw new ApiError('VALIDATION_ERROR', '추첨 요청 키가 필요해요.')
    const draws = readDraws(tableId)
    const previous = draws.find(
      (draw) =>
        draw.idempotencyKey === idempotencyKey &&
        draw.participantId === session.participant.id,
    )
    if (previous) return previous.result
    const drawnIds = new Set(draws.map((draw) => draw.result.question.id))
    // 목업은 순서대로 선택합니다. 실제 무작위 추첨·원자적 처리는 FastAPI/PostgreSQL 책임입니다.
    const question = readQuestions(tableId).find(
      (question) => !question.is_drawn && !drawnIds.has(question.id),
    )
    if (!question)
      throw new ApiError(
        'NO_QUESTIONS_AVAILABLE',
        '우리 테이블의 질문을 모두 뽑았어요. 새 질문을 남겨 주세요.',
      )
    const result: DrawResult = {
      id: crypto.randomUUID(),
      table_id: tableId,
      question: { ...publicQuestion(question), is_drawn: true },
      drawn_at: new Date().toISOString(),
    }
    // 추첨·멱등 결과를 하나의 저장값으로 기록하여 부분 저장을 피합니다.
    writeStorage(`net:mock:draws:v1:${tableId}`, [
      ...draws,
      { idempotencyKey, participantId: session.participant.id, result },
    ])
    return result
  },
  async getHistory(session, tableId) {
    checkAccess(session, tableId)
    return readDraws(tableId)
      .map((draw) => draw.result)
      .reverse()
  },
  async getLatestDraw(session, tableId) {
    checkAccess(session, tableId)
    return (
      readDraws(tableId)
        .filter((draw) => draw.participantId === session.participant.id)
        .at(-1)?.result ?? null
    )
  },
}
