import type { NetApi } from './contracts'
import {
  ApiError,
  type EventTable,
  type ParticipantSession,
  type Question,
  type QuestionTarget,
} from '../types/index.ts'
import { readStorage, writeStorage } from './storage.ts'

export const TABLES: EventTable[] = Array.from({ length: 5 }, (_, index) => ({
  id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
  number: index + 1,
  name: `TABLE ${String(index + 1).padStart(2, '0')}`,
}))

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
  const table = TABLES.find((table) => table.id === id)
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

function isQuestions(value: unknown): value is Question[] {
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
    return TABLES.map((table) => ({ ...table }))
  },
  async createParticipant({ nickname, table_id }) {
    tableById(table_id)
    const trimmed = nickname.trim()
    if (!trimmed || Array.from(trimmed).length > 12)
      throw new ApiError('VALIDATION_ERROR', '닉네임은 1–12자로 입력해 주세요.')
    return {
      participant: { id: crypto.randomUUID(), nickname: trimmed, table_id },
      token: `mock-${crypto.randomUUID()}`,
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
    const remaining = questions.filter((q) => !q.is_drawn).length
    return {
      table: tableById(tableId),
      remaining_count: remaining,
      drawn_count: questions.length - remaining,
      total_count: questions.length,
    }
  },
  async submitQuestion(session, tableId, input) {
    checkAccess(session, tableId)
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
    const question: Question = {
      id: crypto.randomUUID(),
      table_id: tableId,
      content,
      target: input.target,
      is_drawn: false,
      created_at: new Date().toISOString(),
    }
    writeStorage(`net:mock:questions:v1:${tableId}`, [
      ...readQuestions(tableId),
      question,
    ])
    return question
  },
  async draw(session, tableId, _idempotencyKey) {
    checkAccess(session, tableId)
    throw new ApiError(
      'NOT_IMPLEMENTED',
      '실제 랜덤 추첨은 Phase 2 서버 연동 후 제공됩니다.',
    )
  },
  async getHistory(session, tableId) {
    checkAccess(session, tableId)
    return []
  },
  async getLatestDraw(session, tableId) {
    checkAccess(session, tableId)
    return null
  },
}
