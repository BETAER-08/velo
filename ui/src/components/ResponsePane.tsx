import { useState } from 'react'
import type { RequestResult } from '../types'
import { formatBody, statusColor } from '../types'

interface ResponsePaneProps {
  response: RequestResult | null
}

export default function ResponsePane({ response }: ResponsePaneProps) {
  const [headersExpanded, setHeadersExpanded] = useState(false)

  if (!response) {
    return (
      <div className="w-[360px] shrink-0 flex flex-col bg-[#0f1117] overflow-hidden">
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm px-6 text-center">
          Send a request to see the response
        </div>
      </div>
    )
  }

  return (
    <div className="w-[360px] shrink-0 flex flex-col bg-[#0f1117] overflow-hidden">
      <div className="shrink-0 flex items-center gap-4 px-4 py-3 border-b border-gray-800">
        <span className={`text-2xl font-bold ${statusColor(response.status)}`}>
          {response.status}
        </span>
        <span className="text-xs text-gray-500">{response.duration_ms} ms</span>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col">
        <div className="shrink-0 border-b border-gray-800">
          <button
            onClick={() => setHeadersExpanded(v => !v)}
            className="w-full flex items-center justify-between px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500 hover:bg-gray-900"
          >
            <span>Headers ({Object.keys(response.headers).length})</span>
            <span>{headersExpanded ? '▾' : '▸'}</span>
          </button>
          {headersExpanded && (
            <div className="border-t border-gray-800">
              {Object.entries(response.headers).map(([k, v]) => (
                <div key={k} className="flex text-xs border-b border-gray-800 last:border-0">
                  <span className="w-2/5 px-3 py-1.5 bg-gray-900 text-gray-400 font-mono truncate">
                    {k}
                  </span>
                  <span className="flex-1 px-3 py-1.5 text-gray-300 font-mono break-all">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-hidden p-4 flex flex-col gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 shrink-0">
            Body
          </p>
          <pre className="flex-1 overflow-auto font-mono text-xs bg-gray-950 border border-gray-800 rounded p-4 text-gray-300 whitespace-pre-wrap break-all">
            {formatBody(response.body)}
          </pre>
        </div>
      </div>
    </div>
  )
}
