'use client'
import { useEffect, useState } from 'react'
import AppShell from '../components/layout/AppShell'

interface DashboardData {
  documents: { total: number; approved: number; draft: number; review: number }
  workflows: { open: number; inProgress: number; closed: number }
  recentActivity: Array<{ id: string; action: string; details: string; createdAt: string; user: { name: string } | null }>
}

const actionColors: Record<string, string> = {
  DOCUMENT_CREATED: 'bg-green-100 text-green-800',
  DOCUMENT_UPDATED: 'bg-blue-100 text-blue-800',
  DOCUMENT_DELETED: 'bg-red-100 text-red-800',
  WORKFLOW_CREATED: 'bg-purple-100 text-purple-800',
  WORKFLOW_UPDATED: 'bg-yellow-100 text-yellow-800',
  USER_CREATED: 'bg-indigo-100 text-indigo-800',
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    fetch('/api/dashboard').then((r) => r.json()).then(setData)
  }, [])

  return (
    <AppShell>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Quality Management System overview</p>
        </div>

        {data ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard label="Total Documents" value={data.documents.total} color="blue" />
              <StatCard label="Approved" value={data.documents.approved} color="green" />
              <StatCard label="In Review" value={data.documents.review} color="yellow" />
              <StatCard label="Drafts" value={data.documents.draft} color="gray" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
              <StatCard label="Open Workflows" value={data.workflows.open} color="red" />
              <StatCard label="In Progress" value={data.workflows.inProgress} color="orange" />
              <StatCard label="Closed" value={data.workflows.closed} color="green" />
            </div>

            <div className="card">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Activity</h2>
              {data.recentActivity.length === 0 ? (
                <p className="text-gray-500 text-sm">No activity yet.</p>
              ) : (
                <div className="space-y-3">
                  {data.recentActivity.map((log) => (
                    <div key={log.id} className="flex items-start gap-3">
                      <span className={`badge ${actionColors[log.action] || 'bg-gray-100 text-gray-700'} shrink-0 mt-0.5`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate">{log.details}</p>
                        <p className="text-xs text-gray-400">
                          {log.user?.name || 'System'} — {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-gray-400 text-sm">Loading...</div>
        )}
      </div>
    </AppShell>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    gray: 'bg-gray-50 text-gray-700',
    red: 'bg-red-50 text-red-700',
    orange: 'bg-orange-50 text-orange-700',
  }
  return (
    <div className={`rounded-xl p-5 ${colors[color]}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm mt-1 opacity-80">{label}</p>
    </div>
  )
}
