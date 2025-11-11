import { useState, useEffect } from 'react'
import { api } from '../lib/api'

export default function SiteManager() {
  const [jobs, setJobs] = useState<any[]>([])
  const [technicians, setTechnicians] = useState<any[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [msg, setMsg] = useState('')
  
  // Form state
  const [formData, setFormData] = useState({
    registration_number: '',
    vin: '',
    owner_name: '',
    owner_contact: '',
    make: '',
    model: '',
    year: '',
    current_mileage: 0,
    operations_stream: 'body_works',
    revenue_stream: 'walk_in',
    issues_reported: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [jobsData, techsData] = await Promise.all([
        api.listJobs(),
        api.listUsers('technician')
      ])
      setJobs(jobsData as any[])
      setTechnicians((techsData as any[]) || [])
    } catch (err: any) {
      setMsg(err.message)
    }
  }

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.createJob(formData)
      setMsg('Job created successfully!')
      setShowCreateForm(false)
      setFormData({
        registration_number: '',
        vin: '',
        owner_name: '',
        owner_contact: '',
        make: '',
        model: '',
        year: '',
        current_mileage: 0,
        operations_stream: 'body_works',
        revenue_stream: 'walk_in',
        issues_reported: ''
      })
      loadData()
    } catch (err: any) {
      setMsg(err.message)
    }
    setTimeout(() => setMsg(''), 3000)
  }

  const handleAssign = async (jobId: number, technicianId: number) => {
    try {
      await api.assignJob(jobId, technicianId)
      setMsg('Job assigned successfully!')
      loadData()
    } catch (err: any) {
      setMsg(err.message)
    }
    setTimeout(() => setMsg(''), 3000)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      received: 'bg-gray-500',
      assigned: 'bg-blue-500',
      in_progress: 'bg-yellow-500',
      awaiting_parts: 'bg-orange-500',
      completed: 'bg-green-500',
      manager_review: 'bg-purple-500',
      billing: 'bg-indigo-500',
      invoiced: 'bg-teal-500'
    }
    return colors[status] || 'bg-gray-500'
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Site Manager Dashboard</h1>
        <button onClick={() => setShowCreateForm(!showCreateForm)} className="btn-primary">
          {showCreateForm ? 'Cancel' : 'Receive Vehicle'}
        </button>
      </div>

      {msg && (
        <div className={`mb-4 p-4 rounded-lg ${msg.includes('success') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {msg}
        </div>
      )}

      {showCreateForm && (
        <div className="card-metallic mb-8">
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#3b82f6' }}>Receive Vehicle</h2>
          <form onSubmit={handleCreateJob} className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Registration Number *</label>
              <input
                className="input-modern w-full"
                value={formData.registration_number}
                onChange={e => setFormData({...formData, registration_number: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">VIN</label>
              <input
                className="input-modern w-full"
                value={formData.vin}
                onChange={e => setFormData({...formData, vin: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Owner Name *</label>
              <input
                className="input-modern w-full"
                value={formData.owner_name}
                onChange={e => setFormData({...formData, owner_name: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Owner Contact *</label>
              <input
                className="input-modern w-full"
                value={formData.owner_contact}
                onChange={e => setFormData({...formData, owner_contact: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Make</label>
              <input
                className="input-modern w-full"
                value={formData.make}
                onChange={e => setFormData({...formData, make: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Model</label>
              <input
                className="input-modern w-full"
                value={formData.model}
                onChange={e => setFormData({...formData, model: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Year</label>
              <input
                type="number"
                className="input-modern w-full"
                value={formData.year}
                onChange={e => setFormData({...formData, year: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Current Mileage</label>
              <input
                type="number"
                className="input-modern w-full"
                value={formData.current_mileage}
                onChange={e => setFormData({...formData, current_mileage: parseInt(e.target.value) || 0})}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Operations Stream *</label>
              <select
                className="input-modern w-full"
                value={formData.operations_stream}
                onChange={e => setFormData({...formData, operations_stream: e.target.value})}
                required
              >
                <option value="body_works">Body Works</option>
                <option value="mechanical_works">Mechanical Works</option>
                <option value="electrical_works">Electrical Works</option>
                <option value="interior_works">Interior Works</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Revenue Stream *</label>
              <select
                className="input-modern w-full"
                value={formData.revenue_stream}
                onChange={e => setFormData({...formData, revenue_stream: e.target.value})}
                required
              >
                <option value="walk_in">Walk-in</option>
                <option value="scheduled_service">Scheduled Service</option>
                <option value="spare_parts">Spare Parts</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-2">Issues Reported *</label>
              <textarea
                className="input-modern w-full"
                rows={4}
                value={formData.issues_reported}
                onChange={e => setFormData({...formData, issues_reported: e.target.value})}
                required
              />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="btn-primary w-full">Create Job</button>
            </div>
          </form>
        </div>
      )}

      <div className="card-metallic">
        <h2 className="text-2xl font-bold mb-6" style={{ color: '#3b82f6' }}>All Jobs</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(75, 85, 99, 0.5)' }}>
                <th className="text-left py-3 px-4 text-gray-400">ID</th>
                <th className="text-left py-3 px-4 text-gray-400">Vehicle</th>
                <th className="text-left py-3 px-4 text-gray-400">Owner</th>
                <th className="text-left py-3 px-4 text-gray-400">Stream</th>
                <th className="text-left py-3 px-4 text-gray-400">Status</th>
                <th className="text-left py-3 px-4 text-gray-400">Technician</th>
                <th className="text-left py-3 px-4 text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => (
                <tr key={job.id} style={{ borderBottom: '1px solid rgba(31, 41, 55, 0.5)' }}>
                  <td className="py-3 px-4">{job.id}</td>
                  <td className="py-3 px-4">{job.vehicle?.registration_number || 'N/A'}</td>
                  <td className="py-3 px-4">{job.vehicle?.owner_name || 'N/A'}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded text-xs" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>
                      {job.operations_stream?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs text-white ${getStatusColor(job.status)}`}>
                      {job.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {job.technician ? job.technician.full_name || job.technician.email : (
                      <select
                        className="input-modern text-sm"
                        onChange={e => handleAssign(job.id, parseInt(e.target.value))}
                        defaultValue=""
                      >
                        <option value="">Assign...</option>
                        {technicians.map(tech => (
                          <option key={tech.id} value={tech.id}>
                            {tech.full_name || tech.email}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <a href={`/jobs/${job.id}`} className="text-blue-400 hover:text-blue-300">View</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

