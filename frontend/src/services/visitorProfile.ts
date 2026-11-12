import { ApiError, type VisitorProfile } from '../types/index.ts'
import { readStorage, writeStorage } from './storage.ts'

export const VISITOR_ID_KEY = 'net:visitor-id:v1'
export const VISITOR_PROFILE_KEY = 'net:visitor-profile:v1'
export const MAX_NICKNAME_LENGTH = 12
export const isVisitorId = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )

export function normalizeNickname(value: string) {
  const nickname = value.trim()
  if (
    !nickname ||
    Array.from(nickname).length > MAX_NICKNAME_LENGTH ||
    /[\u0000-\u001f\u007f]/u.test(nickname)
  )
    throw new ApiError(
      'VALIDATION_ERROR',
      '닉네임은 앞뒤 공백을 제외한 1–12자로 입력해 주세요.',
    )
  return nickname
}

export function isVisitorProfile(value: unknown): value is VisitorProfile {
  if (!value || typeof value !== 'object') return false
  const profile = value as Partial<VisitorProfile>
  if (!isVisitorId(profile.visitorId) || typeof profile.nickname !== 'string')
    return false
  try {
    return normalizeNickname(profile.nickname) === profile.nickname
  } catch {
    return false
  }
}

export function readVisitorProfile(): VisitorProfile | null {
  const profile = readStorage(VISITOR_PROFILE_KEY, isVisitorProfile)
  const id = readStorage(VISITOR_ID_KEY, isVisitorId)
  return profile && id === profile.visitorId ? profile : null
}

/** Effect에서 실행합니다. StrictMode 재실행은 저장된 UUID를 읽으므로 UUID를 다시 발급하지 않습니다. */
export function bootstrapVisitor() {
  const saved = readStorage(VISITOR_PROFILE_KEY, isVisitorProfile)
  const visitorId =
    readStorage(VISITOR_ID_KEY, isVisitorId) ??
    saved?.visitorId ??
    crypto.randomUUID()
  // 쓰기가 차단되면 자동 입장했다고 오인하지 않고 명시적인 저장소 오류를 반환합니다.
  writeStorage(VISITOR_ID_KEY, visitorId)
  return { visitorId, profile: saved?.visitorId === visitorId ? saved : null }
}

export function saveVisitorNickname(value: string): VisitorProfile {
  const nickname = normalizeNickname(value)
  const { visitorId } = bootstrapVisitor()
  const profile = { visitorId, nickname }
  writeStorage(VISITOR_PROFILE_KEY, profile)
  return profile
}
