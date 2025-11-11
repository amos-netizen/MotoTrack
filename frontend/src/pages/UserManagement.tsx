import { useState, useEffect } from 'react'
import { api } from '../lib/api'

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([])
  const [garages, setGarages] = useState<any[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'technician',
    garage_id: '',
    full_name: '',
    phone: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [usersData, garagesData] = await Promise.all([
        api.listUsers(),
        api.listGarages()
      ])
      setUsers((usersData as any[]) || [])
      setGarages((garagesData as any[]) || [])
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMsg('')
    
    if (!formData.garage_id) {
      setError('Please select a garage')
      return
    }
    
    try {
      await api.createStaffProfile({
        email: formData.email,
        password: formData.password,
        role: formData.role,
        garage_id: Number(formData.garage_id),
        full_name: formData.full_name || undefined,
        phone: formData.phone || undefined
      })
      setMsg('Staff profile created successfully!')
      setShowCreateForm(false)
      setFormData({
        email: '',
        password: '',
        role: 'technician',
        garage_id: '',
        full_name: '',
        phone: ''
      })
      loadData()
    } catch (err: any) {
      setError(err.message || 'Failed to create profile')
    }
    setTimeout(() => { setMsg(''); setError('') }, 5000)
  }

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      'technician': 'Technician',
      'workshop_manager': 'Workshop Manager',
      'warehouse_manager': 'Warehouse Manager',
      'billing': 'Billing Staff',
      'admin': 'Admin',
      'site_manager': 'Site Manager',
      'client': 'Client'
    }
    return roleMap[role] || role
  }

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn-primary px-6 py-2"
          >
            {showCreateForm ? 'Cancel' : '+ Create Staff Profile'}
          </button>
        </div>

        {msg && (
          <div className="mb-4 text-green-400 text-sm bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3">
            {msg}
          </div>
        )}

        {error && (
          <div className="mb-4 text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {showCreateForm && (
          <div className="card-metallic mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">Create Staff Profile</h2>
            <form onSubmit={handleCreateProfile} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-medium">Full Name</label>
                  <input 
                    className="input-modern w-full" 
                    type="text"
                    value={formData.full_name}
                    onChange={e => setFormData({...formData, full_name: e.target.value})}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-medium">Phone</label>
                  <input 
                    className="input-modern w-full" 
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder="+1234567890"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2 font-medium">Email *</label>
                <input 
                  className="input-modern w-full" 
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  required
                  placeholder="staff@example.com"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2 font-medium">Password *</label>
                <input 
                  className="input-modern w-full" 
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  required
                  placeholder="••••••••"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-medium">Role *</label>
                  <select 
                    className="input-modern w-full" 
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                    required
                  >
                    <option value="technician">Technician</option>
                    <option value="workshop_manager">Workshop Manager</option>
                    <option value="warehouse_manager">Warehouse Manager</option>
                    <option value="billing">Billing Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-medium">Garage *</label>
                  <select 
                    className="input-modern w-full" 
                    value={formData.garage_id}
                    onChange={e => setFormData({...formData, garage_id: e.target.value})}
                    required
                  >
                    <option value="">Select garage</option>
                    {garages.map((g: any) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button type="submit" className="btn-primary w-full md:w-auto px-6 py-2">
                Create Profile
              </button>
            </form>
          </div>
        )}

        <div className="card-metallic">
          <h2 className="text-2xl font-bold text-white mb-4">All Users</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Name</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Email</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Role</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Phone</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Garage</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user: any) => (
                    <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                      <td className="py-3 px-4 text-white">{user.full_name || '-'}</td>
                      <td className="py-3 px-4 text-gray-300">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded text-xs font-medium" style={{
                          background: 'rgba(59, 130, 246, 0.2)',
                          color: '#60a5fa'
                        }}>
                          {getRoleDisplayName(user.role)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-300">{user.phone || '-'}</td>
                      <td className="py-3 px-4 text-gray-300">
                        {garages.find((g: any) => g.id === user.garage_id)?.name || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

