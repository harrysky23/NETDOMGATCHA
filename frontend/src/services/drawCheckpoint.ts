import type { DrawResult, ParticipantSession } from '../types/index.ts'
import { readStorage, writeStorage } from './storage.ts'
import { isDrawResult } from './validation.ts'

export interface DrawCheckpoint {
  idempotencyKey: string
  result: DrawResult | null
}

function storageKey(session: ParticipantSession) {
  return `net:draw:v1:${session.participant.id}:${session.participant.table_id}`
}

export function getDrawCheckpoint(session: ParticipantSession): DrawCheckpoint | null {
  return readStorage(storageKey(session), (value): value is DrawCheckpoint => {
    if (!value || typeof value !== 'object') return false
    const checkpoint = value as Partial<DrawCheckpoint>
    return typeof checkpoint.idempotencyKey === 'string' && !!checkpoint.idempotencyKey
      && (checkpoint.result === null || (isDrawResult(checkpoint.result)
        && checkpoint.result.table_id === session.participant.table_id))
  })
}

/** 네트워크 재시도·새로고침 시 최초 키를 재사용합니다. 저장 실패 시 요청하지 않습니다. */
export function prepareDraw(session: ParticipantSession): DrawCheckpoint {
  const saved = getDrawCheckpoint(session)
  if (saved) return saved
  const checkpoint = { idempotencyKey: crypto.randomUUID(), result: null }
  writeStorage(storageKey(session), checkpoint)
  return checkpoint
}

export function saveDrawResult(session: ParticipantSession, idempotencyKey: string, result: DrawResult) {
  writeStorage(storageKey(session), { idempotencyKey, result })
}

export function clearDrawCheckpoint(session: ParticipantSession) {
  writeStorage(storageKey(session), null)
}
