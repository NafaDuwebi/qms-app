'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { useSession } from 'next-auth/react'

interface Document {
  id: string
  title: string
  docNumber: string
  version: string
  status: string
  type: string
  description: string
  createdBy: { name: string }
  process: { name: string } | null
  createdAt: string
  updatedAt: string
}

interface Process { id: string; name: string }

const statusColors: Record<string, string> = {
  APPROVED: 'bg-green-100 text-green-800',
  DRAFT: 'bg-gray-100 text-gray-700',
  REVIEW: 'bg-yellow-100 text-yellow-800',
  OBSOLETE: 'bg-red-100 text-red-700',
}

const docTypeLabels: Record<string, string> = {
  PROCESS_ARCHITECTURE: 'Process Architecture',
  ACTIVE_DOCUMENT: 'Active Document',
  ORIGINAL_DOCUMENT: 'Original Document',
  PROCEDURE: 'Procedure',
  RECORD: 'Record',
  FORM: 'Form',
  POLICY: 'Policy',
}

export default function DocumentsPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const [docs, setDocs] = useState<Document[]>([])
  const [processes, setProcesses] = useState<Process[]>([])
  const [filter, setFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editDoc, setEditDoc] = useState<Document | null>(null)
  const [form, setForm] = useState({ title: '', docNumber: '', description: '', type: 'PROCEDURE', status: 'DRAFT', version: '1.0', processId: '', changeNote: '' })

  async function load() {
    const params = new URLSearchParams()
    if (filter) params.set('status', filter)
    if (typeFilter) params.set('type', typeFilter)
    const res = await fetch(`/api/documents?${params}`)
    const data = await res.json()
    setDocs(data)
  }

  useEffect(() => { load() }, [filter, typeFilter])
  useEffect(() => { fetch('/api/processes').then(r => r.json()).then(setProcesses) }, [])

  function openCreate() { setEditDoc(null); setForm({ title: '', docNumber: '', description: '', type: 'PROCEDURE', status: 'DRAFT', version: '1.0', processId: '', changeNote: '' }); setShowModal(true) }
  function openEdit(doc: Document) { setEditDoc(doc); setForm({ title: doc.title, docNumber: doc.docNumber, description: doc.description || '', type: doc.type, status: doc.status, version: doc.version, processId: '', changeNote: '' }); setShowModal(true) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (editDoc) {
      await fetch(`/api/documents/${editDoc.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    } else {
      await fetch('/api/documents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    }
    setShowModal(false)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this document?')) return
    await fetch(`/api/documents/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <AppShell>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
            <p className="text-gray-500 text-sm mt-1">{docs.length} documents</p>
          </div>
          {user?.role !== 'VIEWER' && (
            <button onClick={openCreate} className="btn-primary">+ New Document</button>
          )}
        </div>

        <div className="flex gap-3 mb-6">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="select w-auto">
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="REVIEW">In Review</option>
            <option value="APPROVED">Approved</option>
            <option value="OBSOLETE">Obsolete</option>
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="select w-auto">
            <option value="">All Types</option>
            {Object.entries(docTypeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>

        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Doc #</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Version</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Process</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Updated</th>
                {user?.role !== 'VIEWER' && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {docs.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{doc.docNumber}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{doc.title}</p>
                    {doc.description && <p className="text-xs text-gray-400 truncate max-w-xs">{doc.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{docTypeLabels[doc.type] || doc.type}</td>
                  <td className="px-4 py-3 text-gray-600">v{doc.version}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${statusColors[doc.status]}`}>{doc.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{doc.process?.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(doc.updatedAt).toLocaleDateString()}</td>
                  {user?.role !== 'VIEWER' && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(doc)} className="text-blue-600 hover:underline text-xs">Edit</button>
                        {user?.role === 'ADMIN' && (
                          <button onClick={() => handleDelete(doc.id)} className="text-red-500 hover:underline text-xs">Delete</button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {docs.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">No documents found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title={editDoc ? 'Edit Document' : 'New Document'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Title</label>
                <input className="input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
              </div>
              <div>
                <label className="label">Document Number</label>
                <input className="input" value={form.docNumber} onChange={e => setForm({...form, docNumber: e.target.value})} required />
              </div>
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Type</label>
                <select className="select" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  {Object.entries(docTypeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select className="select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="DRAFT">Draft</option>
                  <option value="REVIEW">Review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="OBSOLETE">Obsolete</option>
                </select>
              </div>
              <div>
                <label className="label">Version</label>
                <input className="input" value={form.version} onChange={e => setForm({...form, version: e.target.value})} required />
              </div>
            </div>
            <div>
              <label className="label">Process</label>
              <select className="select" value={form.processId} onChange={e => setForm({...form, processId: e.target.value})}>
                <option value="">None</option>
                {processes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {editDoc && (
              <div>
                <label className="label">Change Note</label>
                <input className="input" placeholder="What changed?" value={form.changeNote} onChange={e => setForm({...form, changeNote: e.target.value})} />
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Save</button>
            </div>
          </form>
        </Modal>
      )}
    </AppShell>
  )
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
