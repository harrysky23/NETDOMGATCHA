import { useCallback, useEffect, useRef, useState } from 'react'
import type { DrawResult, ParticipantSession } from '../types'
import { api } from '../services/api'
import {
  clearDrawCheckpoint,
  getDrawCheckpoint,
  prepareDraw,
  saveDrawResult,
} from '../services/drawCheckpoint'

export type GachaPhase = 'IDLE' | 'REQUESTING' | 'PLAYING' | 'REVEAL'
const ownerId = (session: ParticipantSession | null) =>
  session ? `${session.participant.id}:${session.participant.table_id}` : ''

export function useGachaDraw(session: ParticipantSession | null) {
  const [saved] = useState(() => (session ? getDrawCheckpoint(session) : null))
  const [result, setResult] = useState<DrawResult | null>(saved?.result ?? null)
  const [phase, setPhase] = useState<GachaPhase>(
    saved?.result ? 'REVEAL' : 'IDLE',
  )
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')
  const [recovering, setRecovering] = useState(!!saved)
  const locked = useRef(!!saved?.result)
  const owner = useRef(session)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  useEffect(() => {
    if (ownerId(owner.current) === ownerId(session)) return
    owner.current = session
    const checkpoint = session ? getDrawCheckpoint(session) : null
    locked.current = !!checkpoint?.result
    setResult(checkpoint?.result ?? null)
    setPhase(checkpoint?.result ? 'REVEAL' : 'IDLE')
    setRecovering(!!checkpoint)
    setError('')
    setWarning('')
  }, [session])

  const start = useCallback(
    async (participant: ParticipantSession, skipVideo: boolean) => {
      if (locked.current) return
      owner.current = participant
      locked.current = true
      setError('')
      setWarning('')
      setPhase('REQUESTING')
      try {
        const checkpoint = prepareDraw(participant)
        const draw =
          checkpoint.result ??
          (await api.draw(
            participant,
            participant.participant.table_id,
            checkpoint.idempotencyKey,
          ))
        let storageWarning = ''
        try {
          saveDrawResult(participant, checkpoint.idempotencyKey, draw)
        } catch {
          storageWarning =
            '이 기기에 결과를 보관하지 못했어요. 추첨 기록에서도 확인할 수 있어요.'
        }
        if (
          mounted.current &&
          ownerId(owner.current) === ownerId(participant)
        ) {
          setResult(draw)
          setWarning(storageWarning)
          setPhase(skipVideo || !!checkpoint.result ? 'REVEAL' : 'PLAYING')
        }
      } catch (cause) {
        if (ownerId(owner.current) !== ownerId(participant)) return
        locked.current = false
        if (mounted.current) {
          setError(
            cause instanceof Error
              ? cause.message
              : '추첨하지 못했어요. 같은 요청으로 다시 확인해 주세요.',
          )
          setRecovering(!!getDrawCheckpoint(participant))
          setPhase('IDLE')
        }
      }
    },
    [],
  )

  const reveal = useCallback(
    () => setPhase((current) => (current === 'PLAYING' ? 'REVEAL' : current)),
    [],
  )
  const reset = useCallback(() => {
    if (!owner.current) return
    try {
      clearDrawCheckpoint(owner.current)
    } catch (cause) {
      setWarning(
        cause instanceof Error
          ? cause.message
          : '저장 정보를 정리하지 못했어요.',
      )
      return
    }
    locked.current = false
    setResult(null)
    setRecovering(false)
    setError('')
    setWarning('')
    setPhase('IDLE')
  }, [])
  return { phase, result, error, warning, recovering, start, reveal, reset }
}
