export interface Request {
  id: string
  name: string
  method: string
  url: string
  headers: Record<string, string>
  body: unknown | null
  description: string | null
}

export interface Collection {
  name: string
  description: string | null
  requests: Request[]
}

export interface RequestResult {
  status: number
  headers: Record<string, string>
  body: string
  duration_ms: number
}

export interface CommandError {
  code: string
  message: string
}

export interface Environment {
  name: string
  values: Record<string, string>
}

export interface HeaderRow {
  key: string
  value: string
}

export function isCommandError(e: unknown): e is CommandError {
  return (
    typeof e === 'object' &&
    e !== null &&
    'code' in e &&
    'message' in e
  )
}

export const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-green-600',
  POST: 'bg-blue-600',
  PUT: 'bg-yellow-600',
  PATCH: 'bg-purple-600',
  DELETE: 'bg-red-600',
}

export function methodBadge(method: string): string {
  return METHOD_COLORS[method.toUpperCase()] ?? 'bg-gray-600'
}

export function statusColor(status: number): string {
  if (status >= 200 && status < 300) return 'text-green-400'
  if (status >= 400) return 'text-red-400'
  return 'text-gray-400'
}

export function formatBody(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
}
