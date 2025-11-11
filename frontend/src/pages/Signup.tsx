import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.signup({ email, password, role: 'client', garage_id: null })
      toast.success('Account created successfully!')
      setTimeout(() => navigate('/login'), 1000)
    } catch (e: any) {
      toast.error(e.message || 'Signup failed')
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
              Join Us
            </h1>
            <p className="text-xl text-[#C5C6C7] mb-8" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Experience premium automotive service
            </p>
            <div className="text-9xl">🚗</div>
          </motion.div>
        </div>
        <div className="absolute bottom-8 left-8 text-[#C5C6C7] opacity-20 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
          MotoTrack
        </div>
      </motion.div>

      {/* Right Side - Signup Form */}
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
              <h1 className="text-3xl font-bold mb-2" style={{ 
                color: '#C5C6C7',
                fontFamily: 'Poppins, sans-serif'
              }}>
                Create Account
              </h1>
              <p className="text-[#C5C6C7] opacity-70" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Join MotoTrack today
              </p>
            </div>

            <form className="flex flex-col gap-5" onSubmit={submit}>
              <div>
                <label className="block text-sm mb-2 font-medium" style={{ color: '#C5C6C7', fontFamily: 'Poppins, sans-serif' }}>
                  Email
                </label>
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
              <div className="text-center py-2">
                <p className="text-xs text-[#C5C6C7] opacity-70" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Creating a <span className="text-[#66FCF1] font-semibold">Client</span> account
                </p>
                <p className="text-xs text-[#C5C6C7] opacity-50 mt-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Staff profiles can only be created by administrators
                </p>
              </div>
              <button 
                className="btn-primary w-full text-lg py-4 mt-2" 
                type="submit"
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Sign up'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-[#C5C6C7] opacity-70" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Already have an account?{' '}
                <Link 
                  to="/login" 
                  className="text-[#66FCF1] hover:text-[#00D4FF] font-semibold transition-colors"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  Login
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
