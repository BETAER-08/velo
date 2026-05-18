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
    <div className="flex items-center gap-3 px-4 py-2 bg-[#161b22] border-b border-gray-800 shrink-0">
      <span className="text-indigo-400 font-bold text-lg shrink-0">Velo</span>
      {basePath && (
        <span className="text-xs text-gray-500 font-mono truncate max-w-[180px]" title={basePath}>
          {basePath}
        </span>
      )}
      <div className="flex-1" />
      <div className="flex items-center gap-1">
        <select
          className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          value={selectedEnv}
          onChange={e => onEnvChange(e.target.value)}
        >
          {environments.length === 0
            ? <option value="">No environments</option>
            : environments.map(env => <option key={env} value={env}>{env}</option>)
          }
        </select>
        <button
          onClick={onEditEnv}
          disabled={!selectedEnv}
          className="text-sm text-gray-400 hover:text-gray-100 disabled:opacity-40 disabled:cursor-not-allowed px-2 py-1.5 rounded hover:bg-gray-800"
          title="Edit environment"
        >
          ✏️
        </button>
      </div>
      <button
        onClick={onOpenSettings}
        className="text-gray-400 hover:text-gray-100 px-2 py-1.5 rounded hover:bg-gray-800 text-sm"
        title="Change base path"
      >
        ⚙
      </button>
      <button
        onClick={onRefresh}
        className="text-sm text-gray-400 hover:text-gray-100 px-2 py-1.5 rounded hover:bg-gray-800"
        title="Refresh"
      >
        ↻
      </button>
    </div>
  )
}
