import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { useResource } from '../hooks/useResource'
import { api, apiMode } from '../services/api'
import { GachaMachine } from '../components/GachaMachine'
import { Icon } from '../components/Icon'
import { ErrorNotice, Loading } from '../components/Feedback'

export function TableHomePage() {
  const { session } = useSession()
  const load = useCallback(
    () => api.getStatus(session!, session!.participant.table_id),
    [session],
  )
  const { data, error, loading, refresh } = useResource(load)
  if (!data && loading)
    return (
      <div className="container page-width">
        <Loading />
      </div>
    )
  if (error || !data)
    return (
      <div className="container page-width">
        <ErrorNotice
          message={error || '테이블을 불러오지 못했어요.'}
          retry={() => {
            void refresh()
          }}
        />
        <Link to="/tables" className="back-link mt-6">
          테이블 다시 선택하기
        </Link>
      </div>
    )

  return (
    <div className="container page-width table-home">
      <div className="home-heading">
        <div>
          <span className="eyebrow">OUR LITTLE CONNECTION</span>
          <h1>
            반가워요, {session?.participant.nickname}님
            <span className="wave">✳</span>
          </h1>
          <p>질문 하나로 시작되는 우리 테이블의 이야기.</p>
        </div>
        <Link className="button button-outline button-small" to="/tables">
          <Icon name="table" size={16} />
          테이블 변경
        </Link>
      </div>
      <div className="home-grid">
        <section className="machine-panel">
          <div className="machine-panel-header">
            <span className="pill">
              <span className="status-dot" />
              {data.table.name}
            </span>
            <span className="tiny-label">NET CAPSULE CLUB</span>
          </div>
          <div className="home-machine">
            <GachaMachine compact />
          </div>
          <div className="machine-panel-copy">
            <h2>어떤 이야기가 나올까요?</h2>
            <p>캡슐 안에 담긴 새로운 대화의 시작</p>
          </div>
          <Link className="button button-primary w-full" to="/gacha">
            <Icon name="sparkles" />
            랜덤 가챠 만나보기
            <Icon name="arrow" />
          </Link>
          <span className="panel-hint">
            캡슐을 뽑으면 약 8초의 영상 뒤에 질문이 열려요.
          </span>
        </section>
        <div className="home-side">
          <section className="status-panel">
            <div className="flex items-center justify-between">
              <h2>우리 테이블 질문함</h2>
              <button
                className="icon-button"
                onClick={() => {
                  void refresh()
                }}
                disabled={loading}
                aria-label="질문함 새로고침"
              >
                <Icon
                  name="refresh"
                  size={17}
                  className={loading ? 'spinning' : ''}
                />
              </button>
            </div>
            <div className="question-count">
              <strong>{data.remaining_count}</strong>
              <span>개의 질문이 기다리고 있어요</span>
            </div>
            <div className="question-meter">
              <div
                style={{
                  width: `${data.total_count ? (data.remaining_count / data.total_count) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="count-details">
              <span>
                등록된 질문 <b>{data.total_count}</b>
              </span>
              <span>
                함께 나눈 질문 <b>{data.drawn_count}</b>
              </span>
            </div>
          </section>
          <Link to="/questions" className="action-card">
            <span className="action-icon">
              <Icon name="pen" size={23} />
            </span>
            <div>
              <h2>궁금한 이야기를 남겨요</h2>
              <p>우리 테이블에 익명으로 질문하기</p>
            </div>
            <Icon name="arrow" size={20} />
          </Link>
          <Link to="/history" className="action-card history-card">
            <span className="action-icon">
              <Icon name="history" size={23} />
            </span>
            <div>
              <h2>함께 나눈 이야기</h2>
              <p>우리 테이블 추첨 기록 보기</p>
            </div>
            <Icon name="arrow" size={20} />
          </Link>
          <div className="table-note">
            <span className="tiny-star">✦</span>
            <div>
              <h3>좋은 대화에는 정답이 없으니까</h3>
              <p>
                서로의 이야기에 귀 기울여 주세요.
                <br />
                대답하기 어려운 질문은 가볍게 넘겨도 좋아요.
              </p>
            </div>
          </div>
        </div>
      </div>
      {apiMode === 'mock' && <div className="notice mock-notice">
        <Icon name="info" size={17} />
        <p>
          지금은 목업 모드예요. 질문은 이 브라우저에만 저장되며 다른 참가자와
          공유되지 않아요.
        </p>
      </div>}
    </div>
  )
}
