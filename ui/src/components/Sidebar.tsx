import type { Collection, Request } from '../types'
import { methodBadge } from '../types'

interface SidebarProps {
  basePath: string
  collections: string[]
  expandedCollections: Set<string>
  collectionData: Record<string, Collection>
  selectedRequestId: string | null
  onRefresh: () => void
  onToggleCollection: (name: string) => void
  onSelectRequest: (collection: string, request: Request) => void
}

export default function Sidebar({
  basePath,
  collections,
  expandedCollections,
  collectionData,
  selectedRequestId,
  onRefresh,
  onToggleCollection,
  onSelectRequest,
}: SidebarProps) {
  return (
    <div className="w-60 shrink-0 flex flex-col bg-[#161b22] border-r border-gray-800 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800 shrink-0">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
          Collections
        </span>
        <button
          onClick={onRefresh}
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
                onClick={() => onToggleCollection(col)}
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
                      onClick={() => onSelectRequest(col, req)}
                      className={`w-full text-left flex items-center gap-2 pl-7 pr-3 py-1.5 text-xs hover:bg-gray-800 ${
                        selectedRequestId === req.id
                          ? 'bg-indigo-900/40 text-indigo-400'
                          : 'text-gray-400'
                      }`}
                    >
                      <span
                        className={`shrink-0 text-[9px] font-bold px-1 py-0.5 rounded text-white ${methodBadge(req.method)}`}
                      >
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
  )
}
