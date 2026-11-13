import { ApiError, type EventTable } from '../types/index.ts'
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

export function normalizeTableName(value: string) {
  const name = value.trim()
  if (
    !name ||
    Array.from(name).length > 30 ||
    /[\u0000-\u001f\u007f]/u.test(name)
  )
    throw new ApiError(
      'VALIDATION_ERROR',
      '그룹 이름은 1–30자로 입력해 주세요.',
    )
  return name
}

export function renameMockTable(id: string, value: string): EventTable {
  const tables = getMockTables()
  const table = tables.find((t) => t.id === id)
  if (!table)
    throw new ApiError('TABLE_NOT_FOUND', '존재하지 않는 테이블이에요.')
  const renamed = { ...table, name: normalizeTableName(value) }
  writeStorage(
    'net:mock:tables:v1',
    tables.map((t) => (t.id === id ? renamed : t)),
  )
  return renamed
}

export function appendMockTable(name?: string): EventTable {
  const tables = getMockTables()
  const number = Math.max(...tables.map((table) => table.number)) + 1
  const table = {
    id: crypto.randomUUID(),
    number,
    name:
      name === undefined
        ? `TABLE ${String(number).padStart(2, '0')}`
        : normalizeTableName(name),
  }
  writeStorage('net:mock:tables:v1', [...tables, table])
  return table
}
