import { useState, useEffect } from 'react'
import { api } from '../lib/api'

export default function WarehouseManager() {
  const [items, setItems] = useState<any[]>([])
  const [approvedRequests, setApprovedRequests] = useState<any[]>([])
  const [lowStockItems, setLowStockItems] = useState<any[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [msg, setMsg] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    part_number: '',
    description: '',
    quantity_in_stock: 0,
    unit_price: 0,
    reorder_level: 0
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [itemsData, requests, lowStock] = await Promise.all([
        api.listWarehouseItems(true),
        api.listPendingRequests(),
        api.listLowStockItems()
      ])
      setItems(itemsData)
      setApprovedRequests(requests.filter((r: any) => r.status === 'approved'))
      setLowStockItems(lowStock)
    } catch (err: any) {
      setMsg(err.message)
    }
  }

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.createWarehouseItem(formData)
      setMsg('Item created!')
      setShowCreateForm(false)
      setFormData({
        name: '',
        part_number: '',
        description: '',
        quantity_in_stock: 0,
        unit_price: 0,
        reorder_level: 0
      })
      loadData()
    } catch (err: any) {
      setMsg(err.message)
    }
    setTimeout(() => setMsg(''), 3000)
  }

  const handleIssue = async (id: number) => {
    try {
      await api.issueParts(id)
      setMsg('Parts issued!')
      loadData()
    } catch (err: any) {
      setMsg(err.message)
    }
    setTimeout(() => setMsg(''), 3000)
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Warehouse Manager Dashboard</h1>
        <button onClick={() => setShowCreateForm(!showCreateForm)} className="btn-primary">
          {showCreateForm ? 'Cancel' : 'Add Item'}
        </button>
      </div>

      {msg && (
        <div className={`mb-4 p-4 rounded-lg ${msg.includes('success') || msg.includes('created') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {msg}
        </div>
      )}

      {lowStockItems.length > 0 && (
        <div className="card-metallic mb-6 border-l-4" style={{ borderColor: '#f59e0b' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#f59e0b' }}>⚠ Low Stock Items</h2>
          <div className="grid md:grid-cols-3 gap-3">
            {lowStockItems.map(item => (
              <div key={item.id} className="p-3 bg-gray-800/50 rounded-lg">
                <div className="font-semibold text-white">{item.name}</div>
                <div className="text-sm text-gray-400">Stock: {item.quantity_in_stock} | Reorder: {item.reorder_level}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCreateForm && (
        <div className="card-metallic mb-8">
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#3b82f6' }}>Add Warehouse Item</h2>
          <form onSubmit={handleCreateItem} className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Name *</label>
              <input
                className="input-modern w-full"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Part Number</label>
              <input
                className="input-modern w-full"
                value={formData.part_number}
                onChange={e => setFormData({...formData, part_number: e.target.value})}
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
              <label className="block text-sm text-gray-400 mb-2">Quantity in Stock</label>
              <input
                type="number"
                className="input-modern w-full"
                value={formData.quantity_in_stock}
                onChange={e => setFormData({...formData, quantity_in_stock: parseInt(e.target.value) || 0})}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Unit Price</label>
              <input
                type="number"
                step="0.01"
                className="input-modern w-full"
                value={formData.unit_price}
                onChange={e => setFormData({...formData, unit_price: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Reorder Level</label>
              <input
                type="number"
                className="input-modern w-full"
                value={formData.reorder_level}
                onChange={e => setFormData({...formData, reorder_level: parseInt(e.target.value) || 0})}
              />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="btn-primary w-full">Create Item</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card-metallic">
          <h2 className="text-xl font-bold mb-4" style={{ color: '#3b82f6' }}>Approved Parts Requests</h2>
          <div className="space-y-3">
            {approvedRequests.map(req => (
              <div key={req.id} className="p-4 bg-gray-800/50 rounded-lg">
                <div className="font-semibold text-white">{req.warehouse_item?.name}</div>
                <div className="text-sm text-gray-400 mb-3">Job #{req.job_id} | Qty: {req.quantity} | Stock: {req.warehouse_item?.quantity_in_stock}</div>
                <button onClick={() => handleIssue(req.id)} className="btn-primary w-full text-sm">
                  Issue Parts
                </button>
              </div>
            ))}
            {approvedRequests.length === 0 && (
              <p className="text-gray-400 text-center py-8">No approved requests</p>
            )}
          </div>
        </div>

        <div className="card-metallic">
          <h2 className="text-xl font-bold mb-4" style={{ color: '#3b82f6' }}>Inventory</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(75, 85, 99, 0.5)' }}>
                  <th className="text-left py-2 px-3 text-gray-400 text-sm">Name</th>
                  <th className="text-left py-2 px-3 text-gray-400 text-sm">Stock</th>
                  <th className="text-left py-2 px-3 text-gray-400 text-sm">Price</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(31, 41, 55, 0.5)' }}>
                    <td className="py-2 px-3 text-sm">{item.name}</td>
                    <td className="py-2 px-3 text-sm">
                      <span className={item.quantity_in_stock <= item.reorder_level ? 'text-yellow-400' : 'text-white'}>
                        {item.quantity_in_stock}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-sm">${item.unit_price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}


