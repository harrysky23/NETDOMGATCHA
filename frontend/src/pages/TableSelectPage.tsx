import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useResource } from '../hooks/useResource'
import { useSession } from '../hooks/useSession'
import { PageHeading } from '../components/PageHeading'
import { ErrorNotice, Loading } from '../components/Feedback'
import { Icon } from '../components/Icon'

export function TableSelectPage() {
  const { nickname, session, enterTable } = useSession()
  const [selected, setSelected] = useState(session?.participant.table_id ?? '')
  const [pending, setPending] = useState(false)
  const busy = useRef(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const load = useCallback(() => api.listTables(), [])
  const tables = useResource(load)

  async function enter() {
    if (!selected || busy.current) return
    busy.current = true
    setPending(true)
    setError('')
    try {
      await enterTable(selected)
      navigate('/table', { replace: true })
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : '입장하지 못했어요. 다시 시도해 주세요.',
      )
    } finally {
      busy.current = false
      setPending(false)
    }
  }

  return (
    <div className="container page-width">
      <PageHeading
        eyebrow="FIND YOUR TABLE"
        title={`${nickname}님, 어디에 앉으셨나요?`}
        description="함께 앉은 테이블을 선택하고 이야기를 시작해 보세요."
        back={session ? '/table' : '/'}
      />
      <div className="table-select-panel">
        <div className="panel-topline">
          <span>
            <Icon name="table" size={17} />
            테이블 선택
          </span>
          <span>총 5개 테이블</span>
        </div>
        {tables.loading && !tables.data ? (
          <Loading label="테이블을 준비하고 있어요." />
        ) : tables.error ? (
          <ErrorNotice
            message={tables.error}
            retry={() => {
              void tables.refresh()
            }}
          />
        ) : (
          <fieldset className="tables-grid" disabled={pending}>
            <legend className="sr-only">입장할 테이블을 선택하세요</legend>
            {tables.data?.map((table) => (
              <label
                key={table.id}
                className={`table-option ${selected === table.id ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="table"
                  value={table.id}
                  checked={selected === table.id}
                  onChange={() => setSelected(table.id)}
                />
                <span className="selection-check">
                  {selected === table.id && <Icon name="check" size={13} />}
                </span>
                <span className="table-drawing">
                  <Icon name="table" size={46} />
                </span>
                <span className="table-number">
                  {String(table.number).padStart(2, '0')}
                </span>
                <strong>{table.name}</strong>
                <small>
                  {session?.participant.table_id === table.id
                    ? '현재 참여 중'
                    : '이 테이블에 참여하기'}
                </small>
              </label>
            ))}
          </fieldset>
        )}
        <p className="table-help">
          <Icon name="info" size={16} />
          테이블마다 질문함이 따로 있어요. 나중에 변경할 수도 있어요.
        </p>
        {error && <ErrorNotice message={error} />}
        <button
          className="button button-primary table-enter"
          disabled={!selected || pending || !!tables.error || !tables.data}
          onClick={() => {
            void enter()
          }}
        >
          {pending ? (
            <>
              <span className="spinner" />
              입장하는 중...
            </>
          ) : (
            <>
              이 테이블로 입장하기
              <Icon name="arrow" />
            </>
          )}
        </button>
      </div>
      <p className="page-footnote">
        닉네임이 같아도 괜찮아요. 편하게 함께해 주세요.
      </p>
    </div>
  )
}
