import { Icons } from './Icon'

interface Props {
  basePath: string
  environments: string[]
  selectedEnv: string
  onEnvChange: (env: string) => void
  onRefresh: () => void
  onEditEnv: () => void
  onOpenSettings: () => void
}

export default function TopBar({
  basePath,
  environments,
  selectedEnv,
  onEnvChange,
  onRefresh,
  onEditEnv,
  onOpenSettings,
}: Props) {
  return (
    <header className="flex items-center gap-3 px-4 py-2.5 bg-[var(--color-bg-surface)] border-b border-[var(--color-border-subtle)] shrink-0">
      <div className="flex items-center gap-2 shrink-0">
        <Icons.Zap className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
        <span className="text-[var(--color-text-primary)] font-semibold text-sm">Velo</span>
      </div>
      {basePath && (
        <>
          <span className="text-[var(--color-border-strong)]" aria-hidden="true">·</span>
          <span
            className="text-xs text-[var(--color-text-muted)] font-mono truncate max-w-[280px]"
            title={basePath}
          >
            {basePath}
          </span>
        </>
      )}
      <div className="flex-1" />
      <div className="flex items-center gap-1.5">
        <label htmlFor="env-select" className="sr-only">Environment</label>
        <div className="relative">
          <select
            id="env-select"
            className="appearance-none bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-md pl-3 pr-8 py-1.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] cursor-pointer"
            value={selectedEnv}
            onChange={e => onEnvChange(e.target.value)}
            disabled={environments.length === 0}
          >
            {environments.length === 0
              ? <option value="">No environments</option>
              : environments.map(env => <option key={env} value={env}>{env}</option>)
            }
          </select>
          <Icons.ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-muted)]" />
        </div>
        <button
          onClick={onEditEnv}
          disabled={!selectedEnv}
          aria-label="Edit environment"
          className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-40 disabled:cursor-not-allowed p-1.5 rounded hover:bg-[var(--color-bg-elevated)] transition-colors"
        >
          <Icons.Pencil className="w-4 h-4" />
        </button>
      </div>
      <div className="w-px h-5 bg-[var(--color-border-subtle)]" aria-hidden="true" />
      <button
        onClick={onOpenSettings}
        aria-label="Open settings"
        title="Settings (Ctrl+,)"
        className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-1.5 rounded hover:bg-[var(--color-bg-elevated)] transition-colors"
      >
        <Icons.Settings className="w-4 h-4" />
      </button>
      <button
        onClick={onRefresh}
        aria-label="Refresh"
        title="Refresh (Ctrl+R)"
        className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-1.5 rounded hover:bg-[var(--color-bg-elevated)] transition-colors"
      >
        <Icons.RefreshCw className="w-4 h-4" />
      </button>
    </header>
  )
}
