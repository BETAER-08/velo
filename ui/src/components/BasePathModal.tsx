import { useState } from 'react'

interface BasePathModalProps {
  current: string
  onConfirm: (path: string) => void
  onClose: () => void
}

export default function BasePathModal({ current, onConfirm, onClose }: BasePathModalProps) {
  const [input, setInput] = useState(current)

  function handleConfirm() {
    if (input.trim()) onConfirm(input.trim())
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#161b22] border border-gray-700 rounded-lg w-[480px] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <span className="font-semibold text-sm">Base Path</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-100">✕</button>
        </div>
        <div className="p-4 space-y-3">
          {current && (
            <p className="text-xs text-gray-500 font-mono truncate">Current: {current}</p>
          )}
          <input
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-600"
            placeholder="~/.velo"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleConfirm() }}
            autoFocus
          />
          <p className="text-xs text-gray-600">
            The directory should contain <span className="font-mono">collections/</span> and <span className="font-mono">environments/</span> subdirectories.
          </p>
        </div>
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-800">
          <button
            onClick={onClose}
            className="text-xs text-gray-400 hover:text-gray-100 px-3 py-1.5 rounded border border-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
