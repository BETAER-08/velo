import { useState, useEffect } from 'react'
import { statusColor, formatBody, type RequestResult } from '../types'
import { Icons } from './Icon'

interface Props {
  response: RequestResult | null
  loading: boolean
}

const STATUS_TEXT: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  204: 'No Content',
  301: 'Moved Permanently',
  302: 'Found',
  304: 'Not Modified',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  408: 'Request Timeout',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
}

function statusText(s: number): string {
  return STATUS_TEXT[s] ?? ''
}

export default function ResponsePane({ response, loading }: Props) {
  const [activeTab, setActiveTab] = useState<'body' | 'headers' | 'raw'>('body')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setActiveTab('body')
    setCopied(false)
  }, [response])

  async function copyContent() {
    if (!response) return
    const text = activeTab === 'headers'
      ? Object.entries(response.headers).map(([k, v]) => `${k}: ${v}`).join('\n')
      : activeTab === 'body'
        ? formatBody(response.body)
        : response.body
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  if (loading) {
    return (
      <div
        className="h-full w-full flex flex-col items-center justify-center gap-3 bg-[var(--color-bg-base)]"
        role="status"
        aria-live="polite"
      >
        <Icons.Loader2 className="w-6 h-6 animate-spin text-[var(--color-accent)]" />
        <span className="text-xs text-[var(--color-text-secondary)]">Awaiting response…</span>
      </div>
    )
  }

  if (!response) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-3 px-6 text-center bg-[var(--color-bg-base)]">
        <Icons.Send className="w-8 h-8 text-[var(--color-text-muted)]" />
        <p className="text-sm text-[var(--color-text-secondary)]">No response yet</p>
        <p className="text-xs text-[var(--color-text-muted)]">
          Send a request to see results here.
        </p>
      </div>
    )
  }

  const text = statusText(response.status)
  const headerCount = Object.keys(response.headers).length

  return (
    <div className="h-full w-full flex flex-col bg-[var(--color-bg-base)] overflow-hidden">
      <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className={`text-2xl font-bold tabular-nums ${statusColor(response.status)}`}>
            {response.status}
          </span>
          {text && (
            <span className="text-xs text-[var(--color-text-secondary)] truncate">{text}</span>
          )}
        </div>
        <span className="text-xs text-[var(--color-text-muted)] tabular-nums shrink-0">
          {response.duration_ms} ms
        </span>
      </div>

      <div
        className="shrink-0 flex items-center border-b border-[var(--color-border-subtle)]"
        role="tablist"
        aria-label="Response sections"
      >
        {(['body', 'headers', 'raw'] as const).map(tab => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls={`response-panel-${tab}`}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-[var(--color-accent-hover)] border-b-2 border-[var(--color-accent)] -mb-px'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            {tab === 'body' ? 'Body' : tab === 'headers' ? `Headers · ${headerCount}` : 'Raw'}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={copyContent}
          aria-label={`Copy ${activeTab}`}
          className="flex items-center gap-1 mr-3 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] px-2 py-1 rounded hover:bg-[var(--color-bg-elevated)]"
        >
          {copied ? <Icons.Check className="w-3.5 h-3.5 text-[var(--color-success)]" /> : <Icons.Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col" id={`response-panel-${activeTab}`} role="tabpanel">
        {activeTab === 'body' && (
          <pre className="flex-1 overflow-auto font-mono text-xs bg-[var(--color-bg-base)] p-4 text-[var(--color-text-primary)] whitespace-pre-wrap break-all m-0">
            {formatBody(response.body)}
          </pre>
        )}
        {activeTab === 'headers' && (
          <div className="flex-1 overflow-auto">
            {Object.entries(response.headers).map(([k, v]) => (
              <div key={k} className="flex text-xs border-b border-[var(--color-border-subtle)] last:border-0">
                <span className="w-2/5 px-3 py-2 bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] font-mono truncate" title={k}>
                  {k}
                </span>
                <span className="flex-1 px-3 py-2 text-[var(--color-text-primary)] font-mono break-all">{v}</span>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'raw' && (
          <pre className="flex-1 overflow-auto font-mono text-xs bg-[var(--color-bg-base)] p-4 text-[var(--color-text-primary)] whitespace-pre-wrap break-all m-0">
            {response.body}
          </pre>
        )}
      </div>
    </div>
  )
}
