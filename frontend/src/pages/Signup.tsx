import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

export default function Signup() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [garages, setGarages] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'technician',
    garage_id: '',
    full_name: '',
    phone: ''
  })

  useEffect(() => {
    loadGarages()
  }, [])

  // Auto-select "Main" garage when garages are loaded
  useEffect(() => {
    if (garages.length > 0) {
      const mainGarage = garages.find((g: any) => g.name === 'Main')
      if (mainGarage && !formData.garage_id) {
        setFormData(prev => ({
          ...prev,
          garage_id: String(mainGarage.id)
        }))
      }
    }
  }, [garages])

  const loadGarages = async () => {
    try {
      const garagesData = await api.listGarages()
      const sortedGarages = (garagesData as any[]).sort((a, b) => {
        if (a.name === 'Main') return -1
        if (b.name === 'Main') return 1
        return a.name.localeCompare(b.name)
      })
      setGarages(sortedGarages)
      
      // Auto-select Main garage
      const mainGarage = sortedGarages.find((g: any) => g.name === 'Main')
      if (mainGarage) {
        setFormData(prev => ({
          ...prev,
          garage_id: String(mainGarage.id)
        }))
      }
    } catch (err: any) {
      console.error('Failed to load garages:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validation
    if (!formData.email || !formData.password) {
      toast.error('Email and password are required')
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    if (!formData.garage_id) {
      toast.error('Please select a garage')
      setLoading(false)
      return
    }

    try {
      await api.signup({
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
        garage_id: Number(formData.garage_id),
        full_name: formData.full_name.trim() || undefined,
        phone: formData.phone.trim() || undefined
      })

      toast.success('Staff account created successfully! Please log in.')
      navigate('/login')
    } catch (err: any) {
      toast.error(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #0B0C10 0%, #1F2833 100%)' }}>
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
              Join Our Team
            </h1>
            <p className="text-xl text-[#C5C6C7] mb-8" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Manage automotive operations with precision
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
                Create Staff Account
              </h1>
              <p className="text-[#C5C6C7] opacity-70" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Join MotoTrack team
              </p>
            </div>

            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm mb-2 font-medium" style={{ color: '#C5C6C7', fontFamily: 'Poppins, sans-serif' }}>
                  Full Name (Optional)
                </label>
                <input 
                  className="input-modern w-full" 
                  placeholder="John Doe" 
                  value={formData.full_name} 
                  onChange={e => setFormData({...formData, full_name: e.target.value})} 
                  type="text"
                />
              </div>

              <div>
                <label className="block text-sm mb-2 font-medium" style={{ color: '#C5C6C7', fontFamily: 'Poppins, sans-serif' }}>
                  Phone (Optional)
                </label>
                <input 
                  className="input-modern w-full" 
                  placeholder="+1234567890" 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                  type="tel"
                />
              </div>

              <div>
                <label className="block text-sm mb-2 font-medium" style={{ color: '#C5C6C7', fontFamily: 'Poppins, sans-serif' }}>
                  Email *
                </label>
                <input 
                  className="input-modern w-full" 
                  placeholder="staff@example.com" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  type="email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-2 font-medium" style={{ color: '#C5C6C7', fontFamily: 'Poppins, sans-serif' }}>
                  Password *
                </label>
                <input 
                  className="input-modern w-full" 
                  type="password" 
                  placeholder="••••••••" 
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})} 
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm mb-2 font-medium" style={{ color: '#C5C6C7', fontFamily: 'Poppins, sans-serif' }}>
                  Confirm Password *
                </label>
                <input 
                  className="input-modern w-full" 
                  type="password" 
                  placeholder="••••••••" 
                  value={formData.confirmPassword} 
                  onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm mb-2 font-medium" style={{ color: '#C5C6C7', fontFamily: 'Poppins, sans-serif' }}>
                  Role *
                </label>
                <select
                  className="input-modern w-full"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  required
                >
                  <option value="technician">Technician</option>
                  <option value="site_manager">Site Manager</option>
                  <option value="workshop_manager">Workshop Manager</option>
                  <option value="warehouse_manager">Warehouse Manager</option>
                  <option value="billing">Billing Staff</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-2 font-medium" style={{ color: '#C5C6C7', fontFamily: 'Poppins, sans-serif' }}>
                  Garage *
                </label>
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
