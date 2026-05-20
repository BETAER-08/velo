import { useState } from 'react'
import { methodBadge, type Collection, type Request } from '../types'
import { Icons } from './Icon'

interface Props {
  basePath: string
  collections: string[]
  expandedCollections: Set<string>
  collectionData: Record<string, Collection>
  selectedRequest: Request | null
  onToggleCollection: (name: string) => void
  onSelectRequest: (col: string, req: Request) => void
}

export default function Sidebar({
  basePath,
  collections,
  expandedCollections,
  collectionData,
  selectedRequest,
  onToggleCollection,
  onSelectRequest,
}: Props) {
  const [filter, setFilter] = useState('')
  const [loadingCol, setLoadingCol] = useState<string | null>(null)

  async function handleToggle(name: string) {
    if (!expandedCollections.has(name) && !collectionData[name]) {
      setLoadingCol(name)
      await onToggleCollection(name)
      setLoadingCol(null)
    } else {
      onToggleCollection(name)
    }
  }

  const filtered = collections.filter(c =>
    c.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <nav className="h-full w-full flex flex-col bg-[var(--color-bg-surface)] border-r border-[var(--color-border-subtle)] overflow-hidden" aria-label="Collections">
      <div className="px-3 py-2 border-b border-[var(--color-border-subtle)] shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
            Collections
          </span>
          <span className="text-[11px] text-[var(--color-text-muted)] tabular-nums">
            {collections.length}
          </span>
        </div>
        {collections.length > 0 && (
          <div className="relative">
            <Icons.Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
            <input
              type="text"
              placeholder="Filter…"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border-subtle)] rounded pl-7 pr-2 py-1 text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]"
              aria-label="Filter collections"
            />
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {!basePath ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
            <Icons.FolderOpen className="w-6 h-6 text-[var(--color-text-muted)]" />
            <p className="text-xs text-[var(--color-text-muted)]">Set a base path to load collections.</p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-[var(--color-text-muted)] p-4 text-center">
            {collections.length === 0 ? 'No collections found.' : 'No matches.'}
          </p>
        ) : (
          filtered.map(col => {
            const expanded = expandedCollections.has(col)
            const data = collectionData[col]
            const loading = loadingCol === col
            return (
              <div key={col}>
                <button
                  className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] transition-colors"
                  onClick={() => handleToggle(col)}
                  aria-expanded={expanded}
                >
                  {loading ? (
                    <Icons.Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin text-[var(--color-text-muted)]" />
                  ) : expanded ? (
                    <Icons.ChevronDown className="w-3.5 h-3.5 shrink-0 text-[var(--color-text-muted)]" />
                  ) : (
                    <Icons.ChevronRight className="w-3.5 h-3.5 shrink-0 text-[var(--color-text-muted)]" />
                  )}
                  <Icons.FolderOpen className="w-3.5 h-3.5 shrink-0 text-[var(--color-text-muted)]" />
                  <span className="truncate text-xs">{col}</span>
                  {data && (
                    <span className="ml-auto text-[10px] text-[var(--color-text-muted)] tabular-nums">
                      {data.requests.length}
                    </span>
                  )}
                </button>
                {expanded && data && (
                  <div role="group" aria-label={`${col} requests`}>
                    {data.requests.map(req => {
                      const selected = selectedRequest?.id === req.id
                      return (
                        <button
                          key={req.id}
                          onClick={() => onSelectRequest(col, req)}
                          aria-current={selected ? 'true' : undefined}
                          className={`w-full text-left flex items-center gap-2 pl-9 pr-3 py-1.5 text-xs transition-colors ${
                            selected
                              ? 'bg-[var(--color-accent-subtle)]/40 text-[var(--color-accent-hover)] border-l-2 border-[var(--color-accent)] -ml-px'
                              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)]'
                          }`}
                        >
                          <span
                            className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded text-white ${methodBadge(req.method)}`}
                          >
                            {req.method.toUpperCase()}
                          </span>
                          <span className="truncate">{req.name}</span>
                        </button>
                      )
                    })}
                    {data.requests.length === 0 && (
                      <p className="text-[11px] text-[var(--color-text-muted)] pl-9 py-1.5 italic">
                        Empty collection
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </nav>
  )
}
