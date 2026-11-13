import { useState, type ReactNode } from 'react'
import card from '../../assets/login/member-card-base.png'
import clip from '../../assets/login/lanyard-clip.png'
import bunny from '../../assets/login/member-bunny.png'
import label from '../../assets/login/member-label.png'
import barcode from '../../assets/login/barcode-sticker.png'
import heart from '../../assets/scrapbook/stickers/heart-envelope.png'
import stars from '../../assets/scrapbook/stars.png'

export function MemberPass({
  children,
  editing = false,
}: {
  children: ReactNode
  editing?: boolean
}) {
  const [imageFailed, setImageFailed] = useState(false)
  return (
    <section
      className="member-pass"
      aria-labelledby="identity-title"
      data-image-error={imageFailed}
    >
      <img
        className="member-card-base"
        src={card}
        width={1086}
        height={1448}
        alt=""
        draggable={false}
        onError={() => setImageFailed(true)}
      />
      <img
        className="member-lanyard"
        src={clip}
        width={1024}
        height={1536}
        alt=""
        draggable={false}
      />
      <img className="member-heart" src={heart} alt="" draggable={false} />
      <div className="member-card-body">
        <div className="member-portrait-column" aria-hidden="true">
          <div className="member-portrait">
            <span className="member-portrait-no">NET · 2026</span>
            <img
              src={bunny}
              width={1210}
              height={1300}
              alt=""
              draggable={false}
            />
            <span className="member-portrait-caption">MEMBER</span>
          </div>
          <p className="member-photo-note">
            우리의 이야기가
            <br />
            이어지는 밤
          </p>
        </div>
        <div className="member-information">
          <img
            className="member-card-label"
            src={label}
            width={1774}
            height={887}
            alt="NET NETWORK MEMBER CARD"
            draggable={false}
          />
          <h1 id="identity-title">
            {editing ? '이름을 바꿔볼까요?' : '반가워요, NET!'}
          </h1>
          {children}
        </div>
      </div>
      <img
        className="member-barcode"
        src={barcode}
        width={2172}
        height={724}
        alt=""
        draggable={false}
      />
      <img className="member-stars" src={stars} alt="" draggable={false} />
      <span className="member-card-edition" aria-hidden="true">
        OB REUNION
        <br />
        NET : WORK
      </span>
    </section>
  )
}
