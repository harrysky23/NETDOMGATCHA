import type { NetApi } from './contracts'
import { mockApi } from './mockApi'
import { createHttpApi } from './httpApi'

export const apiMode = import.meta.env.VITE_API_MODE === 'http' ? 'http' : 'mock'
export const api: NetApi = apiMode === 'http'
  ? createHttpApi(import.meta.env.VITE_API_BASE_URL || '/api') : mockApi
