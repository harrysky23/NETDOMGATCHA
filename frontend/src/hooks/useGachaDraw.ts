import { useCallback, useEffect, useRef, useState } from 'react'
import type { DrawResult, ParticipantSession } from '../types'
import { api } from '../services/api'
import { clearDrawCheckpoint, getDrawCheckpoint, prepareDraw, saveDrawResult } from '../services/drawCheckpoint'

export type GachaPhase = 'IDLE' | 'REQUESTING' | 'PLAYING' | 'REVEAL'

export function useGachaDraw(session: ParticipantSession) {
  const [saved] = useState(() => getDrawCheckpoint(session))
  const [result, setResult] = useState<DrawResult | null>(saved?.result ?? null)
  const [phase, setPhase] = useState<GachaPhase>(saved?.result ? 'REVEAL' : 'IDLE')
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')
  const [recovering, setRecovering] = useState(!!saved)
  const locked = useRef(!!saved?.result)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const start = useCallback(async (skipVideo: boolean) => {
    if (locked.current) return
    locked.current = true
    setError('')
    setWarning('')
    setPhase('REQUESTING')
    try {
      const checkpoint = prepareDraw(session)
      const draw = checkpoint.result ?? await api.draw(session, session.participant.table_id, checkpoint.idempotencyKey)
      // 컴포넌트 이탈 후에도 완료된 요청의 결과를 보존합니다.
      let storageWarning = ''
      try { saveDrawResult(session, checkpoint.idempotencyKey, draw) }
      catch { storageWarning = '이 기기에 결과를 보관하지 못했어요. 테이블의 추첨 기록에서도 확인할 수 있어요.' }
      if (mounted.current) {
        setResult(draw)
        setWarning(storageWarning)
        setPhase(skipVideo || !!checkpoint.result ? 'REVEAL' : 'PLAYING')
      }
    } catch (cause) {
      locked.current = false
      if (mounted.current) {
        setError(cause instanceof Error ? cause.message : '추첨하지 못했어요. 같은 요청으로 다시 확인해 주세요.')
        setRecovering(!!getDrawCheckpoint(session))
        setPhase('IDLE')
      }
    }
  }, [session])

  const reveal = useCallback(() => setPhase(current => current === 'PLAYING' ? 'REVEAL' : current), [])
  const reset = useCallback(() => {
    try { clearDrawCheckpoint(session) }
    catch (cause) { setWarning(cause instanceof Error ? cause.message : '저장 정보를 정리하지 못했어요.'); return }
    locked.current = false
    setResult(null)
    setRecovering(false)
    setError('')
    setWarning('')
    setPhase('IDLE')
  }, [session])

  return { phase, result, error, warning, recovering, start, reveal, reset }
}
