import { createHash } from 'node:crypto'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const scrapbook = join(root, 'asset/scrapbooks')
// macOS의 분해형 한글 파일명과 Linux의 조합형 파일명을 모두 지원합니다.
const directory = (await readdir(scrapbook)).find(name => name.normalize('NFC') === '다꾸스티커')
if (!directory) throw new Error('asset/scrapbooks/다꾸스티커 폴더가 필요합니다.')

// 이미 저장된 질문의 스티커 ID와 기존 가공 이미지는 보존합니다.
const legacy = {
  '파스텔 하트 봉투 스티커-2.png': 'heart-envelope',
  '보라색 반짝이 다이아몬드 스티커.png': 'diamond',
  '딸기 우유 카톤 스티커-4.png': 'strawberry-milk',
  '파스텔 보라빛 NET 티켓 스티커.png': 'net-ticket',
  '귀여운 보라색 물음표 스티커.png': 'question-mark',
  '파스텔 별과 반짝이 스티커.png': 'stars',
  '라벤더 픽셀 커서 스티커.png': 'pixel-cursor',
  '보라 리본 별님 스티커-1.png': 'ribbon-star',
  '클로버를 안은 행복한 치즈태비 고양이-3.png': 'clover-cat',
}
const source = join(scrapbook, directory)
const output = join(root, 'frontend/public/stickers')
await mkdir(output, { recursive: true })
const available = new Set()
const catalog = {}
for (const entry of (await readdir(source, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
  if (!entry.isFile()) continue
  const extension = extname(entry.name).toLowerCase()
  if (!['.png', '.jpg', '.jpeg', '.webp'].includes(extension)) continue
  const filename = entry.name.normalize('NFC')
  const known = legacy[filename]
  if (known) {
    available.add(known)
    continue
  }
  const bytes = await readFile(join(source, entry.name))
  // 내용 기반 ID이므로 이름을 바꿔도 저장된 질문의 ID는 달라지지 않습니다.
  const id = 'asset-' + createHash('sha256').update(bytes).digest('hex').slice(0, 24)
  if (available.has(id)) continue
  available.add(id)
  const assetName = `${id}${extension}`
  await writeFile(join(output, assetName), bytes)
  catalog[id] = { src: `/stickers/${assetName}`, label: filename.slice(0, -extension.length) }
}
const generated = join(root, 'frontend/src/generated')
await mkdir(generated, { recursive: true })
await writeFile(join(generated, 'stickerCatalog.ts'),
  '// npm run sync:stickers로 자동 생성됩니다. 직접 수정하지 마세요.\n' +
  `export const EXTRA_STICKER_CATALOG = ${JSON.stringify(catalog, null, 2)} as const\n` +
  `export const AVAILABLE_STICKER_IDS = ${JSON.stringify([...available], null, 2)} as const\n`)
await mkdir(join(root, 'backend/app'), { recursive: true })
await writeFile(join(root, 'backend/app/sticker_manifest.json'),
  JSON.stringify([...new Set([...Object.values(legacy), ...Object.keys(catalog)])], null, 2) + '\n')
console.log(`다꾸 스티커 ${available.size}개 등록 (새 에셋 ${Object.keys(catalog).length}개)`)
