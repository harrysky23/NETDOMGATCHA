import type { StickerId } from '../../../types'
import heart from '../../../assets/scrapbook/stickers/heart-envelope.png'
import diamond from '../../../assets/scrapbook/stickers/diamond.png'
import milk from '../../../assets/scrapbook/stickers/strawberry-milk.png'
import net from '../../../assets/scrapbook/net-label.png'
import question from '../../../assets/scrapbook/stickers/question-mark.png'
import stars from '../../../assets/scrapbook/stars.png'
import cursor from '../../../assets/scrapbook/stickers/pixel-cursor.png'
import ribbon from '../../../assets/scrapbook/stickers/ribbon-star.png'
import cat from '../../../assets/scrapbook/stickers/clover-cat.png'
export const stickerCatalog: Record<StickerId, { src: string; label: string }> =
  {
    'heart-envelope': { src: heart, label: '하트 봉투' },
    diamond: { src: diamond, label: '다이아몬드' },
    'strawberry-milk': { src: milk, label: '딸기 우유' },
    'net-ticket': { src: net, label: 'NET 티켓' },
    'question-mark': { src: question, label: '물음표' },
    stars: { src: stars, label: '별과 반짝이' },
    'pixel-cursor': { src: cursor, label: '픽셀 커서' },
    'ribbon-star': { src: ribbon, label: '리본 별' },
    'clover-cat': { src: cat, label: '클로버 고양이' },
  }
