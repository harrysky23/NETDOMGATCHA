import type { NetApi } from './contracts'
import {
  ApiError,
  type ApiErrorCode,
  type ParticipantSession,
} from '../types/index.ts'
import { isDrawResult, isParticipantSession, isQuestion } from './validation.ts'
import type { Question } from '../types/index.ts'

const knownCodes: ApiErrorCode[] = [
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'TABLE_ACCESS_DENIED',
  'TABLE_NOT_FOUND',
  'NO_QUESTIONS_AVAILABLE',
  'NETWORK_ERROR',
  'HTTP_ERROR',
]

/** 서버는 contracts.ts의 응답 형태를 따라야 합니다. 자동 쓰기 재시도는 하지 않습니다. */
export function createHttpApi(
  baseUrl: string,
  fetcher: typeof fetch = fetch,
): NetApi {
  const base = baseUrl.replace(/\/$/, '')
  async function request<T>(
    path: string,
    session?: ParticipantSession,
    init: RequestInit = {},
    allowNull = false,
  ): Promise<T> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 20_000)
    try {
      const response = await fetcher(`${base}${path}`, {
        ...init,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
          ...init.headers,
        },
      })
      let data: unknown
      try {
        data = await response.json()
      } catch {
        if (response.ok)
          throw new ApiError(
            'INVALID_RESPONSE',
            '서버 응답 형식이 올바르지 않아요. 같은 요청으로 다시 확인해 주세요.',
          )
        data = null
      }
      if (!response.ok) {
        const body =
          data && typeof data === 'object'
            ? (data as Record<string, unknown>)
            : {}
        const detail =
          body.detail && typeof body.detail === 'object'
            ? (body.detail as Record<string, unknown>)
            : body
        const code =
          typeof detail.code === 'string' &&
          knownCodes.includes(detail.code as ApiErrorCode)
            ? (detail.code as ApiErrorCode)
            : 'HTTP_ERROR'
        const message =
          code === 'NO_QUESTIONS_AVAILABLE'
            ? '우리 테이블의 질문을 모두 뽑았어요. 새 질문을 등록해 주세요.'
            : code === 'UNAUTHORIZED'
              ? '입장 정보가 만료됐어요. 다시 입장해 주세요.'
              : typeof detail.message === 'string'
                ? detail.message
                : '요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.'
        throw new ApiError(code, message)
      }
      if (data === null && !allowNull)
        throw new ApiError(
          'INVALID_RESPONSE',
          '서버 응답을 확인하지 못했어요. 같은 요청으로 다시 확인해 주세요.',
        )
      return data as T
    } catch (cause) {
      if (cause instanceof ApiError) throw cause
      throw new ApiError(
        'NETWORK_ERROR',
        path.endsWith('/draw')
          ? '서버 응답이 늦거나 연결이 끊겼어요. 다시 시도하면 같은 추첨 요청을 확인해요.'
          : '서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.',
      )
    } finally {
      clearTimeout(timeout)
    }
  }

  async function sessionRequest(
    path: string,
    session: ParticipantSession | undefined,
    init: RequestInit,
  ) {
    const result = await request<unknown>(path, session, init)
    if (!isParticipantSession(result))
      throw new ApiError(
        'INVALID_RESPONSE',
        '입장 응답 형식이 올바르지 않아요.',
      )
    return result
  }

  return {
    listTables: () => request('/tables'),
    getParticipant: (session) =>
      sessionRequest('/participants/me', session, {}),
    createParticipant: (input) =>
      sessionRequest('/participants', undefined, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    changeTable: (session, tableId) =>
      sessionRequest('/participants/me/table', session, {
        method: 'PATCH',
        body: JSON.stringify({ table_id: tableId }),
      }),
    updateParticipantProfile: (session, profile) =>
      sessionRequest('/participants/me/profile', session, {
        method: 'PATCH',
        body: JSON.stringify(profile),
      }),
    getStatus: (session, tableId) =>
      request(`/tables/${encodeURIComponent(tableId)}/status`, session),
    submitQuestion: (session, tableId, input) =>
      request(`/tables/${encodeURIComponent(tableId)}/questions`, session, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    async listQuestions(session, tableId) {
      const data = await request<unknown>(
        `/tables/${encodeURIComponent(tableId)}/questions`,
        session,
      )
      if (
        !Array.isArray(data) ||
        !data.every(
          (question) => isQuestion(question) && question.table_id === tableId,
        )
      ) {
        throw new ApiError(
          'INVALID_RESPONSE',
          '질문 목록 응답이 올바르지 않아요.',
        )
      }
      return data
        .map((question: Question) => ({
          id: question.id,
          table_id: question.table_id,
          content: question.content,
          target: question.target,
          decoration: question.decoration ?? null,
          is_drawn: question.is_drawn,
          created_at: question.created_at,
        }))
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
    },
    async draw(session, tableId, idempotencyKey) {
      const result = await request<unknown>(
        `/tables/${encodeURIComponent(tableId)}/draw`,
        session,
        {
          method: 'POST',
          headers: { 'Idempotency-Key': idempotencyKey },
          body: JSON.stringify({}),
        },
      )
      if (!isDrawResult(result) || result.table_id !== tableId)
        throw new ApiError(
          'INVALID_RESPONSE',
          '추첨 응답 형식이 올바르지 않아요. 같은 요청으로 다시 확인해 주세요.',
        )
      return result
    },
    getHistory: (session, tableId) =>
      request(`/tables/${encodeURIComponent(tableId)}/history`, session),
    async getLatestDraw(session, tableId) {
      // null은 정상적인 '아직 추첨 없음' 응답입니다.
      const history = await request<unknown>(
        `/tables/${encodeURIComponent(tableId)}/draws/latest`,
        session,
        {},
        true,
      )
      if (history === null) return null
      if (!isDrawResult(history) || history.table_id !== tableId)
        throw new ApiError(
          'INVALID_RESPONSE',
          '최근 추첨 결과를 확인하지 못했어요.',
        )
      return history
    },
  }
}
