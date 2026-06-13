'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Client {
  id: string; name: string; phone: string; location: string
  delivery_cost_kes: number; active: boolean
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([])
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', location: '', delivery_cost_kes: '0' })

  async function load() {
    const { data } = await supabase.from('clients').select('*').order('name')
    if (data) setClients(data)
  }

  useEffect(() => { load() }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const { error } = await supabase.from('clients').insert({
      ...form, delivery_cost_kes: parseFloat(form.delivery_cost_kes),
    })
    setSaving(false)
    if (!error) { setMsg('Client added!'); setForm({ name: '', phone: '', location: '', delivery_cost_kes: '0' }); load() }
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('clients').update({ active: !current }).eq('id', id)
    load()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Clients</h1>

      {msg && <div className="mb-4 bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3">✓ {msg}</div>}

      <form onSubmit={save} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
        <h2 className="font-bold text-gray-800 mb-4">Add Client</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required
              className="w-full border border-gray-300 rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery cost (KES)</label>
            <input type="number" min="0" value={form.delivery_cost_kes} onChange={e => setForm(p => ({ ...p, delivery_cost_kes: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-3 py-2" />
          </div>
        </div>
        <button disabled={saving} className="mt-4 bg-green-700 text-white rounded-xl px-6 py-3 font-semibold disabled:opacity-40">
          Add Client
        </button>
      </form>

      <div className="space-y-3">
        {clients.map(c => (
          <div key={c.id} className={`bg-white rounded-2xl p-4 shadow-sm border ${c.active ? 'border-gray-100' : 'border-gray-200 opacity-60'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900">{c.name}</p>
                <p className="text-sm text-gray-500">{c.phone && `📞 ${c.phone}`} {c.location && `· 📍 ${c.location}`}</p>
                <p className="text-sm text-gray-500">Delivery: KES {c.delivery_cost_kes}</p>
              </div>
              <button onClick={() => toggleActive(c.id, c.active)}
                className={`text-xs border rounded-lg px-3 py-1 ${c.active ? 'text-gray-400 border-gray-200' : 'text-green-600 border-green-200'}`}>
                {c.active ? 'Deactivate' : 'Reactivate'}
              </button>
            </div>
          </div>
        ))}
        {clients.length === 0 && <p className="text-gray-400 text-center py-8">No clients yet.</p>}
      </div>
    </div>
  )
}
