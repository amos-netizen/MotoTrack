import { useEffect, useState } from 'react'
import { api } from '../lib/api'

type Appointment = {
  id: number
  vehicle_id: number
  service_type: string
  scheduled_at: string
  notes: string
  status: string
}

export default function Appointments() {
  const [list, setList] = useState<Appointment[]>([])
  const [vin, setVin] = useState('VIN123')
  const [serviceType, setServiceType] = useState('Service')
  const [when, setWhen] = useState(() => new Date(Date.now() + 48*3600*1000).toISOString())
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.listAppointments()
      setList(data as any)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const book = async () => {
    await api.createAppointment({ vehicle_vin: vin, service_type: serviceType, scheduled_at: when })
    await load()
  }

  const reschedule = async (id: number) => {
    const newTime = new Date(Date.now() + 72*3600*1000).toISOString()
    await api.updateAppointment(id, { scheduled_at: newTime })
    await load()
  }

  const cancel = async (id: number) => {
    await api.updateAppointment(id, { status: 'cancelled' })
    await load()
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Appointments</h2>
      <div className="flex gap-2 mb-4">
        <input className="border rounded px-3 py-2 w-48" placeholder="VIN" value={vin} onChange={e => setVin(e.target.value)} />
        <input className="border rounded px-3 py-2 w-40" placeholder="Type" value={serviceType} onChange={e => setServiceType(e.target.value)} />
        <input className="border rounded px-3 py-2 w-[28rem]" placeholder="ISO datetime" value={when} onChange={e => setWhen(e.target.value)} />
        <button className="bg-blue-600 text-white px-3 py-2 rounded" onClick={book}>Book</button>
        <button className="border px-3 py-2 rounded" onClick={load} disabled={loading}>{loading ? 'Loading...' : 'Refresh'}</button>
      </div>
      <div className="overflow-x-auto rounded border bg-white">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr><th className="px-3 py-2">ID</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Scheduled</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Actions</th></tr>
          </thead>
          <tbody>
            {list.map(a => (
              <tr key={a.id} className="border-t">
                <td className="px-3 py-2">{a.id}</td>
                <td className="px-3 py-2">{a.service_type}</td>
                <td className="px-3 py-2">{a.scheduled_at}</td>
                <td className="px-3 py-2">{a.status}</td>
                <td className="px-3 py-2">
                  <button className="bg-yellow-600 text-white px-3 py-1 rounded mr-2" onClick={() => reschedule(a.id)}>Reschedule +24h</button>
                  <button className="bg-red-600 text-white px-3 py-1 rounded" onClick={() => cancel(a.id)}>Cancel</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


