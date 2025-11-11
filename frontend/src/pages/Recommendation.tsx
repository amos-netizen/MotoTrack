import { useState } from 'react'
import { api } from '../lib/api'

export default function Recommendation() {
  const [vin, setVin] = useState('VIN123')
  const [result, setResult] = useState<any>(null)
  const run = async () => {
    const data = await api.recommendation(vin)
    setResult(data)
  }
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Next Service Recommendation</h2>
      <div className="flex gap-2 mb-4">
        <input className="border rounded px-3 py-2 w-64" placeholder="VIN" value={vin} onChange={e => setVin(e.target.value)} />
        <button className="bg-blue-600 text-white px-3 py-2 rounded" onClick={run}>Get Recommendation</button>
      </div>
      {result && (
        <div className="rounded border bg-white p-4">
          <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}


