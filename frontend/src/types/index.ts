export type QuestionTarget = 'senior' | 'junior' | 'all'

export interface EventTable {
  id: string
  number: number
  name: string
}

export interface Participant {
  id: string
  nickname: string
  table_id: string
}

export interface ParticipantSession {
  participant: Participant
  token: string
}

// 일반 참가자 응답에는 author_id를 포함하지 않습니다.
export interface Question {
  id: string
  table_id: string
  content: string
  target: QuestionTarget
  is_drawn: boolean
  created_at: string
}

export interface TableStatus {
  table: EventTable
  remaining_count: number
  drawn_count: number
  total_count: number
}

export interface DrawResult {
  id: string
  table_id: string
  question: Question
  drawn_at: string
}

export interface SubmitQuestionInput {
  content: string
  target: QuestionTarget
}

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'TABLE_ACCESS_DENIED'
  | 'TABLE_NOT_FOUND'
  | 'NO_QUESTIONS_AVAILABLE'
  | 'NOT_IMPLEMENTED'
  | 'STORAGE_UNAVAILABLE'
  | 'NETWORK_ERROR'
  | 'HTTP_ERROR'
  | 'INVALID_RESPONSE'

export class ApiError extends Error {
  readonly code: ApiErrorCode

  constructor(code: ApiErrorCode, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

export const TARGET_LABELS: Record<QuestionTarget, string> = {
  senior: '선배에게',
  junior: '후배에게',
  all: '모두에게',
}
