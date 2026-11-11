import { useCallback, useRef, useState, type FormEvent } from 'react'
import { adminApi, api, apiMode } from '../services/api'
import { useResource } from '../hooks/useResource'
import { ErrorNotice, Loading } from '../components/Feedback'
import { Icon } from '../components/Icon'

export function AdminPage() {
  const [token, setToken] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const busy = useRef(false)
  const load = useCallback(() => api.listTables(), [])
  const tables = useResource(load)

  async function login(event: FormEvent) {
    event.preventDefault()
    if (busy.current) return
    busy.current = true
    setPending(true)
    setError('')
    try {
      setToken(await adminApi.login(password))
      setPassword('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '인증하지 못했어요.')
    } finally {
      busy.current = false
      setPending(false)
    }
  }

  async function add() {
    if (!token || busy.current) return
    busy.current = true
    setPending(true)
    setError('')
    setSuccess('')
    try {
      const table = await adminApi.addTable(token)
      await tables.refresh()
      setSuccess(`${table.name}을 추가했어요.`)
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : '테이블을 추가하지 못했어요.',
      )
    } finally {
      busy.current = false
      setPending(false)
    }
  }

  return (
    <div className="simple-form-page admin-page">
      <h1>테이블 관리</h1>
      {apiMode === 'mock' && (
        <p className="admin-mock-note">
          목업 관리자 화면입니다. 서버 인증은 아직 연결되지 않았고, 변경 사항은
          이 브라우저에만 저장됩니다.
        </p>
      )}
      {!token ? (
        <form className="admin-login" onSubmit={login}>
          {apiMode === 'http' && (
            <>
              <label className="simple-field-label" htmlFor="admin-password">
                관리자 비밀번호
              </label>
              <input
                id="admin-password"
                className="simple-input"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </>
          )}
          {error && <ErrorNotice message={error} />}
          <button className="button button-primary w-full" disabled={pending}>
            {pending
              ? '확인 중…'
              : apiMode === 'mock'
                ? '관리자 기능 미리보기'
                : '관리자 로그인'}
          </button>
        </form>
      ) : (
        <>
          <div className="admin-list-heading">
            <h2>테이블 {tables.data?.length ?? '…'}개</h2>
            <button
              className="text-button"
              onClick={() => {
                setToken(null)
                setSuccess('')
              }}
            >
              나가기
            </button>
          </div>
          {tables.loading && !tables.data ? (
            <Loading />
          ) : (
            <ul className="admin-table-list">
              {tables.data?.map((table) => (
                <li key={table.id}>
                  <span className="admin-table-number">
                    {String(table.number).padStart(2, '0')}
                  </span>
                  <strong>{table.name}</strong>
                </li>
              ))}
            </ul>
          )}
          {(error || tables.error) && (
            <ErrorNotice message={error || tables.error} />
          )}
          {success && (
            <p className="admin-success" role="status">
              <Icon name="check" size={16} />
              {success}
            </p>
          )}
          <button
            className="button button-primary w-full"
            disabled={pending || !tables.data}
            onClick={() => {
              void add()
            }}
          >
            {pending ? (
              <>
                <span className="spinner" />
                추가하는 중…
              </>
            ) : (
              <>
                <Icon name="table" size={19} />
                테이블 추가
              </>
            )}
          </button>
        </>
      )}
    </div>
  )
}
