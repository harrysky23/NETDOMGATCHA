export type QuestionTarget = 'senior' | 'junior' | 'all'

/** 브라우저 식별용 정보이며 인증 자격 증명이 아닙니다. */
export interface VisitorProfile {
  visitorId: string
  nickname: string
}

export interface EventTable {
  id: string
  number: number
  name: string
}

export interface Participant {
  id: string
  nickname: string
  table_id: string
  visitor_id?: string // 기존 참가자 세션은 첫 쓰기 요청 전에 연결합니다.
}

export interface ParticipantSession {
  participant: Participant
  token: string
}

// 일반 참가자 응답에는 author_id를 포함하지 않습니다.
export const STICKER_IDS = [
  'heart-envelope',
  'diamond',
  'strawberry-milk',
  'net-ticket',
  'question-mark',
  'stars',
  'pixel-cursor',
  'ribbon-star',
  'clover-cat',
] as const
export type StickerId = (typeof STICKER_IDS)[number]
export interface StickerPosition {
  /** 편지지 전체 크기에 대한 중심 좌표(0–1). 화면 크기와 무관하게 복원합니다. */
  x: number
  y: number
  rotation: number
}
export interface PlacedSticker extends StickerPosition {
  id: StickerId
}
export interface QuestionDecoration {
  version: 1
  paper: 'lined'
  target_badge?: StickerPosition
  stickers: PlacedSticker[]
}

export interface Question {
  id: string
  table_id: string
  content: string
  target: QuestionTarget
  decoration?: QuestionDecoration | null
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

export interface QuestionDraft {
  decoration?: QuestionDecoration | null
  content: string
  target: QuestionTarget
}

export interface SubmitQuestionInput extends QuestionDraft, VisitorProfile {}

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
