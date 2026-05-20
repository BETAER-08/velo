import { useState } from 'react'
import { methodBadge, type Request, type HeaderRow } from '../types'
import { Icons } from './Icon'

interface Props {
  basePath: string
  selectedCollection: string | null
  selectedRequest: Request | null
  selectedEnv: string
  editableBody: string
  onBodyChange: (body: string) => void
  editableHeaders: HeaderRow[]
  onHeadersChange: (headers: HeaderRow[]) => void
  loading: boolean
  onSend: () => void
}

function isValidJSON(text: string): boolean {
  if (text.trim() === '') return true
  try {
    JSON.parse(text)
    return true
  } catch {
    return false
  }
}

export default function RequestEditor({
  basePath,
  selectedCollection,
  selectedRequest,
  selectedEnv,
  editableBody,
  onBodyChange,
  editableHeaders,
  onHeadersChange,
  loading,
  onSend,
}: Props) {
  const [activeSection, setActiveSection] = useState<'headers' | 'body'>('body')

  function addHeader() {
    onHeadersChange([...editableHeaders, { key: '', value: '' }])
  }

  function removeHeader(i: number) {
    onHeadersChange(editableHeaders.filter((_, idx) => idx !== i))
  }

  function updateHeader(i: number, field: 'key' | 'value', val: string) {
    onHeadersChange(
      editableHeaders.map((row, idx) => (idx === i ? { ...row, [field]: val } : row))
    )
  }

  function formatJSON() {
    try {
      const parsed = JSON.parse(editableBody)
      onBodyChange(JSON.stringify(parsed, null, 2))
    } catch {
      return
    }
  }

  if (!basePath) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 text-center">
        <Icons.Zap className="w-12 h-12 text-[var(--color-accent)]" />
        <div>
          <p className="text-[var(--color-text-primary)] font-semibold mb-1">Welcome to Velo</p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Set a base path to load your collections and environments.
          </p>
        </div>
        <div className="w-full max-w-sm bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-md text-left p-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-2">
            Expected directory structure
          </p>
          <pre className="text-xs font-mono text-[var(--color-text-secondary)] leading-relaxed m-0">
{`~/.velo/
├── collections/
│   └── api-tests.yaml
└── environments/
    └── dev.yaml`}
          </pre>
        </div>
        <p className="text-xs text-[var(--color-text-muted)]">
          Open Settings to configure your base path.
        </p>
      </div>
    )
  }

  if (!selectedRequest || !selectedCollection) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
        <Icons.FileText className="w-8 h-8 text-[var(--color-text-muted)]" />
        <p className="text-sm text-[var(--color-text-secondary)]">No request selected</p>
        <p className="text-xs text-[var(--color-text-muted)]">
          Select a request from the sidebar to start.
        </p>
      </div>
    )
  }

  const bodyValid = isValidJSON(editableBody)
  const headerCount = editableHeaders.filter(h => h.key.trim()).length

  return (
    <>
      <div className="shrink-0 px-5 py-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-base)]">
        <div className="flex items-center gap-3">
          <span
            className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded text-white ${methodBadge(selectedRequest.method)}`}
          >
            {selectedRequest.method.toUpperCase()}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
              {selectedRequest.name}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] font-mono truncate" title={selectedRequest.url}>
              {selectedRequest.url}
            </p>
          </div>
        </div>
        {selectedRequest.description && (
          <p className="text-xs text-[var(--color-text-secondary)] mt-2">{selectedRequest.description}</p>
        )}
      </div>

      <div className="shrink-0 flex border-b border-[var(--color-border-subtle)] px-5">
        <button
          onClick={() => setActiveSection('headers')}
          role="tab"
          aria-selected={activeSection === 'headers'}
          className={`px-3 py-2 text-xs font-medium transition-colors ${
            activeSection === 'headers'
              ? 'text-[var(--color-accent-hover)] border-b-2 border-[var(--color-accent)] -mb-px'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
          }`}
        >
          Headers · {headerCount}
        </button>
        <button
          onClick={() => setActiveSection('body')}
          role="tab"
          aria-selected={activeSection === 'body'}
          className={`px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1.5 ${
            activeSection === 'body'
              ? 'text-[var(--color-accent-hover)] border-b-2 border-[var(--color-accent)] -mb-px'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
          }`}
        >
          Body
          {editableBody.trim() && !bodyValid && (
            <Icons.AlertCircle className="w-3 h-3 text-[var(--color-danger)]" />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {activeSection === 'headers' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
                Request Headers
              </p>
              <button
                onClick={addHeader}
                className="flex items-center gap-1 text-xs text-[var(--color-accent-hover)] hover:text-[var(--color-accent)]"
                aria-label="Add header"
              >
                <Icons.Plus className="w-3.5 h-3.5" />
                Add header
              </button>
            </div>
            <div className="space-y-1.5">
              {editableHeaders.map((row, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    className="flex-1 bg-[var(--color-bg-input)] border border-[var(--color-border-subtle)] rounded px-2.5 py-1.5 text-xs font-mono text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] placeholder-[var(--color-text-muted)]"
                    placeholder="Header name"
                    value={row.key}
                    onChange={e => updateHeader(i, 'key', e.target.value)}
                    aria-label={`Header ${i + 1} key`}
                  />
                  <input
                    className="flex-1 bg-[var(--color-bg-input)] border border-[var(--color-border-subtle)] rounded px-2.5 py-1.5 text-xs font-mono text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] placeholder-[var(--color-text-muted)]"
                    placeholder="Value"
                    value={row.value}
                    onChange={e => updateHeader(i, 'value', e.target.value)}
                    aria-label={`Header ${i + 1} value`}
                  />
                  <button
                    onClick={() => removeHeader(i)}
                    aria-label={`Remove header ${i + 1}`}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)] p-1 rounded hover:bg-[var(--color-bg-elevated)]"
                  >
                    <Icons.Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {editableHeaders.length === 0 && (
                <p className="text-xs text-[var(--color-text-muted)] italic">No headers</p>
              )}
            </div>
          </div>
        )}

        {activeSection === 'body' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
                Request Body · JSON
              </p>
              <div className="flex items-center gap-3">
                {editableBody.trim() && (
                  <>
                    <button
                      onClick={formatJSON}
                      disabled={!bodyValid}
                      className="text-xs text-[var(--color-accent-hover)] hover:text-[var(--color-accent)] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Format
                    </button>
                    <button
                      onClick={() => onBodyChange('')}
                      className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>
            </div>
            <textarea
              className={`w-full font-mono text-xs bg-[var(--color-bg-input)] border rounded p-3 text-[var(--color-text-primary)] focus:outline-none resize-y min-h-[200px] placeholder-[var(--color-text-muted)] ${
                editableBody.trim() && !bodyValid
                  ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)]'
                  : 'border-[var(--color-border-subtle)] focus:border-[var(--color-accent)]'
              }`}
              placeholder='{ "key": "value" }'
              value={editableBody}
              onChange={e => onBodyChange(e.target.value)}
              spellCheck={false}
              aria-label="Request body"
              aria-invalid={editableBody.trim() !== '' && !bodyValid}
            />
            {editableBody.trim() && !bodyValid && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--color-danger)]">
                <Icons.AlertCircle className="w-3.5 h-3.5" />
                Invalid JSON syntax
              </p>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 p-4 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
        <button
          onClick={onSend}
          disabled={loading || !selectedEnv || (editableBody.trim() !== '' && !bodyValid)}
          aria-label="Send request"
          title="Send (Ctrl+Enter)"
          className="w-full flex items-center justify-center gap-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-md py-2.5 transition-colors text-sm"
        >
          {loading ? (
            <Icons.Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Icons.Send className="w-4 h-4" />
          )}
          {loading ? 'Sending…' : 'Send'}
          {!loading && (
            <kbd className="ml-1 text-[10px] font-mono opacity-70 border border-white/30 rounded px-1 py-0.5">
              ⌘⏎
            </kbd>
          )}
        </button>
      </div>
    </>
  )
}
