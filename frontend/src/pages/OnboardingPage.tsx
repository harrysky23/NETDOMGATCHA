import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { ErrorNotice } from '../components/Feedback'
import { Icon } from '../components/Icon'
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
  return (
    <main className="identity-screen">
      <section className="identity-panel" aria-labelledby="identity-title">
        <span className="identity-brand" aria-label="NET">
          NET<span>.</span>
        </span>
        <p className="identity-eyebrow">NET OB총회</p>
        <h1 id="identity-title">
          {editing ? (
            '어떤 이름으로 만날까요?'
          ) : (
            <>
              반가워요,
              <br />
              오늘의 이야기를 시작해요.
            </>
          )}
        </h1>
        <p className="identity-intro">
          {editing
            ? '같은 방문자 정보로 닉네임만 바꿔요.'
            : '닉네임은 처음 한 번만 입력하면 돼요.'}
        </p>
        <form onSubmit={submit}>
          <label className="simple-field-label" htmlFor="visitor-nickname">
            닉네임
          </label>
          <input
            id="visitor-nickname"
            className="simple-input"
            value={value}
            onChange={(event) => {
              setValue(event.target.value)
              setError('')
            }}
            placeholder="어떤 이름으로 불러드릴까요?"
            autoComplete="nickname"
            maxLength={24}
            required
            aria-invalid={count > 12 || !!error}
            aria-describedby="visitor-nickname-hint"
          />
          <p id="visitor-nickname-hint" className="identity-input-hint">
            1–12자 · 앞뒤 공백은 제외해요. <span>{count}/12</span>
          </p>
          {(error || identityError) && (
            <ErrorNotice message={error || identityError} />
          )}
          <button
            className="button button-primary w-full"
            type="submit"
            disabled={!count || count > 12}
          >
            {editing ? '닉네임 변경' : '입장하기'}
            <Icon name="arrow" size={18} />
          </button>
        </form>
        {editing ? (
          <Link to="/" className="identity-back">
            머신으로 돌아가기
          </Link>
        ) : (
          <p className="identity-footnote">
            질문은 익명으로 전해져요.
            <br />
            입장 정보는 이 브라우저에 저장돼요.
          </p>
        )}
      </section>
    </main>
  )
}
