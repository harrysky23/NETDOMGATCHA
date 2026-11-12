import { useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { ErrorNotice, Loading } from '../components/Feedback'
import { useSession } from '../hooks/useSession'
import { useResource } from '../hooks/useResource'
import { api } from '../services/api'
import { TARGET_LABELS, type ParticipantSession } from '../types'
import './question-list.css'

export function QuestionListPage() {
  const { session, selectedTableId, ensureParticipant } = useSession()
  const ensure = useRef(ensureParticipant)
  ensure.current = ensureParticipant
  const joining = useRef<{
    tableId: string
    promise: Promise<ParticipantSession>
  } | null>(null)

  const load = useCallback(async () => {
    if (!selectedTableId) return []
    let participant = session
    if (!participant || participant.participant.table_id !== selectedTableId) {
      // StrictMode·화면 복귀의 동시 조회가 참가자 세션을 중복 생성하지 않게 합니다.
      if (!joining.current || joining.current.tableId !== selectedTableId) {
        joining.current = {
          tableId: selectedTableId,
          promise: ensure.current(selectedTableId),
        }
      }
      const request = joining.current
      try {
        participant = await request.promise
      } finally {
        if (joining.current === request) joining.current = null
      }
    }
    return api.listQuestions(participant, selectedTableId)
  }, [session, selectedTableId])

  const { data, loading, error, refresh } = useResource(load)
  // 테이블 변경 직후 새 응답을 기다리는 동안에도 이전 테이블의 질문을 표시하지 않습니다.
  const questions =
    data?.filter((question) => question.table_id === selectedTableId) ?? []

  return (
    <section
      className="question-list-page"
      aria-labelledby="question-list-title"
    >
      <Link to="/" className="back-link">
        <Icon name="back" size={17} />
        머신으로
      </Link>
      <div className="question-list-heading">
        <h1 id="question-list-title">질문함</h1>
        <button
          className="icon-button"
          aria-label="질문 목록 새로고침"
          disabled={loading || !selectedTableId}
          onClick={() => {
            void refresh()
          }}
        >
          <Icon name="refresh" size={18} />
        </button>
      </div>
      {!selectedTableId ? (
        <div className="question-list-empty">
          <Icon name="table" size={30} />
          <p>상단에서 테이블을 선택해 주세요.</p>
        </div>
      ) : error ? (
        <ErrorNotice
          message={error}
          retry={() => {
            void refresh()
          }}
        />
      ) : loading ? (
        <Loading label="질문함을 불러오고 있어요." />
      ) : !questions.length ? (
        <div className="question-list-empty">
          <Icon name="pen" size={30} />
          <p>아직 등록된 질문이 없어요.</p>
          <Link to="/questions" className="button button-outline">
            첫 질문 넣기
            <Icon name="arrow" size={17} />
          </Link>
        </div>
      ) : (
        <>
          <p className="question-list-count">
            등록된 질문 {questions.length}개 · 최신순
          </p>
          <ul className="question-list">
            {questions.map((question) => (
              <li key={question.id}>
                <div className="question-list-meta">
                  <span className="question-list-target">
                    {TARGET_LABELS[question.target]}
                  </span>
                  <span
                    className={
                      question.is_drawn
                        ? 'question-list-drawn'
                        : 'question-list-waiting'
                    }
                  >
                    {question.is_drawn ? '뽑은 질문' : '대기 중'}
                  </span>
                </div>
                <p className="question-list-content">{question.content}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
