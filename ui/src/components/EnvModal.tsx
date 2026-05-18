import { type HeaderRow } from '../types'

interface EnvModalProps {
  envName: string
  rows: HeaderRow[]
  onChange: (rows: HeaderRow[]) => void
  onSave: () => void
  onClose: () => void
}

export default function EnvModal({
  envName,
  rows,
  onChange,
  onSave,
  onClose,
}: EnvModalProps) {
  function addRow() {
    onChange([...rows, { key: '', value: '' }])
  }

  function removeRow(i: number) {
    onChange(rows.filter((_, idx) => idx !== i))
  }

  function updateRow(i: number, field: 'key' | 'value', val: string) {
    onChange(rows.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)))
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#161b22] border border-gray-700 rounded-lg w-[500px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <span className="font-semibold text-sm">Edit environment: {envName}</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-100">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs font-mono text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="key"
                value={row.key}
                onChange={e => updateRow(i, 'key', e.target.value)}
              />
              <input
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs font-mono text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="value"
                value={row.value}
                onChange={e => updateRow(i, 'value', e.target.value)}
              />
              <button
                onClick={() => removeRow(i)}
                className="text-gray-500 hover:text-red-400 px-1 text-sm"
              >
                ×
              </button>
            </div>
          ))}
          {rows.length === 0 && (
            <p className="text-xs text-gray-600 italic">No variables</p>
          )}
        </div>
        <div className="flex justify-between items-center px-4 py-3 border-t border-gray-800">
          <button
            onClick={addRow}
            className="text-xs text-indigo-400 hover:text-indigo-300"
          >
            + Add row
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-xs text-gray-400 hover:text-gray-100 px-3 py-1.5 rounded border border-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
