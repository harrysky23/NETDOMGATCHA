import { useState, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import {
  clearDrawCheckpoint,
  getDrawCheckpoint,
} from '../services/drawCheckpoint'
import './home-link.css'

/** 명시적인 홈 이동은 대기 화면에서 시작합니다. 미완료 추첨의 멱등 키는 보존합니다. */
export function HomeLink({ overlay = false }: { overlay?: boolean }) {
  const { session } = useSession()
  const [error, setError] = useState('')

  function beforeNavigate(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return
    try {
      if (session && getDrawCheckpoint(session)?.result)
        clearDrawCheckpoint(session)
    } catch {
      event.preventDefault()
      setError(
        '대기 화면으로 돌아가지 못했어요. 브라우저 저장 설정을 확인해 주세요.',
      )
    }
  }

  return (
    <>
      <Link
        className={`brand home-link ${overlay ? 'modal-home-link' : ''}`}
        to="/"
        reloadDocument
        onClick={beforeNavigate}
        aria-label="NET 첫 화면으로 돌아가기"
      >
        <span className="brand-word">
          NET<span className="brand-dot">.</span>
        </span>
      </Link>
      {error && (
        <p className="home-link-error" role="alert">
          {error}
        </p>
      )}
    </>
  )
}
