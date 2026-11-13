import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { ErrorNotice } from '../components/Feedback'
import { Icon } from '../components/Icon'
import { MemberPass } from '../components/identity/MemberPass'
import './identity.css'

export function OnboardingPage({ editing = false }: { editing?: boolean }) {
  const { nickname, setNickname, identityError } = useSession()
  const [value, setValue] = useState(nickname)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const count = Array.from(value.trim()).length
  function submit(event: FormEvent) {
    event.preventDefault()
    try {
      setNickname(value)
      navigate('/', { replace: true, state: null })
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : '닉네임을 저장하지 못했어요.',
      )
    }
  }
  const Surface = editing ? 'section' : 'main'
  return (
    <Surface
      className="identity-screen member-pass-screen"
      data-editing={editing}
    >
      <div className="member-pass-stage">
        <MemberPass editing={editing}>
          <form onSubmit={submit}>
            <label className="member-nickname-label" htmlFor="visitor-nickname">
              닉네임
            </label>
            <input
              id="visitor-nickname"
              className="member-nickname-input"
              value={value}
              onChange={(event) => {
                setValue(event.target.value)
                setError('')
              }}
              placeholder="닉네임을 적어 주세요"
              autoComplete="nickname"
              maxLength={24}
              required
              aria-invalid={count > 12 || !!error}
              aria-describedby={`visitor-nickname-hint ${error || identityError ? 'visitor-nickname-error' : ''}`}
            />
            <p id="visitor-nickname-hint" className="identity-input-hint">
              <span>1–12자</span> <span>{count}/12</span>
            </p>
            <button
              className="member-enter-button"
              type="submit"
              disabled={!count || count > 12}
            >
              {editing ? '변경하기' : '입장하기'}
              <Icon name="arrow" size={18} />
            </button>
          </form>
        </MemberPass>
        {(error || identityError) && (
          <div className="member-pass-error" id="visitor-nickname-error">
            <ErrorNotice message={error || identityError} />
          </div>
        )}
        {editing ? (
          <Link to="/" className="identity-back">
            머신으로 돌아가기
          </Link>
        ) : (
          <p className="identity-footnote">
            닉네임은 한 번만, 질문은 익명으로.
            <br />
            오늘의 이야기를 함께 시작해요.
          </p>
        )}
      </div>
    </Surface>
  )
}
