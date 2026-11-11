import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { GachaMachine } from '../components/GachaMachine'
import { Icon, type IconName } from '../components/Icon'
import { ErrorNotice } from '../components/Feedback'
import { useSession } from '../hooks/useSession'

const steps: {
  number: string
  title: string
  description: string
  icon: IconName
}[] = [
  {
    number: '01',
    title: '우리 테이블에 모여요',
    description: '함께 앉은 테이블을 선택해 주세요.',
    icon: 'table',
  },
  {
    number: '02',
    title: '궁금한 마음을 담아요',
    description: '선배와 후배에게 익명으로 질문해요.',
    icon: 'pen',
  },
  {
    number: '03',
    title: '뽑고, 함께 이야기해요',
    description: '랜덤 캡슐이 대화의 시작을 열어줘요.',
    icon: 'sparkles',
  },
]

export function LandingPage() {
  const { nickname, setNickname, session } = useSession()
  const [input, setInput] = useState(nickname)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function submit(event: FormEvent) {
    event.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || Array.from(trimmed).length > 12) {
      setError('닉네임을 1–12자로 입력해 주세요.')
      return
    }
    try {
      setNickname(trimmed)
      navigate(session?.participant.nickname === trimmed ? '/table' : '/tables')
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : '입장 정보를 저장하지 못했어요.',
      )
    }
  }

  return (
    <div className="landing container">
      <section className="landing-hero">
        <div className="hero-copy">
          <div className="hero-badge">
            <span className="status-dot" />
            NET OB총회 <span className="badge-separator">/</span> RANDOM CAPSULE
          </div>
          <h1>
            오랜만의 만남,
            <br />
            <span>새로운 이야기.</span>
          </h1>
          <p className="hero-description">
            무슨 말을 꺼낼지 고민하지 마세요.
            <br />
            작은 캡슐 하나가, 우리를 조금 더 가깝게.
          </p>
          <form className="entry-form" onSubmit={submit}>
            <label htmlFor="nickname">
              오늘, 어떤 이름으로 만날까요?
              <span>가입 없이 가볍게 시작해요</span>
            </label>
            <div className="nickname-input">
              <Icon name="users" size={19} />
              <input
                id="nickname"
                name="nickname"
                value={input}
                onChange={(event) => {
                  setInput(event.target.value)
                  setError('')
                }}
                placeholder="닉네임을 입력해 주세요"
                autoComplete="nickname"
                maxLength={24}
                required
                aria-describedby="nickname-hint"
                aria-invalid={!!error}
              />
              <span>{Array.from(input).length}/12</span>
            </div>
            <span className="sr-only" id="nickname-hint">
              닉네임은 앞뒤 공백을 제외한 1자 이상 12자 이하로 입력하세요.
            </span>
            {error && <ErrorNotice message={error} />}
            <button
              className="button button-primary entry-button"
              type="submit"
            >
              {session?.participant.nickname === input.trim()
                ? '이어서 참여하기'
                : '입장하기'}
              <Icon name="arrow" size={20} />
            </button>
            <p className="entry-hint">
              <Icon name="lock" size={13} />
              질문은 익명으로, 이야기는 자유롭게
            </p>
          </form>
        </div>
        <div className="hero-visual">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="floating-note note-one">
            <span className="note-dot lavender" />
            선배에게 궁금했던 이야기
            <Icon name="sparkles" size={13} />
          </div>
          <GachaMachine />
          <div className="floating-note note-two">
            <span className="note-dot blue" />
            캡슐 속에 담긴, 우리의 연결<span className="note-heart">♡</span>
          </div>
          <span className="visual-caption">
            A LITTLE QUESTION. A NEW CONNECTION.
          </span>
        </div>
      </section>
      <section className="how-section" aria-labelledby="how-title">
        <div className="section-label">
          <span className="eyebrow">LET’S CONNECT</span>
          <h2 id="how-title">가까워지는 방법, 어렵지 않아요.</h2>
          <span className="small muted">딱 세 단계면 충분해요.</span>
        </div>
        <div className="steps-grid">
          {steps.map((step) => (
            <div className="step-card" key={step.number}>
              <div className="step-icon">
                <Icon name={step.icon} size={22} />
              </div>
              <div>
                <span className="step-number">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
              <span className="step-corner">↗</span>
            </div>
          ))}
        </div>
      </section>
      <div className="landing-bottom">
        <span className="tiny-star">✦</span>
        <p>같은 NET, 다른 시간. 오늘은 하나의 테이블에서.</p>
        <span className="tiny-star">✦</span>
      </div>
    </div>
  )
}
