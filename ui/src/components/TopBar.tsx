import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import type { Environment } from '../types'
import { describeError } from '../types'

interface TopBarProps {
  basePath: string
  onBasePathChange: (value: string) => void
  onApplyBasePath: () => void
  environments: string[]
  selectedEnv: string
  onEnvChange: (value: string) => void
  onError: (message: string) => void
  onEnvironmentSaved: () => void
}

export default function TopBar({
  basePath,
  onBasePathChange,
  onApplyBasePath,
  environments,
  selectedEnv,
  onEnvChange,
  onError,
  onEnvironmentSaved,
}: TopBarProps) {
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorRows, setEditorRows] = useState<Array<{ key: string; value: string }>>([])
  const [editorName, setEditorName] = useState('')
  const [editorSaving, setEditorSaving] = useState(false)

  async function openEditor() {
    if (!selectedEnv) {
      onError('Select an environment first')
      return
    }
    try {
      const env = await invoke<Environment>('get_environment', { name: selectedEnv })
      const rows = Object.entries(env.values).map(([key, value]) => ({ key, value }))
      setEditorRows(rows.length > 0 ? rows : [{ key: '', value: '' }])
      setEditorName(env.name)
      setEditorOpen(true)
    } catch (e) {
      onError(describeError(e))
    }
  }

  function updateRow(index: number, field: 'key' | 'value', value: string) {
    setEditorRows(prev => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  function addRow() {
    setEditorRows(prev => [...prev, { key: '', value: '' }])
  }

  function removeRow(index: number) {
    setEditorRows(prev => prev.filter((_, i) => i !== index))
  }

  async function saveEnvironment() {
    setEditorSaving(true)
    try {
      const values: Record<string, string> = {}
      for (const row of editorRows) {
        const key = row.key.trim()
        if (key) {
          values[key] = row.value
        }
      }
      await invoke('save_environment', { name: editorName, values })
      setEditorOpen(false)
      onEnvironmentSaved()
    } catch (e) {
      onError(describeError(e))
    } finally {
      setEditorSaving(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-2 bg-[#161b22] border-b border-gray-800 shrink-0">
        <span className="text-indigo-400 font-bold text-lg w-20 shrink-0">Velo</span>
        <input
          className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-500"
          placeholder="Base path (e.g. /home/user/.velo)"
          value={basePath}
          onChange={e => onBasePathChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') onApplyBasePath()
          }}
        />
        <select
          className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          value={selectedEnv}
          onChange={e => onEnvChange(e.target.value)}
        >
          {environments.length === 0 ? (
            <option value="">No environments</option>
          ) : (
            environments.map(env => (
              <option key={env} value={env}>
                {env}
              </option>
            ))
          )}
        </select>
        <button
          onClick={openEditor}
          disabled={!selectedEnv}
          className="text-sm text-gray-300 hover:text-white disabled:opacity-40 px-2 py-1 rounded hover:bg-gray-800"
          title="Edit environment variables"
        >
          ✏️
        </button>
      </div>

      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#161b22] border border-gray-800 rounded-lg w-[520px] max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <span className="text-sm font-semibold text-gray-200">
                Edit environment: <span className="text-indigo-400">{editorName}</span>
              </span>
              <button
                onClick={() => setEditorOpen(false)}
                className="text-gray-400 hover:text-gray-100"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {editorRows.map((row, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-gray-100 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="key"
                    value={row.key}
                    onChange={e => updateRow(index, 'key', e.target.value)}
                  />
                  <input
                    className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-gray-100 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="value"
                    value={row.value}
                    onChange={e => updateRow(index, 'value', e.target.value)}
                  />
                  <button
                    onClick={() => removeRow(index)}
                    className="text-gray-400 hover:text-red-400 px-2"
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={addRow}
                className="text-xs text-indigo-400 hover:text-indigo-300 px-2 py-1"
              >
                + Add row
              </button>
            </div>
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-800">
              <button
                onClick={() => setEditorOpen(false)}
                className="text-sm text-gray-300 hover:text-white px-3 py-1.5 rounded hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={saveEnvironment}
                disabled={editorSaving}
                className="text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3 py-1.5 rounded"
              >
                {editorSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
