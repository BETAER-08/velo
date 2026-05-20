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
import Splitter from './components/Splitter'
import { Icons } from './components/Icon'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

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

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const stored = localStorage.getItem('velo_sidebar_width')
    return stored ? Math.max(180, Math.min(480, parseInt(stored, 10))) : 240
  })
  const [responseWidth, setResponseWidth] = useState(() => {
    const stored = localStorage.getItem('velo_response_width')
    return stored ? Math.max(280, Math.min(720, parseInt(stored, 10))) : 420
  })

  useEffect(() => {
    localStorage.setItem('velo_base_path', basePath)
  }, [basePath])

  useEffect(() => {
    localStorage.setItem('velo_sidebar_width', String(sidebarWidth))
  }, [sidebarWidth])

  useEffect(() => {
    localStorage.setItem('velo_response_width', String(responseWidth))
  }, [responseWidth])

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

  useKeyboardShortcuts({
    onSend: () => {
      if (selectedRequest && selectedCollection && selectedEnv && !loading) {
        sendRequest()
      }
    },
    onRefresh: loadAll,
    onOpenSettings: () => setShowSettingsModal(true),
    onCloseModal: () => {
      if (showEnvModal) setShowEnvModal(false)
      else if (showSettingsModal) setShowSettingsModal(false)
    },
  })

  return (
    <div className="flex flex-col h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)] overflow-hidden">
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
        <div
          role="alert"
          className="flex items-start gap-2 px-4 py-2.5 bg-red-950/40 border-b border-[var(--color-danger)]/30 text-red-300 text-xs shrink-0"
        >
          <Icons.AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[var(--color-danger)]" />
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            aria-label="Dismiss error"
            className="text-red-400 hover:text-red-200 shrink-0"
          >
            <Icons.X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div style={{ width: sidebarWidth }} className="shrink-0 h-full">
          <Sidebar
            basePath={basePath}
            collections={collections}
            expandedCollections={expandedCollections}
            collectionData={collectionData}
            selectedRequest={selectedRequest}
            onToggleCollection={toggleCollection}
            onSelectRequest={handleSelectRequest}
          />
        </div>

        <Splitter
          ariaLabel="Resize sidebar"
          onResize={delta => setSidebarWidth(w => Math.max(180, Math.min(480, w + delta)))}
        />

        <div className="flex-1 min-w-[320px] flex flex-col overflow-hidden bg-[var(--color-bg-base)]">
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

        <Splitter
          ariaLabel="Resize response pane"
          onResize={delta => setResponseWidth(w => Math.max(280, Math.min(720, w - delta)))}
        />

        <div style={{ width: responseWidth }} className="shrink-0 h-full">
          <ResponsePane response={response} loading={loading} />
        </div>
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
