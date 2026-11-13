import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { useResource } from '../hooks/useResource'
import { api } from '../services/api'
import { Icon } from './Icon'
import { HomeLink } from './HomeLink'
import { GroupTableDialog } from './tables/GroupTableDialog'
import { TableMembers } from './tables/TableMembers'
import './tables/group-tables.css'

export function Layout() {
  const { selectedTableId, selectTable, pending } = useSession()
  const location = useLocation()
  const load = useCallback(() => api.listTables(), [])
  const tables = useResource(load)
  const [manageOpen, setManageOpen] = useState(false)
  const [error, setError] = useState('')
  const content = useRef<HTMLElement>(null)
  const admin = location.pathname === '/admin'
  const validTable = tables.data?.some((table) => table.id === selectedTableId)
    ? selectedTableId
    : ''

  useEffect(() => {
    window.scrollTo(0, 0)
    content.current?.focus({ preventScroll: true })
    const titles: Record<string, string> = {
      '/': '캡슐 뽑기',
      '/questions': '질문 넣기',
      '/questions/list': '질문 목록',
      '/history': '추첨 기록',
      '/admin': '테이블 관리',
      '/profile': '닉네임 변경',
    }
    document.title = `NET — ${titles[location.pathname] ?? '페이지를 찾을 수 없어요'}`
    void tables.refresh()
  }, [location.pathname, tables.refresh])

  return (
    <div
      className={`app-shell simple-shell machine-shell ${selectedTableId && !admin ? 'has-table-members' : ''}`}
    >
      <a className="skip-link" href="#main-content">
        본문으로 바로가기
      </a>
      <header className="simple-header">
        <HomeLink />
        {admin ? (
          <Link to="/" className="simple-back">
            <Icon name="back" size={16} />
            머신으로
          </Link>
        ) : (
          <div className="simple-header-actions">
            <Link
              className="question-list-link"
              to="/questions/list"
              aria-current={
                location.pathname === '/questions/list' ? 'page' : undefined
              }
              aria-label="현재 테이블 질문 목록 보기"
            >
              <Icon name="history" size={16} />
              <span>질문함</span>
            </Link>
            <div className="compact-table-select">
              <label className="sr-only" htmlFor="event-table">
                참여할 테이블
              </label>
              <select
                id="event-table"
                value={validTable}
                disabled={pending || !tables.data}
                onChange={(event) => {
                  const id = event.target.value
                  setError('')
                  void selectTable(id).catch((cause) =>
                    setError(
                      cause instanceof Error
                        ? cause.message
                        : '테이블을 변경하지 못했어요.',
                    ),
                  )
                }}
              >
                <option value="" disabled>
                  {tables.loading && !tables.data
                    ? '불러오는 중…'
                    : '테이블 선택'}
                </option>
                {tables.data?.map((table) => (
                  <option value={table.id} key={table.id}>
                    {table.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="group-manage-trigger"
              aria-label="그룹 테이블 추가 또는 이름 변경"
              onClick={() => setManageOpen(true)}
            >
              +
            </button>
          </div>
        )}
      </header>
      {selectedTableId && !admin && <TableMembers />}
      <GroupTableDialog
        open={manageOpen}
        current={tables.data?.find((t) => t.id === selectedTableId)}
        onClose={() => setManageOpen(false)}
        onSaved={(table, created) => {
          setManageOpen(false)
          void (async () => {
            await tables.refresh()
            if (created) await selectTable(table.id)
          })().catch((cause) =>
            setError(
              cause instanceof Error
                ? cause.message
                : '그룹은 저장했지만 입장하지 못했어요. 테이블을 다시 선택해 주세요.',
            ),
          )
        }}
      />
      {(error || tables.error) && (
        <div className="simple-header-error" role="alert">
          <span>{error || tables.error}</span>
          <button
            className="text-button"
            onClick={() => {
              setError('')
              void tables.refresh()
            }}
          >
            다시 확인
          </button>
        </div>
      )}
      <main id="main-content" ref={content} tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  )
}
