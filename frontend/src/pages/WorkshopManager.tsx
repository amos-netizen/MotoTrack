import { useState, useEffect } from 'react'
import { api } from '../lib/api'

export default function WorkshopManager() {
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [completedJobs, setCompletedJobs] = useState<any[]>([])
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [requests, jobs] = await Promise.all([
        api.listPendingRequests(),
        api.listJobs({ status: 'completed' })
      ])
      setPendingRequests(requests.filter((r: any) => r.status === 'pending'))
      setCompletedJobs(jobs)
    } catch (err: any) {
      setMsg(err.message)
    }
  }

  const handleApprove = async (id: number) => {
    try {
      await api.approveRequest(id)
      setMsg('Request approved!')
      loadData()
    } catch (err: any) {
      setMsg(err.message)
    }
    setTimeout(() => setMsg(''), 3000)
  }

  const handleReject = async (id: number) => {
    const notes = prompt('Rejection reason:')
    if (notes === null) return
    try {
      await api.rejectRequest(id, notes)
      setMsg('Request rejected!')
      loadData()
    } catch (err: any) {
      setMsg(err.message)
    }
    setTimeout(() => setMsg(''), 3000)
  }

  const handleReview = async (jobId: number) => {
    const notes = prompt('Manager notes (optional):')
    try {
      await api.managerReview(jobId, notes || undefined)
      setMsg('Job reviewed!')
      loadData()
    } catch (err: any) {
      setMsg(err.message)
    }
    setTimeout(() => setMsg(''), 3000)
  }

  const handleMoveToBilling = async (jobId: number) => {
    try {
      await api.moveToBilling(jobId)
      setMsg('Job moved to billing!')
      loadData()
    } catch (err: any) {
      setMsg(err.message)
    }
    setTimeout(() => setMsg(''), 3000)
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Workshop Manager Dashboard</h1>

      {msg && (
        <div className={`mb-4 p-4 rounded-lg ${msg.includes('success') || msg.includes('approved') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {msg}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="card-metallic">
          <h2 className="text-xl font-bold mb-4" style={{ color: '#3b82f6' }}>Pending Parts Requests</h2>
          <div className="space-y-3">
            {pendingRequests.map(req => (
              <div key={req.id} className="p-4 bg-gray-800/50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold text-white">{req.warehouse_item?.name}</div>
                    <div className="text-sm text-gray-400">Job #{req.job_id} | Qty: {req.quantity}</div>
                    {req.notes && <div className="text-sm text-gray-500 mt-1">{req.notes}</div>}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => handleApprove(req.id)} className="btn-primary flex-1 text-sm">
                    Approve
                  </button>
                  <button onClick={() => handleReject(req.id)} className="btn-secondary flex-1 text-sm">
                    Reject
                  </button>
                </div>
              </div>
            ))}
            {pendingRequests.length === 0 && (
              <p className="text-gray-400 text-center py-8">No pending requests</p>
            )}
          </div>
        </div>

        <div className="card-metallic">
          <h2 className="text-xl font-bold mb-4" style={{ color: '#3b82f6' }}>Completed Jobs (Awaiting Review)</h2>
          <div className="space-y-3">
            {completedJobs.map(job => (
              <div key={job.id} className="p-4 bg-gray-800/50 rounded-lg">
                <div className="font-semibold text-white">Job #{job.id}</div>
                <div className="text-sm text-gray-400 mb-3">
                  {job.vehicle?.registration_number} | {job.operations_stream?.replace('_', ' ')}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleReview(job.id)} className="btn-primary flex-1 text-sm">
                    Review
                  </button>
                  {job.status === 'manager_review' && (
                    <button onClick={() => handleMoveToBilling(job.id)} className="btn-secondary flex-1 text-sm">
                      Move to Billing
                    </button>
                  )}
                </div>
              </div>
            ))}
            {completedJobs.length === 0 && (
              <p className="text-gray-400 text-center py-8">No completed jobs</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


