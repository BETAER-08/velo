interface Props {
  basePath: string
  onBasePathChange: (path: string) => void
  onBasePathSubmit: () => void
  environments: string[]
  selectedEnv: string
  onEnvChange: (env: string) => void
  onRefresh: () => void
  onEditEnv: () => void
}

export default function TopBar({
  basePath,
  onBasePathChange,
  onBasePathSubmit,
  environments,
  selectedEnv,
  onEnvChange,
  onRefresh,
  onEditEnv,
}: Props) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-[#161b22] border-b border-gray-800 shrink-0">
      <span className="text-indigo-400 font-bold text-lg w-20 shrink-0">Velo</span>
      <input
        className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-500"
        placeholder="Base path (e.g. /home/user/.velo)"
        value={basePath}
        onChange={e => onBasePathChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onBasePathSubmit() }}
      />
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
        onClick={onRefresh}
        className="text-sm text-gray-400 hover:text-gray-100 px-3 py-1.5 rounded hover:bg-gray-800"
      >
        ↻ Refresh
      </button>
    </div>
  )
}
