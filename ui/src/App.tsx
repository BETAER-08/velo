import { useCallback, useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import type { Collection, Request, RequestResult } from './types'
import { describeError } from './types'
import TopBar from './components/TopBar'
import Sidebar from './components/Sidebar'
import RequestEditor from './components/RequestEditor'
import ResponsePane from './components/ResponsePane'

const BASE_PATH_STORAGE_KEY = 'velo_base_path'

export default function App() {
  const [basePath, setBasePath] = useState<string>(
    () => localStorage.getItem(BASE_PATH_STORAGE_KEY) ?? ''
  )
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
  const [bodyError, setBodyError] = useState<string | null>(null)

  useEffect(() => {
    localStorage.setItem(BASE_PATH_STORAGE_KEY, basePath)
  }, [basePath])

  const loadAll = useCallback(async () => {
    if (!basePath) return
    try {
      await invoke('set_base_path', { path: basePath })
      const [cols, envs] = await Promise.all([
        invoke<string[]>('list_collections'),
        invoke<string[]>('list_environments'),
      ])
      setCollections(cols)
      setEnvironments(envs)
      setSelectedEnv(prev => (envs.length > 0 && !prev ? envs[0] : prev))
      setError(null)
    } catch (e) {
      setError(describeError(e))
    }
  }, [basePath])

  useEffect(() => {
    if (basePath) {
      void loadAll()
    }
  }, [basePath, loadAll])

  const toggleCollection = useCallback(
    async (name: string) => {
      setExpandedCollections(prev => {
        const next = new Set(prev)
        if (next.has(name)) {
          next.delete(name)
        } else {
          next.add(name)
        }
        return next
      })
      if (!collectionData[name]) {
        try {
          const col = await invoke<Collection>('get_collection', { name })
          setCollectionData(prev => ({ ...prev, [name]: col }))
          setError(null)
        } catch (e) {
          setError(describeError(e))
        }
      }
    },
    [collectionData]
  )

  const selectRequest = useCallback((collection: string, request: Request) => {
    setSelectedCollection(collection)
    setSelectedRequest(request)
    setResponse(null)
    setBodyError(null)
  }, [])

  const sendRequest = useCallback(
    async (overrideBody: unknown | null, overrideHeaders: Record<string, string>) => {
      if (!selectedRequest || !selectedCollection || !selectedEnv) return
      setLoading(true)
      setError(null)
      try {
        const result = await invoke<RequestResult>('execute_request_with_body', {
          collectionName: selectedCollection,
          requestName: selectedRequest.name,
          envName: selectedEnv,
          overrideBody,
          overrideHeaders,
        })
        setResponse(result)
      } catch (e) {
        setError(describeError(e))
      } finally {
        setLoading(false)
      }
    },
    [selectedRequest, selectedCollection, selectedEnv]
  )

  const handleEnvironmentSaved = useCallback(() => {
    void loadAll()
  }, [loadAll])

  return (
    <div className="flex flex-col h-screen bg-[#0f1117] text-gray-100 overflow-hidden">
      <TopBar
        basePath={basePath}
        onBasePathChange={setBasePath}
        onApplyBasePath={loadAll}
        environments={environments}
        selectedEnv={selectedEnv}
        onEnvChange={setSelectedEnv}
        onError={setError}
        onEnvironmentSaved={handleEnvironmentSaved}
      />

      {(error || bodyError) && (
        <div className="flex items-center justify-between px-4 py-2 bg-red-950 border-b border-red-900 text-red-300 text-sm shrink-0">
          <span>{bodyError ?? error}</span>
          <button
            onClick={() => {
              setError(null)
              setBodyError(null)
            }}
            className="ml-4 text-red-400 hover:text-red-200"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          basePath={basePath}
          collections={collections}
          expandedCollections={expandedCollections}
          collectionData={collectionData}
          selectedRequestId={selectedRequest?.id ?? null}
          onRefresh={loadAll}
          onToggleCollection={toggleCollection}
          onSelectRequest={selectRequest}
        />

        <RequestEditor
          basePath={basePath}
          selectedRequest={selectedRequest}
          loading={loading}
          canSend={Boolean(selectedEnv)}
          onSend={sendRequest}
          onBodyError={setBodyError}
        />

        <ResponsePane response={response} />
      </div>
    </div>
  )
}
