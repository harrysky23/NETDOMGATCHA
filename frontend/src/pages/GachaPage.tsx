import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ErrorNotice } from '../components/Feedback'
import { GachaExperience } from '../components/gacha/GachaExperience'
import { MachineHotspots } from '../components/gacha/MachineHotspots'
import { QuestionSheet } from '../components/gacha/QuestionSheet'
import { useSession } from '../hooks/useSession'
import { useGachaDraw } from '../hooks/useGachaDraw'
import { apiMode } from '../services/api'
import { readStorage, writeStorage } from '../services/storage'
import videoSrc from '../assets/gacha.mp4'
import poster from '../assets/gacha-poster.jpg'
import idleSrc from '../assets/gacha-idle-pingpong-crossfade.mp4'
import idlePoster from '../assets/gacha-idle-pingpong-crossfade-poster.webp'
import '../components/gacha/machine-ui.css'

const HINT_KEY = 'net:machine:hints-seen:v1'

export function GachaPage() {
  const { session, selectedTableId, ensureParticipant, pending } = useSession()
  const reduceMotion = useReducedMotion()
  const draw = useGachaDraw(session)
  const [joining, setJoining] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showHints, setShowHints] = useState(
    () =>
      !readStorage(
        HINT_KEY,
        (value): value is boolean => typeof value === 'boolean',
      ),
  )
  const gate = useRef(false)
  const drawButton = useRef<HTMLButtonElement>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const busy = joining || pending || draw.phase !== 'IDLE' || sheetOpen

  function checkTable() {
    if (selectedTableId) return true
    setError('상단에서 우리 테이블을 선택해 주세요.')
    document.getElementById('event-table')?.focus()
    return false
  }

  function dismissHints() {
    setShowHints(false)
    try {
      writeStorage(HINT_KEY, true)
    } catch {
      /* 안내 표시 여부는 추첨에 영향을 주지 않습니다. */
    }
  }

  async function start() {
    if (gate.current || busy || !checkTable()) return
    gate.current = true
    setJoining(true)
    setError('')
    dismissHints()
    try {
      const participant = await ensureParticipant(selectedTableId)
      await draw.start(participant, !!reduceMotion)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : '시작하지 못했어요. 다시 시도해 주세요.',
      )
    } finally {
      gate.current = false
      setJoining(false)
    }
  }

  function openQuestion() {
    if (busy || !checkTable()) return
    setError('')
    dismissHints()
    setSheetOpen(true)
  }

  useEffect(() => {
    const state = location.state as { openQuestionSheet?: boolean } | null
    if (!state?.openQuestionSheet) return
    // 기존 /questions 직접 접근도 머신 위의 바텀 시트로 이어집니다.
    if (selectedTableId) setSheetOpen(true)
    else {
      setError('상단에서 우리 테이블을 선택해 주세요.')
      document.getElementById('event-table')?.focus()
    }
    navigate('/', { replace: true, state: null })
  }, [location.state, selectedTableId, navigate])

  useEffect(() => {
    if (!success) return
    const timeout = window.setTimeout(() => setSuccess(false), 3200)
    return () => window.clearTimeout(timeout)
  }, [success])

  return (
    <section className="machine-screen" aria-label="NET 캡슐 가챠">
      <h1 className="sr-only">
        NET 캡슐 가챠 — 손잡이로 뽑고 보관통으로 질문 넣기
      </h1>
      <GachaExperience
        phase={draw.phase}
        result={draw.result}
        videoSrc={videoSrc}
        poster={poster}
        idleSrc={idleSrc}
        idlePoster={idlePoster}
        idlePaused={sheetOpen}
        warning={draw.warning}
        recovered={draw.recovering}
        isMock={apiMode === 'mock'}
        onReveal={draw.reveal}
        onReset={draw.reset}
      >
        {(size) => (
          <>
            <MachineHotspots
              size={size}
              disabled={busy}
              requesting={joining || draw.phase === 'REQUESTING'}
              showHints={showHints}
              drawRef={drawButton}
              onDraw={() => {
                void start()
              }}
              onSubmit={openQuestion}
            />
          </>
        )}
      </GachaExperience>
      {(error || draw.error) && (
        <div className="machine-notice">
          <ErrorNotice
            message={error || draw.error}
            retry={
              selectedTableId
                ? () => {
                    void start()
                  }
                : undefined
            }
          />
        </div>
      )}
      {draw.recovering && !draw.result && !error && !draw.error && (
        <p className="machine-brief-status" role="status">
          손잡이를 누르면 이전 뽑기를 이어서 확인해요.
        </p>
      )}
      {success && (
        <p className="machine-toast" role="status">
          질문을 캡슐에 넣었어요!
        </p>
      )}
      <QuestionSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSuccess={() => {
          setSheetOpen(false)
          setSuccess(true)
        }}
      />
    </section>
  )
}
