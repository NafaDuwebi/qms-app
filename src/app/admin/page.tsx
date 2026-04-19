'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface User { id: string; name: string; email: string; role: string; createdAt: string }

const roleColors: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-800',
  EDITOR: 'bg-blue-100 text-blue-800',
  VIEWER: 'bg-gray-100 text-gray-700',
}

export default function AdminPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'VIEWER' })
  const [error, setError] = useState('')

  useEffect(() => {
    if (user && user.role !== 'ADMIN') router.push('/')
  }, [user])

  async function load() {
    const res = await fetch('/api/users')
    if (res.ok) setUsers(await res.json())
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setShowModal(false)
      setForm({ name: '', email: '', password: '', role: 'VIEWER' })
      load()
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to create user')
    }
  }

  return (
    <AppShell>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin — Team Management</h1>
            <p className="text-gray-500 text-sm mt-1">{users.length} team members</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary">+ Invite Member</button>
        </div>

        <div className="card p-0 overflow-hidden mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3"><span className={`badge ${roleColors[u.role]}`}>{u.role}</span></td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card bg-blue-50 border-blue-200">
          <h2 className="font-semibold text-blue-900 mb-2">Role Permissions</h2>
          <div className="space-y-2 text-sm">
            <div><span className="badge bg-red-100 text-red-800 mr-2">ADMIN</span> Full access — manage users, documents, workflows, and settings</div>
            <div><span className="badge bg-blue-100 text-blue-800 mr-2">EDITOR</span> Create and edit documents and workflows</div>
            <div><span className="badge bg-gray-100 text-gray-700 mr-2">VIEWER</span> Read-only access to all content</div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Invite Team Member</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}
              <div>
                <label className="label">Full Name</label>
                <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
              </div>
              <div>
                <label className="label">Temporary Password</label>
                <input type="password" className="input" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={8} />
              </div>
              <div>
                <label className="label">Role</label>
                <select className="select" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                  <option value="VIEWER">Viewer</option>
                  <option value="EDITOR">Editor</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  )
}
