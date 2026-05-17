import { useEffect, useState } from 'react'
import type { HeaderRow, Request } from '../types'
import { methodBadge } from '../types'

interface RequestEditorProps {
  basePath: string
  selectedRequest: Request | null
  loading: boolean
  canSend: boolean
  onSend: (body: unknown | null, headers: Record<string, string>) => void
  onBodyError: (message: string | null) => void
}

export default function RequestEditor({
  basePath,
  selectedRequest,
  loading,
  canSend,
  onSend,
  onBodyError,
}: RequestEditorProps) {
  const [editableBody, setEditableBody] = useState<string>('')
  const [hasBody, setHasBody] = useState(false)
  const [editableHeaders, setEditableHeaders] = useState<HeaderRow[]>([])

  useEffect(() => {
    if (!selectedRequest) {
      setEditableBody('')
      setHasBody(false)
      setEditableHeaders([])
      return
    }
    if (selectedRequest.body != null) {
      setEditableBody(JSON.stringify(selectedRequest.body, null, 2))
      setHasBody(true)
    } else {
      setEditableBody('')
      setHasBody(false)
    }
    const rows = Object.entries(selectedRequest.headers).map(([key, value]) => ({ key, value }))
    setEditableHeaders(rows)
    onBodyError(null)
  }, [selectedRequest, onBodyError])

  function updateHeader(index: number, field: 'key' | 'value', value: string) {
    setEditableHeaders(prev =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    )
  }

  function addHeader() {
    setEditableHeaders(prev => [...prev, { key: '', value: '' }])
  }

  function removeHeader(index: number) {
    setEditableHeaders(prev => prev.filter((_, i) => i !== index))
  }

  function handleSend() {
    if (!selectedRequest) return
    const headersOut: Record<string, string> = {}
    for (const row of editableHeaders) {
      const key = row.key.trim()
      if (key) {
        headersOut[key] = row.value
      }
    }
    let bodyOut: unknown | null = null
    if (hasBody) {
      const trimmed = editableBody.trim()
      if (trimmed.length > 0) {
        try {
          bodyOut = JSON.parse(editableBody)
        } catch {
          onBodyError('Body is not valid JSON')
          return
        }
      }
    }
    onBodyError(null)
    onSend(bodyOut, headersOut)
  }

  if (!basePath) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-[#0d1117] border-r border-gray-800">
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
          Set a base path above to get started
        </div>
      </div>
    )
  }

  if (!selectedRequest) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-[#0d1117] border-r border-gray-800">
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
          Select a request from the sidebar
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0d1117] border-r border-gray-800">
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div className="flex items-start gap-3">
          <span
            className={`shrink-0 text-xs font-bold px-2 py-1 rounded text-white ${methodBadge(selectedRequest.method)}`}
          >
            {selectedRequest.method.toUpperCase()}
          </span>
          <span className="text-sm text-gray-200 font-mono break-all leading-6">
            {selectedRequest.url}
          </span>
        </div>

        {selectedRequest.description && (
          <p className="text-xs text-gray-500">{selectedRequest.description}</p>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
              Headers
            </p>
            <button
              onClick={addHeader}
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              + Add
            </button>
          </div>
          <div className="rounded border border-gray-800 overflow-hidden">
            {editableHeaders.length === 0 ? (
              <p className="text-xs text-gray-600 p-3">No headers</p>
            ) : (
              editableHeaders.map((row, index) => (
                <div key={index} className="flex text-xs border-b border-gray-800 last:border-0">
                  <input
                    className="w-1/3 px-3 py-2 bg-gray-900 text-gray-200 font-mono focus:outline-none focus:bg-gray-800"
                    value={row.key}
                    placeholder="header"
                    onChange={e => updateHeader(index, 'key', e.target.value)}
                  />
                  <input
                    className="flex-1 px-3 py-2 bg-[#0d1117] text-gray-200 font-mono focus:outline-none focus:bg-gray-800"
                    value={row.value}
                    placeholder="value"
                    onChange={e => updateHeader(index, 'value', e.target.value)}
                  />
                  <button
                    onClick={() => removeHeader(index)}
                    className="px-3 text-gray-500 hover:text-red-400"
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
              Body
            </p>
            <label className="flex items-center gap-2 text-[10px] text-gray-400">
              <input
                type="checkbox"
                checked={hasBody}
                onChange={e => setHasBody(e.target.checked)}
              />
              Include JSON body
            </label>
          </div>
          {hasBody ? (
            <textarea
              className="font-mono text-xs bg-gray-900 border border-gray-800 rounded p-3 text-gray-200 w-full min-h-[180px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={editableBody}
              onChange={e => setEditableBody(e.target.value)}
              spellCheck={false}
            />
          ) : (
            <p className="text-xs text-gray-600 px-3 py-2 border border-gray-800 rounded">
              No body
            </p>
          )}
        </div>
      </div>

      <div className="shrink-0 p-4 border-t border-gray-800">
        <button
          onClick={handleSend}
          disabled={loading || !canSend}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded py-3 transition-colors"
        >
          {loading && (
            <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          )}
          {loading ? 'Sending…' : 'Send'}
        </button>
      </div>
    </div>
  )
}
