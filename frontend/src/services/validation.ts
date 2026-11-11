import type { DrawResult, ParticipantSession, Question } from '../types/index.ts'

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function isQuestion(value: unknown): value is Question {
  return isObject(value) && typeof value.id === 'string'
    && typeof value.table_id === 'string' && typeof value.content === 'string'
    && !!value.content.trim() && Array.from(value.content).length <= 200
    && ['senior', 'junior', 'all'].includes(String(value.target))
    && typeof value.is_drawn === 'boolean' && typeof value.created_at === 'string'
}

export function isDrawResult(value: unknown): value is DrawResult {
  return isObject(value) && typeof value.id === 'string'
    && typeof value.table_id === 'string' && typeof value.drawn_at === 'string'
    && isQuestion(value.question) && value.question.table_id === value.table_id
}

export function isParticipantSession(value: unknown): value is ParticipantSession {
  return isObject(value) && typeof value.token === 'string' && !!value.token
    && isObject(value.participant) && typeof value.participant.id === 'string'
    && typeof value.participant.nickname === 'string' && !!value.participant.nickname.trim()
    && Array.from(value.participant.nickname).length <= 12
    && typeof value.participant.table_id === 'string'
}
