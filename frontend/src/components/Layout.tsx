import { useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { useSession } from '../hooks/useSession'
import { Icon } from './Icon'
import { apiMode } from '../services/api'

export function Layout() {
  const { session } = useSession()
  const location = useLocation()
  const help = useRef<HTMLDialogElement>(null)
  const content = useRef<HTMLElement>(null)
  const isLanding = location.pathname === '/'
  const showNav = !!session && !isLanding && location.pathname !== '/tables'

  useEffect(() => {
    window.scrollTo(0, 0)
    content.current?.focus({ preventScroll: true })
    const titles: Record<string, string> = {
      '/': '질문 하나, 새로운 연결',
      '/tables': '테이블 선택',
      '/table': '우리 테이블',
      '/questions': '질문 등록',
      '/gacha': '캡슐 가챠',
      '/history': '추첨 기록',
    }
    document.title = `NET — ${titles[location.pathname] ?? '페이지를 찾을 수 없어요'}`
  }, [location.pathname])

  return (
    <div className={`app-shell ${showNav ? 'with-mobile-nav' : ''}`}>
      <a className="skip-link" href="#main-content">
        본문으로 바로가기
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Link
            className="brand"
            to={session ? '/table' : '/'}
            aria-label="NET 홈"
          >
            <span className="brand-word">
              NET<span className="brand-dot">.</span>
            </span>
            <span className="brand-divider" />
            <span className="brand-caption">
              OB총회
              <br />
              <b>CONNECT THROUGH QUESTIONS</b>
            </span>
          </Link>
          <div className="header-right">
            <span className="event-tag">
              <span className="status-dot" />
              우리의 이야기가 이어지는 밤
            </span>
            <button
              className="help-button"
              onClick={() => help.current?.showModal()}
            >
              <Icon name="question" size={18} />
              <span>이용 안내</span>
            </button>
          </div>
        </div>
      </header>
      <main id="main-content" ref={content} tabIndex={-1}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Outlet />
        </motion.div>
      </main>
      <footer className="site-footer">
        <span>
          <b>NET.</b> 경희대학교 컴퓨터공학과
        </span>
        <span>선배와 후배, 그 사이의 연결.</span>
        <span className="mock-label">{apiMode === 'mock' ? 'MOCK MODE · 영상 가챠' : 'NET CAPSULE CLUB'}</span>
      </footer>
      {showNav && (
        <nav className="mobile-nav" aria-label="주요 메뉴">
          <NavLink to="/table">
            <Icon name="home" />
            <span>테이블</span>
          </NavLink>
          <NavLink to="/questions">
            <Icon name="pen" />
            <span>질문 쓰기</span>
          </NavLink>
          <NavLink to="/gacha">
            <Icon name="sparkles" />
            <span>가챠</span>
          </NavLink>
          <NavLink to="/history">
            <Icon name="history" />
            <span>기록</span>
          </NavLink>
        </nav>
      )}
      <dialog
        className="help-dialog"
        ref={help}
        onClick={(event) => {
          if (event.target === help.current) help.current?.close()
        }}
        aria-labelledby="help-title"
      >
        <div className="dialog-content">
          <button
            className="icon-button dialog-close"
            aria-label="이용 안내 닫기"
            onClick={() => help.current?.close()}
          >
            <Icon name="close" />
          </button>
          <span className="eyebrow">HOW TO PLAY</span>
          <h2 id="help-title">질문 하나로 더 가까이</h2>
          <ol className="help-steps">
            <li>
              <b>닉네임으로 입장해요.</b>
              <p>회원가입 없이 편하게 시작하세요.</p>
            </li>
            <li>
              <b>함께 앉은 테이블을 선택해요.</b>
              <p>TABLE 01–05마다 독립적인 질문함이 있어요.</p>
            </li>
            <li>
              <b>궁금한 점을 익명으로 남겨요.</b>
              <p>선배에게, 후배에게, 모두에게 물어보세요.</p>
            </li>
            <li>
              <b>캡슐을 뽑고 이야기를 나눠요.</b>
              <p>우리 테이블에서 누구나 뽑을 수 있어요.</p>
            </li>
          </ol>
          <p className="muted small">
            {apiMode === 'mock' ? '현재는 목업 질문함으로, 질문과 추첨 기록은 이 브라우저에만 저장돼요. 실제 무작위 추첨과 다른 기기 간 공유는 서버 연동 후 제공됩니다.' : '우리 테이블의 질문함을 함께 사용해요. 추첨한 질문은 기록에서 다시 확인할 수 있어요.'}
          </p>
          <button
            className="button button-primary w-full mt-6"
            onClick={() => help.current?.close()}
          >
            좋아요, 시작할게요 <Icon name="check" size={18} />
          </button>
        </div>
      </dialog>
    </div>
  )
}
