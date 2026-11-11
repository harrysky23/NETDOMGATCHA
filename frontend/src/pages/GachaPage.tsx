import { useReducedMotion } from 'motion/react'
import { Link } from 'react-router-dom'
import { PageHeading } from '../components/PageHeading'
import { Icon } from '../components/Icon'
import { ErrorNotice } from '../components/Feedback'
import { GachaExperience } from '../components/gacha/GachaExperience'
import { useSession } from '../hooks/useSession'
import { useGachaDraw } from '../hooks/useGachaDraw'
import { useResource } from '../hooks/useResource'
import { api, apiMode } from '../services/api'
import videoSrc from '../assets/gacha.mp4'
import poster from '../assets/gacha-poster.jpg'

export function GachaPage() {
  const { session } = useSession()
  const reduceMotion = useReducedMotion()
  const draw = useGachaDraw(session!)
  const loadStatus = useCallback(() => api.getStatus(session!, session!.participant.table_id), [session])
  const { data: status, refresh } = useResource(loadStatus)
  useEffect(() => { if (draw.phase === 'REVEAL') void refresh() }, [draw.phase, refresh])
  const busy = draw.phase !== 'IDLE'

  return <div className="container form-width gacha-page">
    <PageHeading eyebrow="ONE CAPSULE, ONE CONNECTION" title="우리의 다음 이야기는?" description="작은 캡슐에 담긴 질문을 함께 만나보세요." />
    <section className="gacha-panel gacha-video-panel" aria-busy={draw.phase === 'REQUESTING'}>
      <div className="machine-panel-header"><span className="pill"><span className="status-dot" />{status?.table.name ?? '우리 테이블'}</span><span className="preview-badge">{apiMode === 'mock' ? '목업 추첨' : `남은 질문 ${status?.remaining_count ?? '…'}개`}</span></div>
      <div className="gacha-poster-wrap"><img className="gacha-poster" src={poster} alt="보라색 캡슐이 담긴 NET:WORK 가챠 머신" fetchPriority="high" /><div className="poster-caption"><Icon name="sparkles" size={15} /><span>A LITTLE QUESTION. A NEW CONNECTION.</span></div></div>
      <h2 className="gacha-idle-title">어떤 질문을 만나게 될까요?</h2>
      <p className="gacha-idle-description">뽑기를 누르면 우리 테이블의 이야기가 열려요.</p>
      {draw.recovering && !draw.result && <p className="draw-recovery-note" role="status">이전 요청이 남아 있어요. 같은 요청으로 결과를 확인해요.</p>}
      {draw.error && <ErrorNotice message={draw.error} />}
      <button className="button button-primary w-full" disabled={busy} onClick={() => { void draw.start(!!reduceMotion) }}>
        {draw.phase === 'REQUESTING' ? <><span className="spinner" />질문을 뽑고 있어요…</> : <><Icon name={draw.error || draw.recovering ? 'refresh' : 'sparkles'} />{draw.error || draw.recovering ? '같은 추첨 요청 다시 확인' : '캡슐 뽑기'}<Icon name="arrow" size={18} /></>}
      </button>
      <p className="panel-hint">{apiMode === 'mock' ? '지금은 이 브라우저의 목업 질문함을 사용해요.' : '추첨한 질문은 우리 테이블 기록에 보관돼요.'}<br />{reduceMotion ? '동작 줄이기 설정에 따라 영상 없이 질문을 보여드려요.' : '약 8초의 영상이 끝나면 질문이 공개돼요. 기본은 무음이에요.'}</p>
    </section>
    <Link to="/table" className="button button-ghost w-full mt-4" aria-disabled={busy} onClick={event => { if (busy) event.preventDefault() }}>테이블로 돌아가기<Icon name="arrow" size={17} /></Link>
    <GachaExperience phase={draw.phase} result={draw.result} videoSrc={videoSrc} poster={poster} warning={draw.warning} recovered={draw.recovering} isMock={apiMode === 'mock'} onReveal={draw.reveal} onReset={draw.reset} />
  </div>
}
import { useCallback, useEffect } from 'react'
