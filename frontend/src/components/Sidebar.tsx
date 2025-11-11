import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { clearToken } from '../lib/auth'

interface SidebarProps {
  user: any
  onLogout: () => void
}

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const location = useLocation()

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: '📊', roles: ['client', 'staff', 'admin', 'site_manager', 'technician', 'workshop_manager', 'warehouse_manager', 'billing'] },
    { path: '/site-manager', label: 'Site Manager', icon: '👔', roles: ['site_manager'] },
    { path: '/technician', label: 'Technician', icon: '🔧', roles: ['technician'] },
    { path: '/workshop-manager', label: 'Workshop', icon: '⚙️', roles: ['workshop_manager'] },
    { path: '/warehouse-manager', label: 'Warehouse', icon: '📦', roles: ['warehouse_manager'] },
    { path: '/billing', label: 'Billing', icon: '💰', roles: ['billing', 'admin'] },
    { path: '/user-management', label: 'User Management', icon: '👥', roles: ['admin', 'operation_manager'] },
    { path: '/task-actions', label: 'Task Actions', icon: '✅', roles: ['admin'] },
    { path: '/orders', label: 'Orders', icon: '📋', roles: ['client', 'staff', 'admin'] },
    { path: '/appointments', label: 'Appointments', icon: '📅', roles: ['client', 'staff'] },
    { path: '/recommendation', label: 'Services', icon: '🔍', roles: ['client', 'staff'] },
  ]

  const visibleItems = menuItems.filter(item => 
    item.roles.includes(user?.role) || user?.role === 'admin'
  )

  const handleLogout = () => {
    clearToken()
    onLogout()
  }

  return (
    <motion.div 
      className="glass-sidebar w-64 min-h-screen p-6 fixed left-0 top-0 z-40"
      initial={{ x: -100 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Logo */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-glow" style={{ 
          fontFamily: 'Poppins, sans-serif',
          background: 'linear-gradient(135deg, #66FCF1, #00D4FF)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Moto<span style={{ color: '#FFD700' }}>Track</span>
        </h1>
        <p className="text-xs text-[#C5C6C7] opacity-70 mt-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Premium Service
        </p>
      </div>

      {/* Navigation */}
      <nav className="space-y-2">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="absolute bottom-6 left-6 right-6">
        <div className="card-glass p-4 mb-4">
          <p className="text-sm text-[#C5C6C7] font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {user?.email}
          </p>
          <p className="text-xs text-[#66FCF1] mt-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            {user?.role?.replace('_', ' ').toUpperCase()}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="btn-secondary w-full text-sm"
        >
          Logout
        </button>
      </div>
    </motion.div>
  )
}

