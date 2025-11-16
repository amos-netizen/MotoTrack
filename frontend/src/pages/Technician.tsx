import { useState, useEffect } from 'react'
import { api } from '../lib/api'

export default function Technician() {
  const [jobs, setJobs] = useState<any[]>([])
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [jobTasks, setJobTasks] = useState<any[]>([])
  const [availableTasks, setAvailableTasks] = useState<any[]>([])
  const [partsRequests, setPartsRequests] = useState<any[]>([])
  const [warehouseItems, setWarehouseItems] = useState<any[]>([])
  const [msg, setMsg] = useState('')
  const [showPartsForm, setShowPartsForm] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)

  const [partsForm, setPartsForm] = useState({ warehouse_item_id: '', quantity: 1, notes: '' })
  const [workNotes, setWorkNotes] = useState('')

  useEffect(() => {
    loadJobs()
  }, [])

  useEffect(() => {
    if (selectedJob) {
      loadJobDetails()
    }
  }, [selectedJob])

  const loadJobs = async () => {
    try {
      const data = await api.listJobs({ status: 'assigned' })
      setJobs(data as any)
    } catch (err: any) {
      setMsg(err.message)
    }
  }

  const loadJobDetails = async () => {
    if (!selectedJob) return
    try {
      const [jobData, tasks, requests, tasksList] = await Promise.all([
        api.getJob(selectedJob.id),
        api.listJobTasks(selectedJob.id),
        api.listJobRequests(selectedJob.id),
        api.listTaskActions({ operations_stream: selectedJob.operations_stream, active_only: true })
      ])
      setSelectedJob(jobData as any)
      setJobTasks(tasks as any)
      setPartsRequests(requests as any)
      setAvailableTasks(tasksList as any)
    } catch (err: any) {
      setMsg(err.message)
    }
  }

  const loadWarehouseItems = async () => {
    try {
      const items = await api.listWarehouseItems(true)
      setWarehouseItems(items as any)
    } catch (err: any) {
      setMsg(err.message)
    }
  }

  const handleStartJob = async (jobId: number) => {
    try {
      await api.updateJob(jobId, { status: 'in_progress' })
      setMsg('Job started!')
      loadJobs()
    } catch (err: any) {
      setMsg(err.message)
    }
    setTimeout(() => setMsg(''), 3000)
  }

  const [taskForm, setTaskForm] = useState({ task_action_id: '', notes: '' })

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedJob) return
    try {
      await api.addTaskToJob(selectedJob.id, {
        task_action_id: parseInt(taskForm.task_action_id),
        labor_cost: null,
        notes: taskForm.notes
      })
      setMsg('Task added!')
      setShowTaskForm(false)
      setTaskForm({ task_action_id: '', notes: '' })
      loadJobDetails()
    } catch (err: any) {
      setMsg(err.message)
    }
    setTimeout(() => setMsg(''), 3000)
  }

  const handleRequestParts = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedJob) return
    try {
      await api.createSparePartRequest(selectedJob.id, partsForm)
      setMsg('Parts request created!')
      setShowPartsForm(false)
      setPartsForm({ warehouse_item_id: '', quantity: 1, notes: '' })
      loadJobDetails()
    } catch (err: any) {
      setMsg(err.message)
    }
    setTimeout(() => setMsg(''), 3000)
  }

  const handleCompleteTask = async (taskId: number) => {
    if (!selectedJob) return
    try {
      await api.completeJobTask(selectedJob.id, taskId)
      setMsg('Task marked complete!')
      loadJobDetails()
    } catch (err: any) {
      setMsg(err.message)
    }
    setTimeout(() => setMsg(''), 3000)
  }

  const handleUpdateWork = async () => {
    if (!selectedJob) return
    try {
      await api.updateJob(selectedJob.id, { work_done: workNotes })
      setMsg('Work notes updated!')
      loadJobDetails()
    } catch (err: any) {
      setMsg(err.message)
    }
    setTimeout(() => setMsg(''), 3000)
  }

  const handleCompleteJob = async () => {
    if (!selectedJob) return
    try {
      await api.completeJob(selectedJob.id)
      setMsg('Job marked complete!')
      setSelectedJob(null)
      loadJobs()
    } catch (err: any) {
      setMsg(err.message)
    }
    setTimeout(() => setMsg(''), 3000)
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Technician Dashboard</h1>

      {msg && (
        <div className={`mb-4 p-4 rounded-lg ${msg.includes('success') || msg.includes('complete') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {msg}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card-metallic">
            <h2 className="text-xl font-bold mb-4" style={{ color: '#3b82f6' }}>My Jobs</h2>
            <div className="space-y-2">
              {jobs.map(job => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    selectedJob?.id === job.id ? 'bg-blue-500/20 border border-blue-500' : 'bg-gray-800/50 hover:bg-gray-800/70'
                  }`}
                >
                  <div className="font-semibold text-white">Job #{job.id}</div>
                  <div className="text-sm text-gray-400">{job.vehicle?.registration_number}</div>
                  <div className="text-xs text-gray-500 mt-1">{job.status?.replace('_', ' ')}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedJob ? (
            <div className="card-metallic">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Job #{selectedJob.id}</h2>
                  <p className="text-gray-400">Vehicle: {selectedJob.vehicle?.registration_number}</p>
                  <p className="text-gray-400">Owner: {selectedJob.vehicle?.owner_name}</p>
                  <p className="text-gray-400">Stream: {selectedJob.operations_stream?.replace('_', ' ')}</p>
                </div>
                {selectedJob.status === 'assigned' && (
                  <button onClick={() => handleStartJob(selectedJob.id)} className="btn-primary">
                    Start Job
                  </button>
                )}
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 text-white">Issues Reported</h3>
                <p className="text-gray-300 bg-gray-800/50 p-4 rounded-lg">{selectedJob.issues_reported}</p>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 text-white">Work Done</h3>
                <textarea
                  className="input-modern w-full"
                  rows={4}
                  value={workNotes || selectedJob.work_done || ''}
                  onChange={e => setWorkNotes(e.target.value)}
                  placeholder="Describe work done..."
                />
                <button onClick={handleUpdateWork} className="btn-secondary mt-2">Update Work Notes</button>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white">Tasks</h3>
                  <button onClick={() => { setShowTaskForm(true); loadWarehouseItems() }} className="btn-secondary text-sm">
                    Add Task
                  </button>
                </div>
                {showTaskForm && (
                  <div className="mb-4 p-4 bg-gray-800/50 rounded-lg">
                    <form onSubmit={handleAddTask}>
                      <select
                        className="input-modern w-full mb-2"
                        value={taskForm.task_action_id}
                        onChange={e => setTaskForm({...taskForm, task_action_id: e.target.value})}
                        required
                      >
                        <option value="">Select Task...</option>
                        {availableTasks.map(task => (
                          <option key={task.id} value={task.id}>{task.name}</option>
                        ))}
                      </select>
                      <textarea
                        className="input-modern w-full mb-2"
                        placeholder="Notes (optional)"
                        value={taskForm.notes}
                        onChange={e => setTaskForm({...taskForm, notes: e.target.value})}
                      />
                      <div className="flex gap-2">
                        <button type="submit" className="btn-primary flex-1">Add</button>
                        <button type="button" onClick={() => setShowTaskForm(false)} className="btn-secondary">Cancel</button>
                      </div>
                    </form>
                  </div>
                )}
                <div className="space-y-2">
                  {jobTasks.map(task => (
                    <div key={task.id} className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                      <div>
                        <div className="font-semibold text-white">{task.task_action?.name}</div>
                        <div className="text-sm text-gray-400">Cost: ${task.labor_cost || task.task_action?.default_labor_cost || 0}</div>
                      </div>
                      {!task.completed && (
                        <button onClick={() => handleCompleteTask(task.id)} className="btn-secondary text-sm">
                          Mark Complete
                        </button>
                      )}
                      {task.completed && <span className="text-green-400 text-sm">✓ Complete</span>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white">Parts Requests</h3>
                  <button onClick={() => { setShowPartsForm(true); loadWarehouseItems() }} className="btn-secondary text-sm">
                    Request Parts
                  </button>
                </div>
                {showPartsForm && (
                  <div className="mb-4 p-4 bg-gray-800/50 rounded-lg">
                    <form onSubmit={handleRequestParts}>
                      <select
                        className="input-modern w-full mb-2"
                        value={partsForm.warehouse_item_id}
                        onChange={e => setPartsForm({...partsForm, warehouse_item_id: e.target.value})}
                        required
                      >
                        <option value="">Select Part...</option>
                        {warehouseItems.map(item => (
                          <option key={item.id} value={item.id}>
                            {item.name} (Stock: {item.quantity_in_stock})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        className="input-modern w-full mb-2"
                        placeholder="Quantity"
                        value={partsForm.quantity}
                        onChange={e => setPartsForm({...partsForm, quantity: parseInt(e.target.value) || 1})}
                        required
                        min={1}
                      />
                      <textarea
                        className="input-modern w-full mb-2"
                        placeholder="Notes (optional)"
                        value={partsForm.notes}
                        onChange={e => setPartsForm({...partsForm, notes: e.target.value})}
                      />
                      <div className="flex gap-2">
                        <button type="submit" className="btn-primary flex-1">Request</button>
                        <button type="button" onClick={() => setShowPartsForm(false)} className="btn-secondary">Cancel</button>
                      </div>
                    </form>
                  </div>
                )}
                <div className="space-y-2">
                  {partsRequests.map(req => (
                    <div key={req.id} className="p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-white">{req.warehouse_item?.name}</div>
                          <div className="text-sm text-gray-400">Qty: {req.quantity} | Status: {req.status}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedJob.status === 'in_progress' && (
                <button onClick={handleCompleteJob} className="btn-primary w-full">
                  Mark Job Complete
                </button>
              )}
            </div>
          ) : (
            <div className="card-metallic text-center py-12">
              <p className="text-gray-400">Select a job to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

