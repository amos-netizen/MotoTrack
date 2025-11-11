import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { clearToken } from '../lib/auth'

export default function App() {
  // const [status, setStatus] = useState('checking...')
  const [me, setMe] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [appts, setAppts] = useState<any[]>([])
  const [qbVin, setQbVin] = useState('VIN123')
  const [qbType, setQbType] = useState('Service')
  const [qbWhen, setQbWhen] = useState(() => new Date(Date.now() + 48*3600*1000).toISOString())
  const [msg, setMsg] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    api.me().then(setMe).catch(() => setMe(null))
  }, [])

  useEffect(() => {
    if (!me) return
    if (me.role === 'staff' || me.role === 'admin') {
      api.listOrders().then((data: any) => setOrders(data || [])).catch(() => setOrders([]))
    } else if (me.role === 'client') {
      api.listAppointments().then((data: any) => setAppts(data || [])).catch(() => setAppts([]))
    }
  }, [me])

  const grouped = useMemo(() => {
    const g: Record<string, any[]> = { pending: [], in_progress: [], ready: [] }
    for (const o of orders) {
      if (o.status === 'ready') g.ready.push(o)
      else if (o.status === 'in_progress') g.in_progress.push(o)
      else g.pending.push(o)
    }
    return g
  }, [orders])

  const logout = () => {
    clearToken()
    setMe(null)
    navigate('/login')
  }

  const quickBook = async () => {
    try {
      await api.createAppointment({ vehicle_vin: qbVin, service_type: qbType, scheduled_at: qbWhen })
      setMsg('Booked. Reminder will be sent 24h before.')
      const list = await api.listAppointments()
      setAppts(list as any[])
    } catch {
      setMsg('Failed to book')
    }
    setTimeout(() => setMsg(''), 1500)
  }

  // Show dashboard if logged in
  if (me) {
    return (
      <div className="min-h-screen">
        {/* Navigation Bar */}
        <nav style={{
          borderBottom: '1px solid rgba(75, 85, 99, 0.5)',
          backdropFilter: 'blur(12px)',
          background: 'rgba(17, 24, 39, 0.3)',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}>
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-8">
                <h1 className="text-2xl font-bold text-white" style={{ textShadow: '0 0 20px rgba(59, 130, 246, 0.6)' }}>Premium Automotive Service</h1>
                <div className="hidden md:flex gap-6">
                  {me.role === 'site_manager' && (
                    <>
                      <Link to="/site-manager" className="nav-link px-2 py-1">Site Manager</Link>
                    </>
                  )}
                  {me.role === 'technician' && (
                    <>
                      <Link to="/technician" className="nav-link px-2 py-1">Technician</Link>
                    </>
                  )}
                  {me.role === 'workshop_manager' && (
                    <>
                      <Link to="/workshop-manager" className="nav-link px-2 py-1">Workshop Manager</Link>
                    </>
                  )}
                  {me.role === 'warehouse_manager' && (
                    <>
                      <Link to="/warehouse-manager" className="nav-link px-2 py-1">Warehouse</Link>
                    </>
                  )}
                  {(me.role === 'billing' || me.role === 'admin') && (
                    <>
                      <Link to="/billing" className="nav-link px-2 py-1">Billing</Link>
                    </>
                  )}
                  {me.role === 'admin' && (
                    <>
                      <Link to="/task-actions" className="nav-link px-2 py-1">Task Actions</Link>
                    </>
                  )}
                  {(me.role === 'client' || me.role === 'staff') && (
                    <>
                      <Link to="/orders" className="nav-link px-2 py-1">Orders</Link>
                      <Link to="/appointments" className="nav-link px-2 py-1">Appointments</Link>
                      <Link to="/recommendation" className="nav-link px-2 py-1">Services</Link>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm" style={{ color: '#9ca3af' }}>{me.email}</span>
                <button onClick={logout} className="btn-secondary text-sm px-4 py-2">Logout</button>
              </div>
            </div>
          </div>
        </nav>

        {/* Dashboard Content */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          {me.role === 'client' && (
            <div className="grid lg:grid-cols-3 gap-6 mb-12">
              <div className="lg:col-span-1">
                <div className="card-metallic">
                  <h3 className="text-xl font-bold mb-4" style={{ color: '#60a5fa' }}>Quick Booking</h3>
                  <div className="flex flex-col gap-3">
                    <input className="input-modern" placeholder="Vehicle VIN" value={qbVin} onChange={e => setQbVin(e.target.value)} />
                    <input className="input-modern" placeholder="Service type" value={qbType} onChange={e => setQbType(e.target.value)} />
                    <input className="input-modern" placeholder="Date & Time (ISO)" value={qbWhen} onChange={e => setQbWhen(e.target.value)} />
                    <button className="btn-primary" onClick={quickBook}>Book Now</button>
                    {msg && <div style={{ color: '#4ade80', fontSize: '0.875rem' }}>{msg}</div>}
                  </div>
                </div>
              </div>
              <div className="lg:col-span-2">
                <div className="card-metallic">
                  <h3 className="text-xl font-bold mb-4" style={{ color: '#60a5fa' }}>My Bookings</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(75, 85, 99, 0.5)' }}>
                          <th className="text-left py-3 px-4" style={{ color: '#9ca3af', fontSize: '0.875rem' }}>ID</th>
                          <th className="text-left py-3 px-4" style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Type</th>
                          <th className="text-left py-3 px-4" style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Scheduled</th>
                          <th className="text-left py-3 px-4" style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appts.map(a => (
                          <tr key={a.id} style={{ borderBottom: '1px solid rgba(31, 41, 55, 0.5)' }}>
                            <td className="py-3 px-4">{a.id}</td>
                            <td className="py-3 px-4">{a.service_type}</td>
                            <td className="py-3 px-4" style={{ color: '#9ca3af' }}>{new Date(a.scheduled_at).toLocaleString()}</td>
                            <td className="py-3 px-4"><span className="px-2 py-1 rounded" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>{a.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-4 text-sm" style={{ color: '#9ca3af' }}>Reminders are auto-sent 24h before each booking.</p>
                </div>
              </div>
            </div>
          )}

          {(me.role === 'staff' || me.role === 'admin') && (
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <DashboardOrdersCard title="Pending" items={grouped.pending} />
              <DashboardOrdersCard title="In Progress" items={grouped.in_progress} />
              <DashboardOrdersCard title="Ready" items={grouped.ready} />
            </div>
          )}
        </div>
      </div>
    )
  }

  // Public homepage
  return (
    <div className="min-h-screen">
      {/* Top Navigation Bar */}
      <nav className="glass-nav sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-10">
              <h1 className="text-2xl font-bold text-white text-glow">Premium Automotive Service</h1>
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
      <section className="relative overflow-hidden py-32 px-6" style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)'
      }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-6xl font-bold mb-6 text-white leading-tight" style={{
                textShadow: '0 0 30px rgba(59, 130, 246, 0.5)',
                fontFamily: "'Poppins', sans-serif"
              }}>
                Premium Automotive Service
              </h2>
              <p className="text-xl mb-10 leading-relaxed" style={{ color: '#d1d5db', fontFamily: "'Montserrat', sans-serif" }}>
                Experience luxury car care with cutting-edge diagnostics, expert repairs, and premium detailing. Trusted by enthusiasts worldwide.
              </p>
              <div className="flex gap-4">
                <Link to="/signup" className="btn-primary text-lg px-8 py-4">Book Service</Link>
                <Link to="/login" className="btn-secondary text-lg px-8 py-4">Login</Link>
              </div>
            </div>
            <div className="relative flex justify-center items-center">
              <div className="card-metallic p-8" style={{
                boxShadow: '0 0 40px rgba(59, 130, 246, 0.4), 0 0 80px rgba(59, 130, 246, 0.2)'
              }}>
                <div className="text-9xl" style={{ 
                  filter: 'drop-shadow(0 0 30px rgba(59, 130, 246, 0.6))',
                  transform: 'perspective(1000px) rotateY(-15deg)'
                }}>🚗</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Services Section */}
      <section className="py-20 px-6" style={{ background: 'rgba(10, 10, 15, 0.5)' }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Our <span style={{ color: '#3b82f6' }}>Services</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <ServiceCard
              icon="🔧"
              title="Car Repair"
              description="Expert diagnostics and repairs with state-of-the-art equipment. We handle everything from engine issues to electrical problems."
            />
            <ServiceCard
              icon="✨"
              title="Premium Detailing"
              description="Transform your vehicle with our premium detailing service. Interior deep clean, exterior polish, and ceramic coating available."
            />
            <ServiceCard
              icon="📊"
              title="Diagnostics"
              description="Advanced computer diagnostics to identify and resolve issues quickly. Full system health checks and performance tuning."
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
            What Our <span style={{ color: '#3b82f6' }}>Clients</span> Say
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard
              name="Sarah Johnson"
              role="Luxury Car Owner"
              text="Exceptional service! My Mercedes was in perfect hands."
            />
            <TestimonialCard
              name="Michael Chen"
              role="Car Enthusiast"
              text="Best detailing service I've ever used."
            />
            <TestimonialCard
              name="Emma Williams"
              role="Fleet Manager"
              text="Reliable diagnostics and fast turnaround."
            />
          </div>
        </div>
      </section>
    </div>
  )
}

function ServiceCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="card-service">
      <div className="text-6xl mb-6 text-center">{icon}</div>
      <h3 className="text-2xl font-bold mb-4 text-center" style={{ color: '#3b82f6', fontFamily: "'Poppins', sans-serif" }}>{title}</h3>
      <p className="text-center leading-relaxed" style={{ color: '#9ca3af', fontFamily: "'Montserrat', sans-serif" }}>{description}</p>
    </div>
  )
}

function TestimonialCard({ name, role, text }: { name: string; role: string; text: string }) {
  return (
    <div className="testimonial-card">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{
          background: 'linear-gradient(to bottom right, #3b82f6, #06b6d4)',
          boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
        }}>
          {name[0]}
        </div>
        <div>
          <div className="font-semibold text-white text-lg" style={{ fontFamily: "'Poppins', sans-serif" }}>{name}</div>
          <div className="text-sm" style={{ color: '#9ca3af', fontFamily: "'Montserrat', sans-serif" }}>{role}</div>
        </div>
      </div>
      <p className="italic leading-relaxed" style={{ color: '#d1d5db', fontFamily: "'Montserrat', sans-serif" }}>"{text}"</p>
    </div>
  )
}

function DashboardOrdersCard({ title, items }: { title: string; items: any[] }) {
  return (
    <div className="card-metallic">
      <h3 className="text-xl font-bold mb-4" style={{ color: '#60a5fa' }}>
        {title} <span style={{ color: '#9ca3af' }}>({items.length})</span>
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(75, 85, 99, 0.5)' }}>
              <th className="text-left py-2 px-3" style={{ color: '#9ca3af', fontSize: '0.875rem' }}>ID</th>
              <th className="text-left py-2 px-3" style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Vehicle</th>
              <th className="text-left py-2 px-3" style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {items.map(o => (
              <tr key={o.id} style={{ borderBottom: '1px solid rgba(31, 41, 55, 0.5)' }}>
                <td className="py-2 px-3 text-sm">{o.id}</td>
                <td className="py-2 px-3 text-sm">{o.vehicle_id}</td>
                <td className="py-2 px-3 text-sm" style={{ color: '#9ca3af' }}>{o.mechanic_notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Link to="/orders" className="btn-primary mt-4 inline-block text-sm px-4 py-2">Open</Link>
    </div>
  )
}
