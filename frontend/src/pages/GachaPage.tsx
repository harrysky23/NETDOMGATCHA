import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GachaMachine } from '../components/GachaMachine'
import { PageHeading } from '../components/PageHeading'
import { Icon } from '../components/Icon'
import { useSession } from '../hooks/useSession'

export function GachaPage() {
  const [preview, setPreview] = useState(false)
  const { session } = useSession()
  const number = session?.participant.table_id.slice(-2)

  return (
    <div className="container form-width gacha-page">
      <PageHeading
        eyebrow="ONE CAPSULE, ONE CONNECTION"
        title="우리의 다음 이야기는?"
        description="작은 캡슐에 담긴 질문을 함께 만나보세요."
      />
      <section className="gacha-panel">
        <div className="machine-panel-header">
          <span className="pill">
            <span className="status-dot" />
            TABLE {number}
          </span>
          <span className="preview-badge">정적 목업</span>
        </div>
        {preview ? (
          <div className="result-preview" role="status">
            <span className="result-sparkle">✳</span>
            <span className="eyebrow">A QUESTION FOR EVERYONE</span>
            <span className="target-badge">모두에게</span>
            <h2>
              NET에서 가장 기억에 남는
              <br />
              순간은 언제인가요?
            </h2>
            <div className="result-divider" />
            <p>서로의 이야기를 천천히 들려주세요.</p>
            <small>디자인 확인용 예시예요. 실제 추첨 결과가 아닙니다.</small>
          </div>
        ) : (
          <div className="gacha-static">
            <GachaMachine compact />
            <h2>어떤 질문을 만나게 될까요?</h2>
            <p>궁금한 마음을 담아 캡슐을 열어봐요.</p>
          </div>
        )}
        <button
          className="button button-primary w-full"
          onClick={() => setPreview(!preview)}
        >
          <Icon name={preview ? 'refresh' : 'sparkles'} />
          {preview ? '머신으로 돌아가기' : '질문 카드 예시 보기'}
          {!preview && <Icon name="arrow" size={19} />}
        </button>
        <p className="panel-hint">
          실제 랜덤 추첨과 캡슐 애니메이션은 준비 중이에요.
          <br />
          미리보기는 질문 수와 추첨 기록에 영향을 주지 않아요.
        </p>
      </section>
      <Link to="/table" className="button button-ghost w-full mt-4">
        테이블로 돌아가기
        <Icon name="arrow" size={17} />
      </Link>
    </div>
  )
}
