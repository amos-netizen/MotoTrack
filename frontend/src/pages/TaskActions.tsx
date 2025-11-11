import { useState, useEffect } from 'react'
import { api } from '../lib/api'

export default function TaskActions() {
  const [tasks, setTasks] = useState<any[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [filterStream, setFilterStream] = useState<string>('')
  const [msg, setMsg] = useState('')

  const [formData, setFormData] = useState({
    operations_stream: 'body_works',
    name: '',
    description: '',
    default_labor_cost: 0
  })

  useEffect(() => {
    loadTasks()
  }, [filterStream])

  const loadTasks = async () => {
    try {
      const data = await api.listTaskActions({
        operations_stream: filterStream || undefined,
        active_only: false
      })
      setTasks(data)
    } catch (err: any) {
      setMsg(err.message)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.createTaskAction(formData)
      setMsg('Task action created!')
      setShowCreateForm(false)
      setFormData({
        operations_stream: 'body_works',
        name: '',
        description: '',
        default_labor_cost: 0
      })
      loadTasks()
    } catch (err: any) {
      setMsg(err.message)
    }
    setTimeout(() => setMsg(''), 3000)
  }

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      await api.updateTaskAction(id, { is_active: !isActive })
      setMsg('Task action updated!')
      loadTasks()
    } catch (err: any) {
      setMsg(err.message)
    }
    setTimeout(() => setMsg(''), 3000)
  }

  const getStreamColor = (stream: string) => {
    const colors: Record<string, string> = {
      body_works: 'bg-blue-500/20 text-blue-400',
      mechanical_works: 'bg-green-500/20 text-green-400',
      electrical_works: 'bg-yellow-500/20 text-yellow-400',
      interior_works: 'bg-purple-500/20 text-purple-400'
    }
    return colors[stream] || 'bg-gray-500/20 text-gray-400'
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Task Actions Management</h1>
        <button onClick={() => setShowCreateForm(!showCreateForm)} className="btn-primary">
          {showCreateForm ? 'Cancel' : 'Create Task Action'}
        </button>
      </div>

      {msg && (
        <div className={`mb-4 p-4 rounded-lg ${msg.includes('success') || msg.includes('created') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {msg}
        </div>
      )}

      {showCreateForm && (
        <div className="card-metallic mb-8">
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#3b82f6' }}>Create Task Action</h2>
          <form onSubmit={handleCreate} className="grid md:grid-cols-2 gap-4">
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
              <label className="block text-sm text-gray-400 mb-2">Name *</label>
              <input
                className="input-modern w-full"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-2">Description</label>
              <textarea
                className="input-modern w-full"
                rows={3}
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Default Labor Cost</label>
              <input
                type="number"
                step="0.01"
                className="input-modern w-full"
                value={formData.default_labor_cost}
                onChange={e => setFormData({...formData, default_labor_cost: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="btn-primary w-full">Create Task Action</button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-2">Filter by Operations Stream</label>
        <select
          className="input-modern"
          value={filterStream}
          onChange={e => setFilterStream(e.target.value)}
        >
          <option value="">All Streams</option>
          <option value="body_works">Body Works</option>
          <option value="mechanical_works">Mechanical Works</option>
          <option value="electrical_works">Electrical Works</option>
          <option value="interior_works">Interior Works</option>
        </select>
      </div>

      <div className="card-metallic">
        <h2 className="text-xl font-bold mb-4" style={{ color: '#3b82f6' }}>Task Actions</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map(task => (
            <div key={task.id} className="p-4 bg-gray-800/50 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-semibold text-white">{task.name}</div>
                  <span className={`px-2 py-1 rounded text-xs ${getStreamColor(task.operations_stream)}`}>
                    {task.operations_stream.replace('_', ' ')}
                  </span>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${task.is_active ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                  {task.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              {task.description && (
                <p className="text-sm text-gray-400 mb-2">{task.description}</p>
              )}
              <div className="text-sm text-gray-300 mb-3">
                Default Cost: ${task.default_labor_cost.toFixed(2)}
              </div>
              <button
                onClick={() => handleToggleActive(task.id, task.is_active)}
                className={`w-full text-sm ${task.is_active ? 'btn-secondary' : 'btn-primary'}`}
              >
                {task.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          ))}
        </div>
        {tasks.length === 0 && (
          <p className="text-gray-400 text-center py-8">No task actions found</p>
        )}
      </div>
    </div>
  )
}


