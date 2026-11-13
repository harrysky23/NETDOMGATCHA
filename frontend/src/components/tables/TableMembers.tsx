import { useCallback } from 'react'
import { useSession } from '../../hooks/useSession'
import { useResource } from '../../hooks/useResource'
import { api } from '../../services/api'
import { ApiError } from '../../types'
import { Icon } from '../Icon'

export function TableMembers() {
  const { selectedTableId, nickname, session, ensureParticipant } = useSession()
  const load = useCallback(async () => {
    if (!selectedTableId) return { tableId: '', people: [] }
    // 조회/저장소 갱신만으로 다른 탭의 소속을 다시 변경하지 않습니다.
    const joined =
      session &&
      session.participant.table_id === selectedTableId &&
      session.participant.nickname === nickname
        ? session
        : await ensureParticipant(selectedTableId)
    try {
      return {
        tableId: selectedTableId,
        people: await api.listParticipants(joined, selectedTableId),
      }
    } catch (cause) {
      if (!(cause instanceof ApiError) || cause.code !== 'UNAUTHORIZED')
        throw cause
      const renewed = await ensureParticipant(selectedTableId)
      return {
        tableId: selectedTableId,
        people: await api.listParticipants(renewed, selectedTableId),
      }
    }
  }, [
    selectedTableId,
    nickname,
    session?.token,
    session?.participant.id,
    session?.participant.table_id,
    session?.participant.nickname,
    ensureParticipant,
  ])
  const members = useResource(load)
  const people =
    members.data?.tableId === selectedTableId ? members.data.people : []
  return (
    <div className="table-members" aria-label="이 테이블의 참가자">
      <Icon name="users" size={16} />
      <div className="table-members-names" aria-live="polite">
        {members.error ? (
          <span className="member-error">참가자 목록을 불러오지 못했어요</span>
        ) : people.length ? (
          people.map((p) => (
            <span
              className="table-member"
              key={p.id}
              data-self={p.id === session?.participant.id}
            >
              {p.nickname}
              {p.id === session?.participant.id ? ' (나)' : ''}
            </span>
          ))
        ) : (
          <span>{members.loading ? '입장 중…' : '아직 참가자가 없어요'}</span>
        )}
      </div>
      <button
        type="button"
        className="members-refresh"
        aria-label="테이블 참가자 새로고침"
        disabled={members.loading}
        onClick={() => void members.refresh()}
      >
        <Icon name="refresh" size={15} />
      </button>
    </div>
  )
}
