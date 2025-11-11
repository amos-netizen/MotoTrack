import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { setToken } from '../lib/auth'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const { access_token } = await api.login(email, password)
      setToken(access_token)
      const me: any = await api.me()
      if (me.role === 'site_manager') navigate('/site-manager')
      else if (me.role === 'technician') navigate('/technician')
      else if (me.role === 'workshop_manager') navigate('/workshop-manager')
      else if (me.role === 'warehouse_manager') navigate('/warehouse-manager')
      else if (me.role === 'billing' || me.role === 'admin') navigate('/billing')
      else if (me.role === 'staff' || me.role === 'admin') navigate('/orders')
      else navigate('/appointments')
    } catch (e: any) {
      setError(e.message || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12" style={{
      background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
      backgroundImage: `
        radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)
      `
    }}>
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2" style={{
            textShadow: '0 0 20px rgba(59, 130, 246, 0.6), 0 0 40px rgba(59, 130, 246, 0.3)'
          }}>
            Moto<span style={{ color: '#3b82f6' }}>Track</span>
          </h1>
          <p className="text-gray-400">Premium Automotive Service</p>
        </div>

        {/* Login Card */}
        <div className="card-metallic">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-gray-400">Sign in to your account</p>
          </div>
          <form className="flex flex-col gap-4" onSubmit={submit}>
            <div>
              <label className="block text-sm text-gray-400 mb-2 font-medium">Email</label>
              <input 
                className="input-modern w-full" 
                placeholder="your@email.com" 
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
            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}
            <button className="btn-primary w-full text-lg py-4" type="submit">
              Login
            </button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="mt-8 text-center">
          <div className="flex justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500/50"></div>
            <div className="w-2 h-2 rounded-full bg-cyan-500/50"></div>
            <div className="w-2 h-2 rounded-full bg-blue-500/50"></div>
          </div>
        </div>
      </div>
    </div>
  )
}








