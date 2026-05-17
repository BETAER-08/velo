import { methodBadge, type Request, type HeaderRow } from '../types'

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

  if (!basePath) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
        Set a base path above to get started
      </div>
    )
  }

  if (!selectedRequest || !selectedCollection) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
        Select a request from the sidebar
      </div>
    )
  }

  return (
    <>
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
          <div className="space-y-1">
            {editableHeaders.map((row, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className="flex-1 bg-gray-900 border border-gray-800 rounded px-2 py-1 text-xs font-mono text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="key"
                  value={row.key}
                  onChange={e => updateHeader(i, 'key', e.target.value)}
                />
                <input
                  className="flex-1 bg-gray-900 border border-gray-800 rounded px-2 py-1 text-xs font-mono text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="value"
                  value={row.value}
                  onChange={e => updateHeader(i, 'value', e.target.value)}
                />
                <button
                  onClick={() => removeHeader(i)}
                  className="text-gray-500 hover:text-red-400 px-1 text-sm"
                >
                  ×
                </button>
              </div>
            ))}
            {editableHeaders.length === 0 && (
              <p className="text-xs text-gray-600 italic">No headers</p>
            )}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-2">
            Body
          </p>
          <textarea
            className="w-full font-mono text-xs bg-gray-900 border border-gray-800 rounded p-3 text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y min-h-[120px]"
            placeholder="JSON body (optional)"
            value={editableBody}
            onChange={e => onBodyChange(e.target.value)}
            spellCheck={false}
          />
        </div>
      </div>

      <div className="shrink-0 p-4 border-t border-gray-800">
        <button
          onClick={onSend}
          disabled={loading || !selectedEnv}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded py-3 transition-colors"
        >
          {loading && (
            <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          )}
          {loading ? 'Sending…' : 'Send'}
        </button>
      </div>
    </>
  )
}
