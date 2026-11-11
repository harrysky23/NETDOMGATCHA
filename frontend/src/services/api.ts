import type { NetApi } from './contracts'
import { mockApi } from './mockApi'

// Phase 2: 같은 계약을 구현하는 HTTP 어댑터로 이 주입 지점만 교체합니다.
export const api: NetApi = mockApi
