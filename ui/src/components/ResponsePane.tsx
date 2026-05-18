import { useState } from 'react'
import { statusColor, formatBody, type RequestResult } from '../types'

interface Props {
  response: RequestResult | null
}

export default function ResponsePane({ response }: Props) {
  const [activeTab, setActiveTab] = useState<'body' | 'headers' | 'raw'>('body')

  if (!response) {
    return (
      <div className="w-[360px] shrink-0 flex items-center justify-center text-gray-500 text-sm px-6 text-center bg-[#0f1117]">
        Send a request to see the response
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

      <div className="shrink-0 flex border-b border-gray-800">
        {(['body', 'headers', 'raw'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-indigo-400 border-b-2 border-indigo-400 -mb-px'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab}
            {tab === 'headers' && ` (${Object.keys(response.headers).length})`}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'body' && (
          <pre className="h-full font-mono text-xs bg-gray-950 p-4 text-gray-300 whitespace-pre-wrap break-all">
            {formatBody(response.body)}
          </pre>
        )}
        {activeTab === 'headers' && (
          <div>
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
        {activeTab === 'raw' && (
          <pre className="h-full font-mono text-xs bg-gray-950 p-4 text-gray-300 whitespace-pre-wrap break-all">
            {response.body}
          </pre>
        )}
      </div>
    </div>
  )
}
