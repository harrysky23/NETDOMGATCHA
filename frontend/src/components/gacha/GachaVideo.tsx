import { useEffect, useRef, useState } from 'react'
import { Icon } from '../Icon'

interface Props {
  src: string
  poster: string
  status: 'idle' | 'playing' | 'revealed'
  onEnded: () => void
  onGlow: () => void
  onFallback: () => void
}

/** 영상 재생만 담당합니다. 어떤 오류에서도 새 추첨 요청을 실행하지 않습니다. */
export function GachaVideo({ src, poster, status, onEnded, onGlow, onFallback }: Props) {
  const video = useRef<HTMLVideoElement>(null)
  const [failure, setFailure] = useState('')
  const [waiting, setWaiting] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const lastProgress = useRef(0)
  const lastTime = useRef(0)
  const glowStarted = useRef(false)

  useEffect(() => {
    const element = video.current
    if (!element) return
    let cancelled = false
    if (status !== 'playing') {
      element.pause()
      if (status === 'idle') {
        element.currentTime = 0
        setFailure('')
        setWaiting(false)
        glowStarted.current = false
      }
      return
    }
    setFailure('')
    setWaiting(true)
    lastProgress.current = Date.now()
    lastTime.current = 0
    element.currentTime = 0
    element.muted = true
    element.play().catch(() => {
      if (!cancelled) setFailure('영상을 자동으로 재생하지 못했어요.')
    })
    const watchdog = window.setInterval(() => {
      if (Date.now() - lastProgress.current > 10_000) {
        element.pause()
        setFailure('영상 연결이 잠시 멈췄어요. 추첨한 질문은 안전하게 준비되어 있어요.')
      }
    }, 1000)
    return () => { cancelled = true; window.clearInterval(watchdog); element.pause() }
  }, [status, attempt])

  return <>
    <video ref={video} className="gacha-film" src={src} poster={poster}
      muted playsInline preload="auto" disablePictureInPicture disableRemotePlayback
      controls={false} aria-hidden="true"
      onPlaying={() => { setWaiting(false); lastProgress.current = Date.now() }}
      onWaiting={() => setWaiting(true)}
      onError={() => { if (status === 'playing') setFailure('이 브라우저에서 영상을 불러오지 못했어요.') }}
      onEnded={() => { if (status === 'playing') onEnded() }}
      onTimeUpdate={event => {
        if (status !== 'playing') return
        const element = event.currentTarget
        if (element.currentTime > lastTime.current + .005) {
          lastProgress.current = Date.now()
          lastTime.current = element.currentTime
        }
        // 원본을 끝까지 재생하고 마지막 0.45초의 빛으로 카드 전환을 연결합니다.
        if (Number.isFinite(element.duration) && element.duration - element.currentTime < .45 && !glowStarted.current) {
          glowStarted.current = true
          onGlow()
        }
      }} />
    {status === 'playing' && !failure && <div className="film-status" role="status">
      {waiting ? <><span className="spinner" />영상을 준비하고 있어요…</> : <><Icon name="sparkles" size={15} />캡슐 속 이야기를 꺼내는 중</>}
    </div>}
    {status === 'playing' && failure && <div className="film-fallback" role="alert"><div className="film-fallback-card"><Icon name="info" size={28} /><h2>질문은 이미 뽑았어요!</h2><p>{failure}</p><button className="button button-primary w-full" onClick={onFallback}>추첨한 질문 바로 보기<Icon name="arrow" size={18} /></button><button className="button button-ghost w-full" onClick={() => { video.current?.load(); setAttempt(value => value + 1) }}>영상만 다시 재생하기</button></div></div>}
  </>
}
