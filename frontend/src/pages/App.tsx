import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { api } from '../lib/api'
import { clearToken } from '../lib/auth'
import Sidebar from '../components/Sidebar'
import toast from 'react-hot-toast'

export default function App() {
  const [me, setMe] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [appts, setAppts] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [qbVin, setQbVin] = useState('VIN123')
  const [qbType, setQbType] = useState('Service')
  const [qbWhen, setQbWhen] = useState(() => new Date(Date.now() + 48*3600*1000).toISOString())
  const navigate = useNavigate()

  useEffect(() => {
    api.me().then(setMe).catch(() => setMe(null))
  }, [])

  useEffect(() => {
    if (!me) return
    if (me.role === 'staff' || me.role === 'admin') {
      api.listOrders().then((data: any) => setOrders(data || [])).catch(() => setOrders([]))
      api.listJobs().then((data: any) => setJobs(data || [])).catch(() => setJobs([]))
    } else if (me.role === 'client') {
      api.listAppointments().then((data: any) => setAppts(data || [])).catch(() => setAppts([]))
    }
  }, [me])

  const grouped = useMemo(() => {
    const g: Record<string, any[]> = { pending: [], in_progress: [], ready: [], completed: [] }
    for (const o of orders) {
      if (o.status === 'ready') g.ready.push(o)
      else if (o.status === 'in_progress') g.in_progress.push(o)
      else if (o.status === 'completed') g.completed.push(o)
      else g.pending.push(o)
    }
    return g
  }, [orders])

  const jobStats = useMemo(() => {
    const stats = {
      received: 0,
      in_progress: 0,
      completed: 0,
      total: jobs.length
    }
    jobs.forEach((j: any) => {
      if (j.status === 'received') stats.received++
      else if (j.status === 'in_progress') stats.in_progress++
      else if (j.status === 'completed') stats.completed++
    })
    return stats
  }, [jobs])

  const revenueData = [
    { name: 'Walk-in', value: grouped.ready.length * 5000, count: grouped.ready.length },
    { name: 'Scheduled', value: grouped.completed.length * 8000, count: grouped.completed.length },
    { name: 'Parts', value: grouped.in_progress.length * 3000, count: grouped.in_progress.length },
  ]

  const chartData = [
    { name: 'Pending', value: grouped.pending.length, color: '#f87171' },
    { name: 'In Progress', value: grouped.in_progress.length, color: '#fbbf24' },
    { name: 'Ready', value: grouped.ready.length, color: '#66FCF1' },
    { name: 'Completed', value: grouped.completed.length, color: '#4ade80' },
  ]

  const COLORS = ['#f87171', '#fbbf24', '#66FCF1', '#4ade80']

  const logout = () => {
    clearToken()
    setMe(null)
    navigate('/login')
  }

  const quickBook = async () => {
    try {
      await api.createAppointment({ vehicle_vin: qbVin, service_type: qbType, scheduled_at: qbWhen })
      toast.success('Appointment booked! Reminder will be sent 24h before.')
      const list = await api.listAppointments()
      setAppts(list as any[])
    } catch (e: any) {
      toast.error(e.message || 'Failed to book')
    }
  }

  // Show dashboard if logged in
  if (me) {
    return (
      <div className="min-h-screen flex" style={{ background: 'var(--jet-black)' }}>
        <Sidebar user={me} onLogout={logout} />
        
        {/* Main Content */}
        <div className="flex-1 ml-64 p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold mb-8 text-glow" style={{ 
              fontFamily: 'Poppins, sans-serif',
              color: '#C5C6C7'
            }}>
              Dashboard
            </h1>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard 
                title="Active Jobs" 
                value={jobStats.in_progress} 
                icon="⚙️"
                color="#66FCF1"
              />
              <StatCard 
                title="Pending Requests" 
                value={grouped.pending.length} 
                icon="⏳"
                color="#fbbf24"
              />
              <StatCard 
                title="Completed Tasks" 
                value={grouped.completed.length} 
                icon="✅"
                color="#4ade80"
              />
              <StatCard 
                title="Total Revenue" 
                value={`KES ${revenueData.reduce((a, b) => a + b.value, 0).toLocaleString()}`}
                icon="💰"
                color="#FFD700"
              />
            </div>

            {/* Charts Row */}
            {(me.role === 'staff' || me.role === 'admin') && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="card-dashboard">
                  <h3 className="text-xl font-bold mb-4" style={{ color: '#C5C6C7', fontFamily: 'Poppins, sans-serif' }}>
                    Job Status Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          background: 'rgba(31, 40, 51, 0.95)', 
                          border: '1px solid rgba(102, 252, 241, 0.3)',
                          borderRadius: '0.75rem'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="card-dashboard">
                  <h3 className="text-xl font-bold mb-4" style={{ color: '#C5C6C7', fontFamily: 'Poppins, sans-serif' }}>
                    Revenue by Stream
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(197, 198, 199, 0.2)" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#C5C6C7"
                        style={{ fontFamily: 'Poppins, sans-serif' }}
                      />
                      <YAxis 
                        stroke="#C5C6C7"
                        style={{ fontFamily: 'Poppins, sans-serif' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          background: 'rgba(31, 40, 51, 0.95)', 
                          border: '1px solid rgba(102, 252, 241, 0.3)',
                          borderRadius: '0.75rem',
                          color: '#C5C6C7'
                        }}
                      />
                      <Bar dataKey="value" fill="#66FCF1" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Client Dashboard */}
            {me.role === 'client' && (
              <div className="grid lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-1">
                  <div className="card-dashboard">
                    <h3 className="text-xl font-bold mb-4" style={{ color: '#66FCF1', fontFamily: 'Poppins, sans-serif' }}>
                      Quick Booking
                    </h3>
                    <div className="flex flex-col gap-3">
                      <input 
                        className="input-modern" 
                        placeholder="Vehicle VIN" 
                        value={qbVin} 
                        onChange={e => setQbVin(e.target.value)} 
                      />
                      <input 
                        className="input-modern" 
                        placeholder="Service type" 
                        value={qbType} 
                        onChange={e => setQbType(e.target.value)} 
                      />
                      <input 
                        className="input-modern" 
                        type="datetime-local"
                        value={qbWhen.split('.')[0]} 
                        onChange={e => setQbWhen(new Date(e.target.value).toISOString())} 
                      />
                      <button className="btn-primary" onClick={quickBook}>
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <div className="card-dashboard">
                    <h3 className="text-xl font-bold mb-4" style={{ color: '#66FCF1', fontFamily: 'Poppins, sans-serif' }}>
                      My Appointments
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#1F2833]">
                            <th className="text-left py-3 px-4 text-sm" style={{ color: '#C5C6C7', fontFamily: 'Poppins, sans-serif' }}>
                              Service Type
                            </th>
                            <th className="text-left py-3 px-4 text-sm" style={{ color: '#C5C6C7', fontFamily: 'Poppins, sans-serif' }}>
                              Scheduled
                            </th>
                            <th className="text-left py-3 px-4 text-sm" style={{ color: '#C5C6C7', fontFamily: 'Poppins, sans-serif' }}>
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {appts.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="py-8 text-center text-[#C5C6C7] opacity-70">
                                No appointments yet
                              </td>
                            </tr>
                          ) : (
                            appts.map(a => (
                              <tr key={a.id} className="border-b border-[#1F2833] hover:bg-[#1F2833]/30 transition-colors">
                                <td className="py-3 px-4 text-[#C5C6C7]">{a.service_type}</td>
                                <td className="py-3 px-4 text-[#C5C6C7]">
                                  {new Date(a.scheduled_at).toLocaleString()}
                                </td>
                                <td className="py-3 px-4">
                                  <span className="badge badge-info">{a.status}</span>
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
            )}

            {/* Staff/Admin Orders Overview */}
            {(me.role === 'staff' || me.role === 'admin') && (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <OrdersCard title="Pending" items={grouped.pending} />
                <OrdersCard title="In Progress" items={grouped.in_progress} />
                <OrdersCard title="Ready" items={grouped.ready} />
                <OrdersCard title="Completed" items={grouped.completed} />
              </div>
            )}
          </motion.div>
        </div>
      </div>
    )
  }

  // Public homepage - keep existing design but update colors
  return (
    <div className="min-h-screen" style={{ background: 'var(--jet-black)' }}>
      {/* Top Navigation Bar */}
      <nav className="glass-nav sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-10">
              <h1 className="text-2xl font-bold text-glow" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Premium Automotive Service
              </h1>
              <div className="hidden md:flex gap-6">
                <Link to="/orders" className="nav-link">Orders</Link>
                <Link to="/appointments" className="nav-link">Appointments</Link>
                <Link to="/recommendation" className="nav-link">Services</Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login" className="btn-secondary text-sm px-5 py-2.5">Login</Link>
              <Link to="/signup" className="btn-primary text-sm px-5 py-2.5">Sign Up</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-6xl font-bold mb-6 leading-tight text-glow" style={{ fontFamily: 'Poppins, sans-serif' }}>
                MotoTrack Operations
              </h2>
              <p className="text-xl mb-10 leading-relaxed" style={{ color: '#C5C6C7', fontFamily: 'Montserrat, sans-serif' }}>
                Manage automotive operations with precision. Workshop, warehouse, administration, and billing all in one platform.
              </p>
              <div className="flex gap-4">
                <Link to="/login" className="btn-primary text-lg px-8 py-4">Login</Link>
                <Link to="/signup" className="btn-secondary text-lg px-8 py-4">Sign Up</Link>
              </div>
            </motion.div>
            <motion.div 
              className="relative flex justify-center items-center"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="card-glass p-8" style={{
                boxShadow: '0 0 40px rgba(102, 252, 241, 0.4), 0 0 80px rgba(102, 252, 241, 0.2)'
              }}>
                <div className="text-9xl" style={{ 
                  filter: 'drop-shadow(0 0 30px rgba(102, 252, 241, 0.6))',
                }}>🚗</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 px-6" style={{ background: 'rgba(11, 12, 16, 0.5)' }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16" style={{ color: '#C5C6C7', fontFamily: 'Poppins, sans-serif' }}>
            Our <span style={{ color: '#66FCF1' }}>Services</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <ServiceCard
              icon="🔧"
              title="Car Repair"
              description="Expert diagnostics and repairs with state-of-the-art equipment."
            />
            <ServiceCard
              icon="✨"
              title="Premium Detailing"
              description="Interior deep clean, exterior polish, and ceramic coating."
            />
            <ServiceCard
              icon="📊"
              title="Diagnostics"
              description="Advanced computer diagnostics and system health checks."
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16" style={{ color: '#C5C6C7', fontFamily: 'Poppins, sans-serif' }}>
            What Our <span style={{ color: '#66FCF1' }}>Clients</span> Say
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard name="Sarah Johnson" role="Luxury Car Owner" text="Exceptional service! My Mercedes was in perfect hands." />
            <TestimonialCard name="Michael Chen" role="Car Enthusiast" text="Best detailing service I've ever used." />
            <TestimonialCard name="Emma Williams" role="Fleet Manager" text="Reliable diagnostics and fast turnaround." />
          </div>
        </div>
      </section>
    </div>
  )
}

function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: string; color: string }) {
  return (
    <motion.div
      className="stat-card"
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm mb-2" style={{ color: '#C5C6C7', fontFamily: 'Montserrat, sans-serif' }}>{title}</p>
          <p className="text-3xl font-bold" style={{ color, fontFamily: 'Poppins, sans-serif' }}>{value}</p>
        </div>
        <div className="text-5xl opacity-50">{icon}</div>
      </div>
    </motion.div>
  )
}

function OrdersCard({ title, items }: { title: string; items: any[] }) {
  return (
    <motion.div 
      className="card-dashboard"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3 className="text-lg font-bold mb-4" style={{ color: '#C5C6C7', fontFamily: 'Poppins, sans-serif' }}>
        {title} <span style={{ color: '#C5C6C7', opacity: 0.7 }}>({items.length})</span>
      </h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-sm text-[#C5C6C7] opacity-70 text-center py-4">No items</p>
        ) : (
          items.slice(0, 5).map((o: any) => (
            <div key={o.id} className="p-3 rounded-lg" style={{ background: 'rgba(31, 40, 51, 0.5)' }}>
              <p className="text-sm font-medium" style={{ color: '#C5C6C7' }}>Order #{o.id}</p>
              <p className="text-xs mt-1" style={{ color: '#C5C6C7', opacity: 0.7 }}>
                {o.mechanic_notes || 'No notes'}
              </p>
            </div>
          ))
        )}
      </div>
      {items.length > 0 && (
        <Link to="/orders" className="btn-secondary mt-4 w-full text-center text-sm py-2 block">
          View All
        </Link>
      )}
    </motion.div>
  )
}

function ServiceCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <motion.div 
      className="card-service"
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-6xl mb-6 text-center">{icon}</div>
      <h3 className="text-2xl font-bold mb-4 text-center" style={{ color: '#66FCF1', fontFamily: 'Poppins, sans-serif' }}>
        {title}
      </h3>
      <p className="text-center leading-relaxed" style={{ color: '#C5C6C7', fontFamily: 'Montserrat, sans-serif' }}>
        {description}
      </p>
    </motion.div>
  )
}

function TestimonialCard({ name, role, text }: { name: string; role: string; text: string }) {
  return (
    <motion.div 
      className="testimonial-card"
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold" style={{
          background: 'linear-gradient(135deg, #66FCF1, #00D4FF)',
          color: '#0B0C10',
          boxShadow: '0 4px 15px rgba(102, 252, 241, 0.4)'
        }}>
          {name[0]}
        </div>
        <div>
          <div className="font-semibold text-lg" style={{ color: '#C5C6C7', fontFamily: 'Poppins, sans-serif' }}>
            {name}
          </div>
          <div className="text-sm" style={{ color: '#C5C6C7', opacity: 0.7, fontFamily: 'Montserrat, sans-serif' }}>
            {role}
          </div>
        </div>
      </div>
      <p className="italic leading-relaxed" style={{ color: '#C5C6C7', fontFamily: 'Montserrat, sans-serif' }}>
        "{text}"
      </p>
    </motion.div>
  )
}
