import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useNavigate } from 'react-router-dom'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<string>('client')
  const [garages, setGarages] = useState<any[]>([])
  const [garageId, setGarageId] = useState<number | ''>('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    api.listGarages().then((data: any) => setGarages(data || [])).catch(() => setGarages([]))
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setOk('')
    try {
      await api.signup({ email, password, role, garage_id: (role !== 'client' && role !== 'admin') ? Number(garageId) : null })
      setOk('Account created. You can log in now.')
      setTimeout(() => navigate('/login'), 800)
    } catch (e: any) {
      setError(e.message || 'Signup failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2" style={{
            textShadow: '0 0 20px rgba(59, 130, 246, 0.6), 0 0 40px rgba(59, 130, 246, 0.3)'
          }}>
            Moto<span style={{ color: '#3b82f6' }}>Track</span>
          </h1>
          <p className="text-gray-400">Premium Automotive Service</p>
        </div>
        <div className="card-metallic">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
            <p className="text-gray-400">Join MotoTrack today</p>
          </div>
          <form className="flex flex-col gap-4" onSubmit={submit}>
            <div>
              <label className="block text-sm text-gray-400 mb-2 font-medium">Email</label>
              <input 
                className="input-modern w-full" 
                placeholder="example@email.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                type="email"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2 font-medium">Password</label>
              <input 
                className="input-modern w-full" 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2 font-medium">Account Type</label>
              <select 
                className="input-modern w-full" 
                value={role} 
                onChange={e => setRole(e.target.value)}
              >
                <option value="client">Client</option>
                <option value="site_manager">Site Manager</option>
                <option value="technician">Technician</option>
                <option value="workshop_manager">Workshop Manager</option>
                <option value="warehouse_manager">Warehouse Manager</option>
                <option value="billing">Billing</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {(role === 'site_manager' || role === 'technician' || role === 'workshop_manager' || role === 'warehouse_manager' || role === 'billing') && (
              <div>
                <label className="block text-sm text-gray-400 mb-2 font-medium">Garage</label>
                <select 
                  className="input-modern w-full" 
                  value={garageId} 
                  onChange={e => setGarageId(e.target.value ? Number(e.target.value) : '')}
                  required
                >
                  <option value="">Select garage</option>
                  {garages.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
            )}
            {error && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">{error}</div>}
            {ok && <div className="text-green-400 text-sm bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-2">{ok}</div>}
            <button className="btn-primary w-full" type="submit">Sign up</button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-gray-400">Already have an account? <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold">Login</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}








