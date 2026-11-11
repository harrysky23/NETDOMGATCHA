import { Link } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { Icon } from '../components/Icon'

export function NotFoundPage() {
  const { session } = useSession()
  return (
    <div className="container form-width empty-state not-found">
      <span className="eyebrow">404 · LOST CAPSULE</span>
      <h1>캡슐이 길을 잃었나 봐요.</h1>
      <p>이 페이지는 찾을 수 없어요. 다시 만남의 자리로 돌아갈까요?</p>
      <Link to={session ? '/table' : '/'} className="button button-primary">
        홈으로 돌아가기
        <Icon name="arrow" />
      </Link>
    </div>
  )
}
