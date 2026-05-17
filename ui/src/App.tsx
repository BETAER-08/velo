import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'

interface Request {
  id: string
  name: string
  method: string
  url: string
  headers: Record<string, string>
  body: unknown | null
  description: string | null
}

interface Collection {
  name: string
  description: string | null
  requests: Request[]
}

interface RequestResult {
  status: number
  headers: Record<string, string>
  body: string
  duration_ms: number
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-green-600',
  POST: 'bg-blue-600',
  PUT: 'bg-yellow-600',
  PATCH: 'bg-purple-600',
  DELETE: 'bg-red-600',
}

function methodBadge(method: string) {
  return METHOD_COLORS[method.toUpperCase()] ?? 'bg-gray-600'
}

function statusColor(status: number) {
  if (status >= 200 && status < 300) return 'text-green-400'
  if (status >= 400) return 'text-red-400'
  return 'text-gray-400'
}

function formatBody(raw: string) {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
}

export default function App() {
  const [basePath, setBasePath] = useState('')
  const [collections, setCollections] = useState<string[]>([])
  const [environments, setEnvironments] = useState<string[]>([])
  const [selectedEnv, setSelectedEnv] = useState('')
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set())
  const [collectionData, setCollectionData] = useState<Record<string, Collection>>({})
  const [response, setResponse] = useState<RequestResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [responseHeadersExpanded, setResponseHeadersExpanded] = useState(false)

  useEffect(() => {
    if (basePath) loadAll()
  }, [])

  async function loadAll() {
    if (!basePath) return
    try {
      const [cols, envs] = await Promise.all([
        invoke<string[]>('list_collections', { basePath }),
        invoke<string[]>('list_environments', { basePath }),
      ])
      setCollections(cols)
      setEnvironments(envs)
      setSelectedEnv(prev => (envs.length > 0 && !prev ? envs[0] : prev))
      setError(null)
    } catch (e) {
      setError(String(e))
    }
  }

  async function toggleCollection(name: string) {
    const next = new Set(expandedCollections)
    if (next.has(name)) {
      next.delete(name)
    } else {
      next.add(name)
      if (!collectionData[name]) {
        try {
          const col = await invoke<Collection>('get_collection', { basePath, name })
          setCollectionData(prev => ({ ...prev, [name]: col }))
          setError(null)
        } catch (e) {
          setError(String(e))
        }
      }
    }
    setExpandedCollections(next)
  }

  async function sendRequest() {
    if (!selectedRequest || !selectedCollection || !selectedEnv) return
    setLoading(true)
    setError(null)
    try {
      const result = await invoke<RequestResult>('execute_request', {
        basePath,
        collectionName: selectedCollection,
        requestName: selectedRequest.name,
        envName: selectedEnv,
      })
      setResponse(result)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#0f1117] text-gray-100 overflow-hidden">

      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-[#161b22] border-b border-gray-800 shrink-0">
        <span className="text-indigo-400 font-bold text-lg w-20 shrink-0">Velo</span>
        <input
          className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-500"
          placeholder="Base path (e.g. /home/user/.velo)"
          value={basePath}
          onChange={e => setBasePath(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') loadAll() }}
        />
        <select
          className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          value={selectedEnv}
          onChange={e => setSelectedEnv(e.target.value)}
        >
          {environments.length === 0
            ? <option value="">No environments</option>
            : environments.map(env => <option key={env} value={env}>{env}</option>)
          }
        </select>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between px-4 py-2 bg-red-950 border-b border-red-900 text-red-300 text-sm shrink-0">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-4 text-red-400 hover:text-red-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <div className="w-60 shrink-0 flex flex-col bg-[#161b22] border-r border-gray-800 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800 shrink-0">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Collections</span>
            <button
              onClick={loadAll}
              className="text-xs text-gray-400 hover:text-gray-100 px-2 py-1 rounded hover:bg-gray-800"
            >
              ↻ Refresh
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {!basePath ? (
              <p className="text-xs text-gray-500 p-4">Set a base path to load collections.</p>
            ) : collections.length === 0 ? (
              <p className="text-xs text-gray-500 p-4">No collections found.</p>
            ) : (
              collections.map(col => (
                <div key={col}>
                  <button
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800"
                    onClick={() => toggleCollection(col)}
                  >
                    <span className="text-gray-500 text-xs w-3 shrink-0">
                      {expandedCollections.has(col) ? '▾' : '▸'}
                    </span>
                    <span className="truncate">{col}</span>
                  </button>
                  {expandedCollections.has(col) && collectionData[col] && (
                    <div>
                      {collectionData[col].requests.map(req => (
                        <button
                          key={req.id}
                          onClick={() => { setSelectedCollection(col); setSelectedRequest(req) }}
                          className={`w-full text-left flex items-center gap-2 pl-7 pr-3 py-1.5 text-xs hover:bg-gray-800 ${
                            selectedRequest?.id === req.id
                              ? 'bg-indigo-900/40 text-indigo-400'
                              : 'text-gray-400'
                          }`}
                        >
                          <span className={`shrink-0 text-[9px] font-bold px-1 py-0.5 rounded text-white ${methodBadge(req.method)}`}>
                            {req.method.toUpperCase()}
                          </span>
                          <span className="truncate">{req.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0d1117] border-r border-gray-800">
          {!basePath ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
              Set a base path above to get started
            </div>
          ) : !selectedRequest ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
              Select a request from the sidebar
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                <div className="flex items-start gap-3">
                  <span className={`shrink-0 text-xs font-bold px-2 py-1 rounded text-white ${methodBadge(selectedRequest.method)}`}>
                    {selectedRequest.method.toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-200 font-mono break-all leading-6">
                    {selectedRequest.url}
                  </span>
                </div>

                {selectedRequest.description && (
                  <p className="text-xs text-gray-500">{selectedRequest.description}</p>
                )}

                {Object.keys(selectedRequest.headers).length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-2">Headers</p>
                    <div className="rounded border border-gray-800 overflow-hidden">
                      {Object.entries(selectedRequest.headers).map(([k, v]) => (
                        <div key={k} className="flex text-xs border-b border-gray-800 last:border-0">
                          <span className="w-1/3 px-3 py-2 bg-gray-900 text-gray-400 font-mono truncate">{k}</span>
                          <span className="flex-1 px-3 py-2 text-gray-300 font-mono break-all">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedRequest.body != null && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-2">Body</p>
                    <pre className="font-mono text-xs bg-gray-900 border border-gray-800 rounded p-3 text-gray-300 overflow-auto whitespace-pre-wrap break-all">
                      {JSON.stringify(selectedRequest.body, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="shrink-0 p-4 border-t border-gray-800">
                <button
                  onClick={sendRequest}
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
          )}
        </div>

        {/* Response panel */}
        <div className="w-[360px] shrink-0 flex flex-col bg-[#0f1117] overflow-hidden">
          {!response ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm px-6 text-center">
              Send a request to see the response
            </div>
          ) : (
            <>
              <div className="shrink-0 flex items-center gap-4 px-4 py-3 border-b border-gray-800">
                <span className={`text-2xl font-bold ${statusColor(response.status)}`}>
                  {response.status}
                </span>
                <span className="text-xs text-gray-500">{response.duration_ms} ms</span>
              </div>

              <div className="flex-1 overflow-y-auto flex flex-col">
                <div className="shrink-0 border-b border-gray-800">
                  <button
                    onClick={() => setResponseHeadersExpanded(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500 hover:bg-gray-900"
                  >
                    <span>Headers ({Object.keys(response.headers).length})</span>
                    <span>{responseHeadersExpanded ? '▾' : '▸'}</span>
                  </button>
                  {responseHeadersExpanded && (
                    <div className="border-t border-gray-800">
                      {Object.entries(response.headers).map(([k, v]) => (
                        <div key={k} className="flex text-xs border-b border-gray-800 last:border-0">
                          <span className="w-2/5 px-3 py-1.5 bg-gray-900 text-gray-400 font-mono truncate">{k}</span>
                          <span className="flex-1 px-3 py-1.5 text-gray-300 font-mono break-all">{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-hidden p-4 flex flex-col gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 shrink-0">Body</p>
                  <pre className="flex-1 overflow-auto font-mono text-xs bg-gray-950 border border-gray-800 rounded p-4 text-gray-300 whitespace-pre-wrap break-all">
                    {formatBody(response.body)}
                  </pre>
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  )
}
