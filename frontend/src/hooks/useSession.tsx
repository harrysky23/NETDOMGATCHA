import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  ApiError,
  type ParticipantSession,
  type VisitorProfile,
  type QuestionDraft,
  type Question,
} from '../types'
import { readStorage, writeStorage } from '../services/storage'
import { api, apiMode } from '../services/api'
import { isParticipantSession } from '../services/validation'
import { getMockTables } from '../services/tableStore'
import {
  bootstrapVisitor,
  readVisitorProfile,
  saveVisitorNickname,
  VISITOR_ID_KEY,
  VISITOR_PROFILE_KEY,
} from '../services/visitorProfile'

const SESSION_KEY =
  apiMode === 'http' ? 'net:session:http:v1' : 'net:session:v1'
const TABLE_KEY = `net:selected-table:${apiMode}:v1`
function isSession(value: unknown): value is ParticipantSession {
  return (
    isParticipantSession(value) &&
    (apiMode === 'http'
      ? !value.token.startsWith('mock-')
      : value.token.startsWith('mock-') &&
        getMockTables().some((t) => t.id === value.participant.table_id))
  )
}
interface SessionContextValue {
  ready: boolean
  identityError: string
  profile: VisitorProfile | null
  session: ParticipantSession | null
  nickname: string
  selectedTableId: string
  pending: boolean
  setNickname: (value: string) => void
  selectTable: (id: string) => Promise<void>
  enterTable: (id: string) => Promise<ParticipantSession>
  ensureParticipant: (id: string) => Promise<ParticipantSession>
  submitQuestion: (tableId: string, draft: QuestionDraft) => Promise<Question>
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
        (v): v is string =>
          typeof v === 'string' &&
          (apiMode === 'http' || getMockTables().some((t) => t.id === v)),
      ) ??
      '',
  )
  const [profile, setProfile] = useState<VisitorProfile | null>(null)
  const [ready, setReady] = useState(false)
  const [identityError, setIdentityError] = useState('')
  const [pending, setPending] = useState(false)
  const profileRef = useRef(profile)
  const sessionRef = useRef(session)
  const queue = useRef<Promise<unknown>>(Promise.resolve())
  const requests = useRef(0)

  useEffect(() => {
    function restore() {
      try {
        const identity = bootstrapVisitor()
        profileRef.current = identity.profile
        setProfile(identity.profile)
        setIdentityError('')
        const saved = readStorage(SESSION_KEY, isSession)
        const compatible =
          !saved?.participant.visitor_id ||
          saved.participant.visitor_id === identity.profile?.visitorId
        sessionRef.current = compatible ? saved : null
        setSession(sessionRef.current)
      } catch (cause) {
        profileRef.current = null
        setProfile(null)
        setIdentityError(
          cause instanceof Error ? cause.message : '입장 정보를 읽지 못했어요.',
        )
      } finally {
        setReady(true)
      }
    }
    restore()
    const onStorage = (event: StorageEvent) => {
      if (
        event.key === null ||
        event.key === VISITOR_ID_KEY ||
        event.key === VISITOR_PROFILE_KEY
      )
        restore()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const setNickname = useCallback((value: string) => {
    const next = saveVisitorNickname(value)
    profileRef.current = next
    setProfile(next)
    setIdentityError('')
    // 서버의 닉네임은 다음 ensureParticipant에서 같은 참가자 ID/토큰으로 동기화합니다.
  }, [])

  const ensureParticipant = useCallback(
    (tableId: string): Promise<ParticipantSession> => {
      requests.current++
      setPending(true)
      const operation = queue.current.then(async () => {
        const currentProfile = readVisitorProfile()
        if (
          !currentProfile ||
          currentProfile.visitorId !== profileRef.current?.visitorId
        ) {
          profileRef.current = null
          setProfile(null)
          throw new ApiError(
            'UNAUTHORIZED',
            '방문자 정보가 없거나 손상됐어요. 닉네임을 다시 입력해 주세요.',
          )
        }
        let next = sessionRef.current
        if (
          next?.participant.visitor_id &&
          next.participant.visitor_id !== currentProfile.visitorId
        )
          next = null
        if (next) {
          try {
            next = await api.getParticipant(next)
          } catch (cause) {
            if (cause instanceof ApiError && cause.code === 'UNAUTHORIZED')
              next = null
            else throw cause
          }
        }
        if (!next)
          next = await api.createParticipant({
            ...currentProfile,
            table_id: tableId,
          })
        else {
          if (
            next.participant.visitor_id !== currentProfile.visitorId ||
            next.participant.nickname !== currentProfile.nickname
          )
            next = await api.updateParticipantProfile(next, currentProfile)
          if (next.participant.table_id !== tableId)
            next = await api.changeTable(next, tableId)
        }
        if (profileRef.current?.visitorId !== currentProfile.visitorId)
          throw new ApiError(
            'UNAUTHORIZED',
            '방문자 정보가 변경됐어요. 다시 입장해 주세요.',
          )
        if (next.participant.visitor_id !== currentProfile.visitorId)
          throw new ApiError(
            'INVALID_RESPONSE',
            '서버의 방문자 연결 정보를 확인하지 못했어요.',
          )
        writeStorage(SESSION_KEY, next)
        writeStorage(TABLE_KEY, tableId)
        sessionRef.current = next
        setSession(next)
        setSelectedTableId(tableId)
        return next
      })
      queue.current = operation.catch(() => undefined)
      return operation.finally(() => {
        requests.current--
        if (!requests.current) setPending(false)
      })
    },
    [],
  )

  const selectTable = useCallback(
    async (tableId: string) => {
      await ensureParticipant(tableId)
    },
    [ensureParticipant],
  )

  const submitQuestion = useCallback(
    async (tableId: string, draft: QuestionDraft) => {
      const participant = await ensureParticipant(tableId)
      const author = readVisitorProfile()
      if (
        !author ||
        author.visitorId !== participant.participant.visitor_id ||
        author.nickname !== participant.participant.nickname
      )
        throw new ApiError(
          'UNAUTHORIZED',
          '입장 정보가 변경됐어요. 질문을 다시 제출해 주세요.',
        )
      return api.submitQuestion(participant, tableId, { ...draft, ...author })
    },
    [ensureParticipant],
  )

  return (
    <SessionContext.Provider
      value={{
        ready,
        identityError,
        profile,
        session,
        nickname: profile?.nickname ?? '',
        selectedTableId,
        pending,
        setNickname,
        selectTable,
        enterTable: ensureParticipant,
        ensureParticipant,
        submitQuestion,
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
