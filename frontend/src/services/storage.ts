import { ApiError } from '../types/index.ts'

export function readStorage<T>(
  key: string,
  validate: (value: unknown) => value is T,
): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const value: unknown = JSON.parse(raw)
    return validate(value) ? value : null
  } catch {
    return null
  }
}

export function writeStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    throw new ApiError(
      'STORAGE_UNAVAILABLE',
      '브라우저 저장 공간을 사용할 수 없어요. 저장 설정을 확인해 주세요.',
    )
  }
}
