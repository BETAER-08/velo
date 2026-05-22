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

export const METHOD_BG: Record<string, string> = {
  GET:    'var(--method-get)',
  POST:   'var(--method-post)',
  PUT:    'var(--method-put)',
  PATCH:  'var(--method-patch)',
  DELETE: 'var(--method-delete)',
}

export function methodColor(method: string): string {
  return METHOD_BG[method.toUpperCase()] ?? 'var(--method-other)'
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(2)} MB`
}

export function statusColor(status: number): string {
  if (status >= 200 && status < 300) return 'text-[var(--color-success)]'
  if (status >= 400) return 'text-[var(--color-danger)]'
  return 'text-[var(--color-text-secondary)]'
}

export function formatBody(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
}
