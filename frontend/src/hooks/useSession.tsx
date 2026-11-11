import { createContext, useContext, useState, type ReactNode } from 'react'
import type { ParticipantSession } from '../types'
import { readStorage, writeStorage } from '../services/storage'
import { api } from '../services/api'

const SESSION_KEY = 'net:session:v1'
const DRAFT_KEY = 'net:nickname:v1'

function isSession(value: unknown): value is ParticipantSession {
  if (!value || typeof value !== 'object') return false
  const session = value as Partial<ParticipantSession>
  return (
    typeof session.token === 'string' &&
    session.token.startsWith('mock-') &&
    !!session.participant &&
    typeof session.participant.id === 'string' &&
    typeof session.participant.nickname === 'string' &&
    !!session.participant.nickname.trim() &&
    Array.from(session.participant.nickname).length <= 12 &&
    /^00000000-0000-4000-8000-00000000000[1-5]$/.test(
      session.participant.table_id,
    )
  )
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
