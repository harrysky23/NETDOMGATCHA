import { useState, type ReactNode, type RefObject } from 'react'
import paper from '../../../assets/scrapbook/memo-paper.png'
import './letter-paper.css'

/** 작성 화면과 결과가 같은 좌표계·종횡비를 사용합니다. */
export function LetterPaper({
  children,
  paperRef,
  className = '',
}: {
  children: ReactNode
  paperRef?: RefObject<HTMLDivElement | null>
  className?: string
}) {
  const [imageFailed, setImageFailed] = useState(false)
  return (
    <div className={`letter-paper ${className}`} ref={paperRef} data-image-error={imageFailed}>
      <img
        className="letter-paper-image"
        src={paper}
        width={1493}
        height={1054}
        alt=""
        draggable={false}
        onError={() => setImageFailed(true)}
      />
      {children}
    </div>
  )
}
