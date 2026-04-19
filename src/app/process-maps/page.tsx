'use client'
import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'

const maps = [
  {
    id: 'architecture',
    label: 'Process Architecture',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-700',
    bg: 'bg-yellow-50',
    border: 'border-yellow-300',
    url: 'https://nafaduwebi.github.io/process-architecture-map/process-architecture-map.html',
    description: 'Current process definitions — how PL Projects delivers and supports its business.',
  },
  {
    id: 'active',
    label: 'Active Quality Documents',
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-300',
    url: 'https://nafaduwebi.github.io/process-architecture-map/active-quality-documents-map.html',
    description: 'Current working documents linked to each process.',
  },
  {
    id: 'original',
    label: 'Original Documents',
    color: 'bg-blue-500',
    textColor: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    url: 'https://nafaduwebi.github.io/process-architecture-map/original-documents-map.html',
    description: 'Legacy/baseline reference documents for audit and comparison.',
  },
]

export default function ProcessMapsPage() {
  const [active, setActive] = useState('architecture')
  const current = maps.find((m) => m.id === active)!

  return (
    <AppShell>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Process Maps</h1>
          <p className="text-gray-500 text-sm mt-1">Interactive QMS process architecture — PL Projects v2.1</p>
        </div>

        <div className="flex gap-3 mb-6">
          {maps.map((m) => (
            <button
              key={m.id}
              onClick={() => setActive(m.id)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium border-2 transition-all ${
                active === m.id
                  ? `${m.bg} ${m.textColor} ${m.border}`
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${m.color} mr-2`} />
              {m.label}
            </button>
          ))}
        </div>

        <div className={`${current.bg} border ${current.border} rounded-xl p-4 mb-4`}>
          <p className={`text-sm ${current.textColor} font-medium`}>{current.description}</p>
        </div>

        <div className="card p-0 overflow-hidden">
          <iframe
            key={active}
            src={current.url}
            className="w-full"
            style={{ height: '680px', border: 'none' }}
            title={current.label}
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        </div>

        <p className="text-xs text-gray-400 mt-3 text-center">
          Click on any process box to view linked documents. Opens in a new tab.
        </p>
      </div>
    </AppShell>
  )
}
