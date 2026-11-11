import type { EventTable } from '../types/index.ts'
import { readStorage, writeStorage } from './storage.ts'

export const INITIAL_TABLES: EventTable[] = Array.from(
  { length: 3 },
  (_, index) => ({
    id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    number: index + 1,
    name: `TABLE ${String(index + 1).padStart(2, '0')}`,
  }),
)

export function getMockTables(): EventTable[] {
  const saved = readStorage(
    'net:mock:tables:v1',
    (value): value is EventTable[] =>
      Array.isArray(value) &&
      value.length >= 3 &&
      value.every(
        (table) =>
          table &&
          typeof table.id === 'string' &&
          Number.isInteger(table.number) &&
          table.number > 0 &&
          typeof table.name === 'string' &&
          table.name.length <= 30,
      ) &&
      new Set(value.map((table) => table.id)).size === value.length &&
      new Set(value.map((table) => table.number)).size === value.length,
  )
  return (saved ?? INITIAL_TABLES).map((table) => ({ ...table }))
}

// 관리자 서비스에서만 호출합니다. 실제 권한·동시성 검증은 서버에서 구현해야 합니다.
export function appendMockTable(): EventTable {
  const tables = getMockTables()
  const number = Math.max(...tables.map((table) => table.number)) + 1
  const table = {
    id: crypto.randomUUID(),
    number,
    name: `TABLE ${String(number).padStart(2, '0')}`,
  }
  writeStorage('net:mock:tables:v1', [...tables, table])
  return table
}
