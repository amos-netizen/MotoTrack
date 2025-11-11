import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { setToken } from '../lib/auth'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    api.health()
      .then(() => setServerStatus('online'))
      .catch(() => setServerStatus('offline'))
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { access_token } = await api.login(email, password)
      setToken(access_token)
      const me: any = await api.me()
      toast.success('Login successful!')
      
      // Navigate based on role
      if (me.role === 'site_manager') navigate('/site-manager')
      else if (me.role === 'technician') navigate('/technician')
      else if (me.role === 'workshop_manager') navigate('/workshop-manager')
      else if (me.role === 'warehouse_manager') navigate('/warehouse-manager')
      else if (me.role === 'billing' || me.role === 'admin') navigate('/billing')
      else if (me.role === 'staff' || me.role === 'admin') navigate('/orders')
      else navigate('/appointments')
    } catch (e: any) {
      toast.error(e.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Luxury Car Image */}
      <motion.div 
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div 
          className="absolute inset-0 bg-gradient-to-br from-[#0B0C10] via-[#1F2833] to-[#0B0C10]"
          style={{
            backgroundImage: `
              radial-gradient(circle at 30% 50%, rgba(102, 252, 241, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 70% 80%, rgba(197, 198, 199, 0.1) 0%, transparent 50%)
            `
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-center z-10"
          >
            <h1 className="text-6xl font-bold mb-4 text-glow" style={{ 
              fontFamily: 'Poppins, sans-serif',
              background: 'linear-gradient(135deg, #66FCF1, #00D4FF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Moto<span style={{ color: '#FFD700' }}>Track</span>
            </h1>
            <p className="text-xl text-[#C5C6C7] mb-8" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Premium Automotive Service
            </p>
            <div className="text-9xl">🚗</div>
          </motion.div>
        </div>
        {/* Watermark */}
        <div className="absolute bottom-8 left-8 text-[#C5C6C7] opacity-20 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
          MotoTrack
        </div>
      </motion.div>

      {/* Right Side - Login Form */}
      <motion.div 
        className="w-full lg:w-1/2 flex items-center justify-center p-8"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 text-glow" style={{ 
              fontFamily: 'Poppins, sans-serif',
              background: 'linear-gradient(135deg, #66FCF1, #00D4FF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Moto<span style={{ color: '#FFD700' }}>Track</span>
            </h1>
            <p className="text-[#C5C6C7]">Premium Automotive Service</p>
          </div>

          {/* Glassmorphic Form Card */}
          <motion.div 
            className="card-glass p-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2" style={{ 
                color: '#C5C6C7',
                fontFamily: 'Poppins, sans-serif'
              }}>
                Welcome Back
              </h2>
              <p className="text-[#C5C6C7] opacity-70" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Sign in to your account
              </p>
            </div>

            {serverStatus === 'offline' && (
              <div className="mb-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm">
                ⚠️ Backend server is not running. Please start it on http://localhost:8000
              </div>
            )}

            <form className="flex flex-col gap-5" onSubmit={submit}>
              <div>
                <label className="block text-sm mb-2 font-medium" style={{ color: '#C5C6C7', fontFamily: 'Poppins, sans-serif' }}>
                  Email
                </label>
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
                <label className="block text-sm mb-2 font-medium" style={{ color: '#C5C6C7', fontFamily: 'Poppins, sans-serif' }}>
                  Password
                </label>
                <input 
                  className="input-modern w-full" 
                  type="password" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required
                />
              </div>
              <button 
                className="btn-primary w-full text-lg py-4 mt-2" 
                type="submit"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Login'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-[#C5C6C7] opacity-70" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Don't have an account?{' '}
                <Link 
                  to="/signup" 
                  className="text-[#66FCF1] hover:text-[#00D4FF] font-semibold transition-colors"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  Sign up
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
