import { createContext, useContext, useState, type ReactNode } from 'react'
import type { ParticipantSession } from '../types'
import { readStorage, writeStorage } from '../services/storage'
import { api, apiMode } from '../services/api'
import { isParticipantSession } from '../services/validation'

const SESSION_KEY = apiMode === 'http' ? 'net:session:http:v1' : 'net:session:v1'
const DRAFT_KEY = 'net:nickname:v1'

function isSession(value: unknown): value is ParticipantSession {
  // 형식 검사만 수행합니다. 실제 토큰·소속 검증은 매 API 요청에서 서버가 수행합니다.
  return isParticipantSession(value) && (apiMode === 'http'
    ? !value.token.startsWith('mock-')
    : value.token.startsWith('mock-') && /^00000000-0000-4000-8000-00000000000[1-5]$/.test(value.participant.table_id))
}

interface SessionContextValue {
  session: ParticipantSession | null
  nickname: string
  setNickname: (nickname: string) => void
  enterTable: (tableId: string) => Promise<void>
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(() =>
    readStorage(SESSION_KEY, isSession),
  )
  const [nickname, updateNickname] = useState(
    () =>
      session?.participant.nickname ??
      readStorage(
        DRAFT_KEY,
        (value): value is string =>
          typeof value === 'string' &&
          !!value.trim() &&
          Array.from(value).length <= 12,
      ) ??
      '',
  )

  function setNickname(value: string) {
    writeStorage(DRAFT_KEY, value.trim())
    updateNickname(value.trim())
  }

  async function enterTable(tableId: string) {
    const next =
      session && session.participant.nickname === nickname
        ? await api.changeTable(session, tableId)
        : await api.createParticipant({ nickname, table_id: tableId })
    writeStorage(SESSION_KEY, next)
    setSession(next)
  }

  return (
    <SessionContext.Provider
      value={{ session, nickname, setNickname, enterTable }}
    >
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const value = useContext(SessionContext)
  if (!value) throw new Error('SessionProvider가 필요합니다.')
  return value
}
