import { createContext, useContext, useState, type ReactNode } from 'react'
import type { ParticipantSession } from '../types'
import { readStorage, writeStorage } from '../services/storage'
import { api, apiMode } from '../services/api'
import { isParticipantSession } from '../services/validation'
import { getMockTables } from '../services/tableStore'

const SESSION_KEY =
  apiMode === 'http' ? 'net:session:http:v1' : 'net:session:v1'
const TABLE_KEY = `net:selected-table:${apiMode}:v1`
const DRAFT_KEY = 'net:nickname:v1'

function isSession(value: unknown): value is ParticipantSession {
  return (
    isParticipantSession(value) &&
    (apiMode === 'http'
      ? !value.token.startsWith('mock-')
      : value.token.startsWith('mock-') &&
        getMockTables().some(
          (table) => table.id === value.participant.table_id,
        ))
  )
}

interface SessionContextValue {
  session: ParticipantSession | null
  nickname: string
  selectedTableId: string
  pending: boolean
  setNickname: (nickname: string) => void
  selectTable: (tableId: string) => Promise<void>
  enterTable: (tableId: string) => Promise<ParticipantSession>
  ensureParticipant: (
    tableId: string,
    nickname?: string,
  ) => Promise<ParticipantSession>
}
const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(() =>
    readStorage(SESSION_KEY, isSession),
  )
  const [selectedTableId, setSelectedTableId] = useState(
    () =>
      session?.participant.table_id ??
      readStorage(
        TABLE_KEY,
        (value): value is string =>
          typeof value === 'string' &&
          (apiMode === 'http' ||
            getMockTables().some((table) => table.id === value)),
      ) ??
      '',
  )
  const [nickname, updateNickname] = useState(
    () =>
      readStorage(
        DRAFT_KEY,
        (value): value is string =>
          typeof value === 'string' &&
          !!value.trim() &&
          Array.from(value).length <= 12,
      ) ??
      (session?.participant.nickname === '게스트'
        ? ''
        : session?.participant.nickname) ??
      '',
  )
  const [pending, setPending] = useState(false)

  function setNickname(value: string) {
    writeStorage(DRAFT_KEY, value.trim())
    updateNickname(value.trim())
  }

  async function ensureParticipant(
    tableId: string,
    requestedNickname?: string,
  ) {
    setPending(true)
    try {
      const name =
        requestedNickname?.trim() ||
        nickname ||
        session?.participant.nickname ||
        '게스트'
      const next =
        session && (!requestedNickname || name === session.participant.nickname)
          ? session.participant.table_id === tableId
            ? session
            : await api.changeTable(session, tableId)
          : await api.createParticipant({ nickname: name, table_id: tableId })
      writeStorage(SESSION_KEY, next)
      writeStorage(TABLE_KEY, tableId)
      if (requestedNickname) setNickname(name)
      setSession(next)
      setSelectedTableId(tableId)
      return next
    } finally {
      setPending(false)
    }
  }

  async function selectTable(tableId: string) {
    if (session) {
      await ensureParticipant(tableId)
      return
    }
    writeStorage(TABLE_KEY, tableId)
    setSelectedTableId(tableId)
  }

  return (
    <SessionContext.Provider
      value={{
        session,
        nickname,
        selectedTableId,
        pending,
        setNickname,
        selectTable,
        enterTable: (tableId) => ensureParticipant(tableId),
        ensureParticipant,
      }}
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
