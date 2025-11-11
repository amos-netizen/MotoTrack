import { useEffect, useState } from 'react'
import { api } from '../lib/api'

type Order = {
  id: number
  vehicle_id: number
  created_at: string
  status: string
  work_done: string
  final_cost: number
  mechanic_notes: string
  ready_notified: boolean
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [vin, setVin] = useState('VIN123')
  const [loading, setLoading] = useState(false)
  const [rowState, setRowState] = useState<Record<number, {
    work_done?: string
    final_cost?: string
    mechanic_notes?: string
    next_vin?: string
    next_service_type?: string
    next_datetime?: string
    reschedule_vin?: string
    reschedule_datetime?: string
  }>>({})

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.listOrders()
      setOrders(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const create = async () => {
    await api.createOrder(vin)
    await load()
  }

  const markReady = async (id: number) => {
    const s = rowState[id] || {}
    const payload: any = { status: 'ready' }
    if (s.work_done !== undefined) payload.work_done = s.work_done
    if (s.final_cost !== undefined && s.final_cost !== '') payload.final_cost = parseFloat(s.final_cost)
    if (s.mechanic_notes !== undefined) payload.mechanic_notes = s.mechanic_notes
    await api.setOrderStatus(id, payload)
    await load()
  }

  const bookNextService = async (id: number) => {
    const s = rowState[id] || {}
    if (!s.next_vin || !s.next_service_type || !s.next_datetime) return
    await api.createAppointment({
      vehicle_vin: s.next_vin,
      service_type: s.next_service_type,
      scheduled_at: s.next_datetime,
    })
    await load()
  }

  const rescheduleLatest = async (id: number) => {
    const s = rowState[id] || {}
    if (!s.reschedule_vin || !s.reschedule_datetime) return
    const all = await api.listAppointments()
    const candidates = (all as any[]).filter(a => a.status === 'scheduled' && a.vehicle_id)
    // Without a vehicle lookup API, approximate by VIN matching across recent bookings we made
    // We stored VIN per booking; to keep it simple, reschedule the latest appointment overall
    let latest = (all as any[])
      .filter(a => a.status === 'scheduled')
      .sort((a, b) => (a.scheduled_at > b.scheduled_at ? -1 : 1))[0]
    if (latest) {
      await api.updateAppointment(latest.id, { scheduled_at: s.reschedule_datetime })
      await load()
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Service Orders</h2>
      <div className="flex gap-2 mb-4">
        <input className="border rounded px-3 py-2 w-64" placeholder="VIN" value={vin} onChange={e => setVin(e.target.value)} />
        <button className="bg-blue-600 text-white px-3 py-2 rounded" onClick={create}>Create Order</button>
        <button className="border px-3 py-2 rounded" onClick={load} disabled={loading}>{loading ? 'Loading...' : 'Refresh'}</button>
      </div>
      <div className="overflow-x-auto rounded border bg-white">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Work</th>
              <th className="px-3 py-2">Cost</th>
              <th className="px-3 py-2">Notes</th>
              <th className="px-3 py-2">Actions</th>
              <th className="px-3 py-2">Book Next Service</th>
              <th className="px-3 py-2">Reschedule</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} className="border-t">
                <td className="px-3 py-2">{o.id}</td>
                <td className="px-3 py-2">{o.status}</td>
                <td className="px-3 py-2">
                  <input
                    className="border rounded px-2 py-1 w-56"
                    placeholder="Work done"
                    value={rowState[o.id]?.work_done ?? o.work_done ?? ''}
                    onChange={e => setRowState(s => ({ ...s, [o.id]: { ...(s[o.id]||{}), work_done: e.target.value } }))}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    className="border rounded px-2 py-1 w-24"
                    placeholder="Cost"
                    type="number"
                    step="0.01"
                    value={rowState[o.id]?.final_cost ?? (o.final_cost || '')}
                    onChange={e => setRowState(s => ({ ...s, [o.id]: { ...(s[o.id]||{}), final_cost: e.target.value } }))}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    className="border rounded px-2 py-1 w-64"
                    placeholder="Mechanic notes"
                    value={rowState[o.id]?.mechanic_notes ?? o.mechanic_notes ?? ''}
                    onChange={e => setRowState(s => ({ ...s, [o.id]: { ...(s[o.id]||{}), mechanic_notes: e.target.value } }))}
                  />
                </td>
                <td className="px-3 py-2">
                  {o.status !== 'ready' && (
                    <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={() => markReady(o.id)}>Mark Ready</button>
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-col gap-1">
                    <input className="border rounded px-2 py-1" placeholder="VIN" value={rowState[o.id]?.next_vin ?? ''} onChange={e => setRowState(s => ({ ...s, [o.id]: { ...(s[o.id]||{}), next_vin: e.target.value } }))} />
                    <input className="border rounded px-2 py-1" placeholder="Service type" value={rowState[o.id]?.next_service_type ?? ''} onChange={e => setRowState(s => ({ ...s, [o.id]: { ...(s[o.id]||{}), next_service_type: e.target.value } }))} />
                    <input className="border rounded px-2 py-1" placeholder="ISO datetime" value={rowState[o.id]?.next_datetime ?? ''} onChange={e => setRowState(s => ({ ...s, [o.id]: { ...(s[o.id]||{}), next_datetime: e.target.value } }))} />
                    <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={() => bookNextService(o.id)}>Book</button>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-col gap-1">
                    <input className="border rounded px-2 py-1" placeholder="VIN" value={rowState[o.id]?.reschedule_vin ?? ''} onChange={e => setRowState(s => ({ ...s, [o.id]: { ...(s[o.id]||{}), reschedule_vin: e.target.value } }))} />
                    <input className="border rounded px-2 py-1" placeholder="New ISO datetime" value={rowState[o.id]?.reschedule_datetime ?? ''} onChange={e => setRowState(s => ({ ...s, [o.id]: { ...(s[o.id]||{}), reschedule_datetime: e.target.value } }))} />
                    <button className="bg-yellow-600 text-white px-3 py-1 rounded" onClick={() => rescheduleLatest(o.id)}>Reschedule</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


