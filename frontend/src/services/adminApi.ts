import { ApiError, type EventTable } from '../types/index.ts'
import { appendMockTable } from './tableStore.ts'

export interface AdminApi {
  login(password: string): Promise<string>
  addTable(token: string): Promise<EventTable>
}

export function createMockAdminApi(): AdminApi {
  let previewToken: string | null = null
  return {
    async login() {
      previewToken = `mock-admin-${crypto.randomUUID()}`
      return previewToken
    },
    async addTable(token) {
      if (!previewToken || token !== previewToken)
        throw new ApiError(
          'UNAUTHORIZED',
          '관리자 화면에서 먼저 입장해 주세요.',
        )
      return appendMockTable()
    },
  }
}

export function createHttpAdminApi(baseUrl: string): AdminApi {
  const base = baseUrl.replace(/\/$/, '')
  async function post(path: string, body: unknown, token?: string) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 20_000)
    try {
      const response = await fetch(`${base}${path}`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      })
      if (!response.ok)
        throw new ApiError(
          'HTTP_ERROR',
          response.status === 401
            ? '관리자 인증을 확인해 주세요.'
            : '처리하지 못했어요. 다시 시도해 주세요.',
        )
      return (await response.json()) as unknown
    } finally {
      clearTimeout(timer)
    }
  }
  return {
    async login(password) {
      const data = (await post('/admin/session', { password })) as {
        token?: unknown
      }
      if (typeof data?.token !== 'string')
        throw new ApiError('INVALID_RESPONSE', '인증 응답이 올바르지 않아요.')
      return data.token
    },
    async addTable(token) {
      const data = (await post(
        '/admin/tables',
        {},
        token,
      )) as Partial<EventTable>
      if (
        typeof data?.id !== 'string' ||
        typeof data.name !== 'string' ||
        !Number.isInteger(data.number)
      )
        throw new ApiError('INVALID_RESPONSE', '테이블 응답이 올바르지 않아요.')
      return data as EventTable
    },
  }
}
