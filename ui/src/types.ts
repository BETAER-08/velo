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

export interface Environment {
  name: string
  values: Record<string, string>
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

export interface HeaderRow {
  key: string
  value: string
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

export function isCommandError(value: unknown): value is CommandError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value &&
    typeof (value as { code: unknown }).code === 'string' &&
    typeof (value as { message: unknown }).message === 'string'
  )
}

export function describeError(err: unknown): string {
  if (isCommandError(err)) {
    switch (err.code) {
      case 'COLLECTION_NOT_FOUND':
        return `Collection not found: ${err.message}`
      case 'ENVIRONMENT_NOT_FOUND':
        return `Environment not found: ${err.message}`
      case 'REQUEST_NOT_FOUND':
        return `Request not found: ${err.message}`
      case 'NETWORK_ERROR':
        return `Network error: ${err.message}`
      case 'INVALID_STATE':
        return err.message
      default:
        return err.message
    }
  }
  if (err instanceof Error) return err.message
  return String(err)
}
