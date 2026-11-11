import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import { useResource } from '../hooks/useResource'
import { useSession } from '../hooks/useSession'
import { PageHeading } from '../components/PageHeading'
import { ErrorNotice, Loading } from '../components/Feedback'
import { Icon } from '../components/Icon'
import { TARGET_LABELS } from '../types'

export function HistoryPage() {
  const { session } = useSession()
  const load = useCallback(
    () => api.getHistory(session!, session!.participant.table_id),
    [session],
  )
  const { data, error, loading, refresh } = useResource(load)

  return (
    <div className="container form-width">
      <PageHeading
        eyebrow="OUR SHARED STORIES"
        title="함께 나눈 이야기"
        description="우리 테이블에서 꺼낸 질문들을 다시 만나보세요."
      />
      <div className="history-panel">
        <div className="panel-topline">
          <span>
            <Icon name="history" size={17} />
            추첨 기록
          </span>
          <button
            className="icon-button"
            onClick={() => {
              void refresh()
            }}
            disabled={loading}
            aria-label="추첨 기록 새로고침"
          >
            <Icon name="refresh" size={17} />
          </button>
        </div>
        {loading && !data ? (
          <Loading />
        ) : error ? (
          <ErrorNotice
            message={error}
            retry={() => {
              void refresh()
            }}
          />
        ) : data?.length ? (
          <ol className="history-list">
            {data.map((draw) => (
              <li key={draw.id}>
                <span className="target-badge">
                  {TARGET_LABELS[draw.question.target]}
                </span>
                <h2>{draw.question.content}</h2>
                <time dateTime={draw.drawn_at}>
                  {new Date(draw.drawn_at).toLocaleString('ko-KR', {
                    timeZone: 'Asia/Seoul',
                  })}
                </time>
              </li>
            ))}
          </ol>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <Icon name="history" size={32} />
            </div>
            <h2>이야기는 이제 시작이에요.</h2>
            <p>
              아직 추첨한 질문이 없어요.
              <br />
              캡슐을 뽑으면 이곳에 기록이 쌓여요.
            </p>
            <Link to="/gacha" className="button button-outline">
              가챠 화면 둘러보기
              <Icon name="arrow" size={17} />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
