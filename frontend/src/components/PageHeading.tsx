import { Link } from 'react-router-dom'
import { Icon } from './Icon'

export function PageHeading({
  eyebrow,
  title,
  description,
  back = '/table',
}: {
  eyebrow: string
  title: string
  description: string
  back?: string
}) {
  return (
    <div className="page-heading">
      <Link to={back} className="back-link">
        <Icon name="back" size={17} />
        {back === '/' ? '처음으로' : '테이블 홈'}
      </Link>
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  )
}
