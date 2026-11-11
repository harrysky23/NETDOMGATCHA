import type { NetApi } from './contracts'
import { mockApi } from './mockApi'
import { createHttpApi } from './httpApi'
import { createHttpAdminApi, createMockAdminApi } from './adminApi'

export const apiMode =
  import.meta.env.VITE_API_MODE === 'http' ? 'http' : 'mock'
export const api: NetApi =
  apiMode === 'http'
    ? createHttpApi(import.meta.env.VITE_API_BASE_URL || '/api')
    : mockApi
export const adminApi =
  apiMode === 'http'
    ? createHttpAdminApi(import.meta.env.VITE_API_BASE_URL || '/api')
    : createMockAdminApi()
