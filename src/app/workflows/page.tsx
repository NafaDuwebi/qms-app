'use client'
import { useEffect, useState } from 'react'
import AppShell from '../../components/layout/AppShell'
import { useSession } from 'next-auth/react'

interface Workflow {
  id: string
  title: string
  description: string
  status: string
  priority: string
  dueDate: string | null
  createdAt: string
  updatedAt: string
  process: { name: string } | null
  assignedTo: { name: string } | null
  _count: { comments: number }
}

interface Process { id: string; name: string }

const statusColors: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  REVIEW: 'bg-purple-100 text-purple-800',
  CLOSED: 'bg-green-100 text-green-800',
}

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-blue-50 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
}

export default function WorkflowsPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [processes, setProcesses] = useState<Process[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<Workflow | null>(null)
  const [form, setForm] = useState({ title: '', description: '', processId: '', priority: 'MEDIUM', dueDate: '' })
  const [statusUpdate, setStatusUpdate] = useState('')
  const [comment, setComment] = useState('')

  async function load() {
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    const res = await fetch(`/api/workflows?${params}`)
    const data = await res.json()
    setWorkflows(data)
  }

  useEffect(() => { load() }, [statusFilter])
  useEffect(() => { fetch('/api/processes').then(r => r.json()).then(setProcesses) }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/workflows', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setShowModal(false)
    load()
  }

  async function openDetail(w: Workflow) {
    const res = await fetch(`/api/workflows/${w.id}`)
    const data = await res.json()
    setSelected(data)
    setStatusUpdate(data.status)
    setComment('')
  }

  async function handleStatusUpdate() {
    if (!selected) return
    await fetch(`/api/workflows/${selected.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: statusUpdate }) })
    load()
    setSelected(null)
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || !comment.trim()) return
    await fetch(`/api/workflows/${selected.id}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: comment }) })
    const res = await fetch(`/api/workflows/${selected.id}`)
    setSelected(await res.json())
    setComment('')
  }

  return (
    <AppShell>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Workflows</h1>
            <p className="text-gray-500 text-sm mt-1">{workflows.length} total</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary">+ New Workflow</button>
        </div>

        <div className="flex gap-3 mb-6">
          {['', 'OPEN', 'IN_PROGRESS', 'REVIEW', 'CLOSED'].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>

        <div className="grid gap-3">
          {workflows.map((w) => (
            <div key={w.id} onClick={() => openDetail(w)}
              className="card cursor-pointer hover:shadow-md transition-shadow flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`badge ${statusColors[w.status]}`}>{w.status.replace('_', ' ')}</span>
                  <span className={`badge ${priorityColors[w.priority]}`}>{w.priority}</span>
                </div>
                <h3 className="font-semibold text-gray-900">{w.title}</h3>
                {w.description && <p className="text-sm text-gray-500 mt-0.5 truncate">{w.description}</p>}
                <div className="flex gap-4 mt-2 text-xs text-gray-400">
                  {w.process && <span>Process: {w.process.name}</span>}
                  {w.assignedTo && <span>Assigned: {w.assignedTo.name}</span>}
                  {w.dueDate && <span>Due: {new Date(w.dueDate).toLocaleDateString()}</span>}
                  {w._count.comments > 0 && <span>{w._count.comments} comment{w._count.comments !== 1 ? 's' : ''}</span>}
                </div>
              </div>
              <span className="text-xs text-gray-400 shrink-0">{new Date(w.updatedAt).toLocaleDateString()}</span>
            </div>
          ))}
          {workflows.length === 0 && (
            <div className="text-center py-16 text-gray-400">No workflows found.</div>
          )}
        </div>
      </div>

      {showModal && (
        <Modal title="New Workflow" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="label">Title</label>
              <input className="input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Process</label>
                <select className="select" value={form.processId} onChange={e => setForm({...form, processId: e.target.value})}>
                  <option value="">None</option>
                  {processes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Priority</label>
                <select className="select" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Due Date</label>
              <input type="date" className="input" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Create</button>
            </div>
          </form>
        </Modal>
      )}

      {selected && (
        <Modal title={selected.title} onClose={() => setSelected(null)}>
          <div className="space-y-4">
            <div className="flex gap-2">
              <span className={`badge ${statusColors[selected.status]}`}>{selected.status.replace('_', ' ')}</span>
              <span className={`badge ${priorityColors[selected.priority]}`}>{selected.priority}</span>
            </div>
            {selected.description && <p className="text-sm text-gray-600">{selected.description}</p>}
            {(selected as any).process && <p className="text-sm text-gray-500">Process: {(selected as any).process.name}</p>}

            <div className="border-t pt-4">
              <label className="label">Update Status</label>
              <div className="flex gap-2">
                <select className="select flex-1" value={statusUpdate} onChange={e => setStatusUpdate(e.target.value)}>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="REVIEW">Review</option>
                  <option value="CLOSED">Closed</option>
                </select>
                <button onClick={handleStatusUpdate} className="btn-primary shrink-0">Update</button>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Comments ({(selected as any).comments?.length || 0})</p>
              <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                {(selected as any).comments?.map((c: any) => (
                  <div key={c.id} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-600 mb-1">{c.user.name} — {new Date(c.createdAt).toLocaleString()}</p>
                    <p className="text-sm text-gray-700">{c.content}</p>
                  </div>
                ))}
              </div>
              <form onSubmit={handleComment} className="flex gap-2">
                <input className="input flex-1" placeholder="Add a comment..." value={comment} onChange={e => setComment(e.target.value)} />
                <button type="submit" className="btn-primary shrink-0">Post</button>
              </form>
            </div>
          </div>
        </Modal>
      )}
    </AppShell>
  )
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="font-semibold text-gray-900 truncate">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none ml-4">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
