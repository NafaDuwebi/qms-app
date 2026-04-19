'use client'
import { useEffect, useState } from 'react'
import AppShell from '../../components/layout/AppShell'

interface AuditLog {
  id: string
  action: string
  entityType: string
  details: string | null
  createdAt: string
  user: { name: string; email: string } | null
}

const actionColors: Record<string, string> = {
  DOCUMENT_CREATED: 'bg-green-100 text-green-800',
  DOCUMENT_UPDATED: 'bg-blue-100 text-blue-800',
  DOCUMENT_DELETED: 'bg-red-100 text-red-700',
  WORKFLOW_CREATED: 'bg-purple-100 text-purple-800',
  WORKFLOW_UPDATED: 'bg-yellow-100 text-yellow-800',
  WORKFLOW_DELETED: 'bg-red-100 text-red-700',
  USER_CREATED: 'bg-indigo-100 text-indigo-800',
  SYSTEM_INITIALIZED: 'bg-gray-100 text-gray-700',
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [entityType, setEntityType] = useState('')

  async function load() {
    const params = new URLSearchParams({ page: String(page) })
    if (entityType) params.set('entityType', entityType)
    const res = await fetch(`/api/audit?${params}`)
    const data = await res.json()
    setLogs(data.logs)
    setTotal(data.total)
    setPages(data.pages)
  }

  useEffect(() => { load() }, [page, entityType])

  function handleFilter(et: string) { setEntityType(et); setPage(1) }

  return (
    <AppShell>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
          <p className="text-gray-500 text-sm mt-1">{total} entries — immutable log of all QMS activity</p>
        </div>

        <div className="flex gap-3 mb-6">
          {[
            { value: '', label: 'All' },
            { value: 'DOCUMENT', label: 'Documents' },
            { value: 'WORKFLOW', label: 'Workflows' },
            { value: 'USER', label: 'Users' },
          ].map((f) => (
            <button key={f.value} onClick={() => handleFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${entityType === f.value ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'}`}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Timestamp</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Action</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Details</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${actionColors[log.action] || 'bg-gray-100 text-gray-700'}`}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 max-w-md">
                    <p className="truncate">{log.details || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {log.user?.name || 'System'}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={4} className="text-center py-12 text-gray-400">No audit entries.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary disabled:opacity-50">Previous</button>
            <span className="text-sm text-gray-600">Page {page} of {pages}</span>
            <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="btn-secondary disabled:opacity-50">Next</button>
          </div>
        )}
      </div>
    </AppShell>
  )
}
