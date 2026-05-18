import { useState, useEffect, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import {
  isCommandError,
  type Collection,
  type Request,
  type RequestResult,
  type Environment,
  type HeaderRow,
} from './types'
import TopBar from './components/TopBar'
import Sidebar from './components/Sidebar'
import RequestEditor from './components/RequestEditor'
import ResponsePane from './components/ResponsePane'
import EnvModal from './components/EnvModal'
import BasePathModal from './components/BasePathModal'

function formatError(e: unknown): string {
  if (isCommandError(e)) return `${e.code}: ${e.message}`
  return String(e)
}

export default function App() {
  const [basePath, setBasePath] = useState(() => localStorage.getItem('velo_base_path') ?? '')
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
  const [editableBody, setEditableBody] = useState('')
  const [editableHeaders, setEditableHeaders] = useState<HeaderRow[]>([])
  const [showEnvModal, setShowEnvModal] = useState(false)
  const [envModalRows, setEnvModalRows] = useState<HeaderRow[]>([])
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  useEffect(() => {
    localStorage.setItem('velo_base_path', basePath)
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
      setError(formatError(e))
    }
  }, [basePath])

  useEffect(() => {
    if (basePath) loadAll()
  }, [basePath, loadAll])

  useEffect(() => {
    setEditableBody(
      selectedRequest?.body != null
        ? JSON.stringify(selectedRequest.body, null, 2)
        : ''
    )
    setEditableHeaders(
      selectedRequest
        ? Object.entries(selectedRequest.headers).map(([key, value]) => ({ key, value }))
        : []
    )
  }, [selectedRequest])

  async function toggleCollection(name: string) {
    const next = new Set(expandedCollections)
    if (next.has(name)) {
      next.delete(name)
    } else {
      next.add(name)
      if (!collectionData[name]) {
        try {
          const col = await invoke<Collection>('get_collection', { name })
          setCollectionData(prev => ({ ...prev, [name]: col }))
          setError(null)
        } catch (e) {
          setError(formatError(e))
        }
      }
    }
    setExpandedCollections(next)
  }

  function handleSelectRequest(col: string, req: Request) {
    setSelectedCollection(col)
    setSelectedRequest(req)
  }

  async function sendRequest() {
    if (!selectedRequest || !selectedCollection || !selectedEnv) return

    const trimmedBody = editableBody.trim()
    const invokeParams: Record<string, unknown> = {
      collectionName: selectedCollection,
      requestName: selectedRequest.name,
      envName: selectedEnv,
    }

    if (trimmedBody !== '') {
      try {
        invokeParams.overrideBody = JSON.parse(trimmedBody)
      } catch {
        setError('Body is not valid JSON')
        return
      }
    } else if (selectedRequest.body !== null && selectedRequest.body !== undefined) {
      invokeParams.overrideBody = null
    }

    const overrideHeaders: Record<string, string> = {}
    for (const row of editableHeaders) {
      if (row.key.trim() !== '') {
        overrideHeaders[row.key.trim()] = row.value
      }
    }
    invokeParams.overrideHeaders = overrideHeaders

    setLoading(true)
    setError(null)
    try {
      const result = await invoke<RequestResult>('execute_request_with_body', invokeParams)
      setResponse(result)
    } catch (e) {
      if (isCommandError(e)) {
        switch (e.code) {
          case 'COLLECTION_NOT_FOUND':
            setError('Collection not found')
            break
          case 'REQUEST_NOT_FOUND':
            setError('Request not found')
            break
          case 'ENVIRONMENT_NOT_FOUND':
            setError('Environment not found — check the selected environment')
            break
          case 'NETWORK_ERROR':
            setError(`Network error: ${e.message}`)
            break
          default:
            setError(`Error: ${e.message}`)
        }
      } else {
        setError(String(e))
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleOpenEnvEdit() {
    if (!selectedEnv) return
    try {
      const env = await invoke<Environment>('get_environment', { name: selectedEnv })
      setEnvModalRows(
        Object.entries(env.values).map(([key, value]) => ({ key, value }))
      )
      setShowEnvModal(true)
    } catch (e) {
      setError(formatError(e))
    }
  }

  async function handleSaveEnv() {
    if (!selectedEnv) return
    const values: Record<string, string> = Object.fromEntries(
      envModalRows
        .filter(r => r.key.trim() !== '')
        .map(r => [r.key.trim(), r.value])
    )
    try {
      await invoke('save_environment', { name: selectedEnv, values })
      setShowEnvModal(false)
    } catch (e) {
      setError(formatError(e))
    }
  }

  function handleConfirmBasePath(path: string) {
    setBasePath(path)
    setShowSettingsModal(false)
  }

  return (
    <div className="flex flex-col h-screen bg-[#0f1117] text-gray-100 overflow-hidden">
      <TopBar
        basePath={basePath}
        environments={environments}
        selectedEnv={selectedEnv}
        onEnvChange={setSelectedEnv}
        onRefresh={loadAll}
        onEditEnv={handleOpenEnvEdit}
        onOpenSettings={() => setShowSettingsModal(true)}
      />

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

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          basePath={basePath}
          collections={collections}
          expandedCollections={expandedCollections}
          collectionData={collectionData}
          selectedRequest={selectedRequest}
          onToggleCollection={toggleCollection}
          onSelectRequest={handleSelectRequest}
        />

        <div className="flex-1 flex flex-col overflow-hidden bg-[#0d1117] border-r border-gray-800">
          <RequestEditor
            basePath={basePath}
            selectedCollection={selectedCollection}
            selectedRequest={selectedRequest}
            selectedEnv={selectedEnv}
            editableBody={editableBody}
            onBodyChange={setEditableBody}
            editableHeaders={editableHeaders}
            onHeadersChange={setEditableHeaders}
            loading={loading}
            onSend={sendRequest}
          />
        </div>

        <ResponsePane response={response} />
      </div>

      {showEnvModal && selectedEnv && (
        <EnvModal
          envName={selectedEnv}
          rows={envModalRows}
          onChange={setEnvModalRows}
          onSave={handleSaveEnv}
          onClose={() => setShowEnvModal(false)}
        />
      )}

      {showSettingsModal && (
        <BasePathModal
          current={basePath}
          onConfirm={handleConfirmBasePath}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </div>
  )
}
