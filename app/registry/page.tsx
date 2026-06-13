export const dynamic = 'force-dynamic'
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, differenceInDays } from 'date-fns'

interface Flock {
  id: string; name: string; breed: string; date_received: string
  initial_count: number; current_count: number; active: boolean; notes: string
}
interface Input {
  id: string; name: string; category: string; unit: string
  price_kes: number; last_price_update: string
}

export default function Registry() {
  const [flocks, setFlocks] = useState<Flock[]>([])
  const [inputs, setInputs] = useState<Input[]>([])
  const [tab, setTab] = useState<'flocks' | 'inputs'>('flocks')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  // flock form
  const [flockForm, setFlockForm] = useState({
    name: '', breed: 'Kenchic Layer', date_received: format(new Date(), 'yyyy-MM-dd'),
    initial_count: '', notes: '',
  })

  // input form
  const [inputForm, setInputForm] = useState({
    name: '', category: 'feed', unit: '50kg bag', price_kes: '',
  })

  async function loadData() {
    const [f, i] = await Promise.all([
      supabase.from('flocks').select('*').order('date_received', { ascending: false }),
      supabase.from('inputs').select('*').order('category'),
    ])
    if (f.data) setFlocks(f.data)
    if (i.data) setInputs(i.data)
  }

  useEffect(() => { loadData() }, [])

  async function saveFlock(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const count = parseInt(flockForm.initial_count)
    const { error } = await supabase.from('flocks').insert({
      ...flockForm, initial_count: count, current_count: count,
    })
    setSaving(false)
    if (!error) { setMsg('Flock added!'); setFlockForm({ name: '', breed: 'Kenchic Layer', date_received: format(new Date(), 'yyyy-MM-dd'), initial_count: '', notes: '' }); loadData() }
  }

  async function saveInput(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const { error } = await supabase.from('inputs').insert({
      ...inputForm, price_kes: parseFloat(inputForm.price_kes), last_price_update: format(new Date(), 'yyyy-MM-dd'),
    })
    setSaving(false)
    if (!error) { setMsg('Input added!'); setInputForm({ name: '', category: 'feed', unit: '50kg bag', price_kes: '' }); loadData() }
  }

  async function updatePrice(id: string, oldPrice: number) {
    const raw = prompt(`New price for this input (current: KES ${oldPrice}):`)
    if (!raw) return
    const newPrice = parseFloat(raw)
    if (isNaN(newPrice)) return
    await supabase.from('price_reviews').insert({ input_id: id, old_price: oldPrice, new_price: newPrice })
    await supabase.from('inputs').update({ price_kes: newPrice, last_price_update: format(new Date(), 'yyyy-MM-dd') }).eq('id', id)
    setMsg('Price updated!')
    loadData()
  }

  async function deactivateFlock(id: string) {
    if (!confirm('Mark this flock as inactive?')) return
    await supabase.from('flocks').update({ active: false }).eq('id', id)
    loadData()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Registry</h1>

      {msg && <div className="mb-4 bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3">âœ“ {msg}</div>}

      <div className="flex gap-2 mb-6">
        {(['flocks', 'inputs'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-xl font-medium capitalize ${tab === t ? 'bg-green-700 text-white' : 'bg-white border text-gray-600'}`}>
            {t === 'flocks' ? 'ðŸ” Flocks' : 'ðŸ“¦ Inputs & Prices'}
          </button>
        ))}
      </div>

      {tab === 'flocks' && (
        <div className="space-y-5">
          <form onSubmit={saveFlock} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-800 mb-4">Add New Flock</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Flock name</label>
                <input value={flockForm.name} onChange={e => setFlockForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Batch A 2026" required
                  className="w-full border border-gray-300 rounded-xl px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date received</label>
                <input type="date" value={flockForm.date_received} onChange={e => setFlockForm(p => ({ ...p, date_received: e.target.value }))} required
                  className="w-full border border-gray-300 rounded-xl px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of chicks</label>
                <input type="number" min="1" value={flockForm.initial_count} onChange={e => setFlockForm(p => ({ ...p, initial_count: e.target.value }))} required
                  className="w-full border border-gray-300 rounded-xl px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
                <input value={flockForm.breed} onChange={e => setFlockForm(p => ({ ...p, breed: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input value={flockForm.notes} onChange={e => setFlockForm(p => ({ ...p, notes: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2" />
              </div>
            </div>
            <button disabled={saving} className="mt-4 bg-green-700 text-white rounded-xl px-6 py-3 font-semibold disabled:opacity-40">
              Add Flock
            </button>
          </form>

          <div className="space-y-3">
            {flocks.map(f => {
              const age = differenceInDays(new Date(), new Date(f.date_received))
              const weeks = Math.floor(age / 7)
              return (
                <div key={f.id} className={`bg-white rounded-2xl p-5 shadow-sm border ${f.active ? 'border-gray-100' : 'border-gray-200 opacity-60'}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-gray-900">{f.name}</p>
                      <p className="text-sm text-gray-500">{f.breed} Â· Received {format(new Date(f.date_received), 'd MMM yyyy')} Â· Age: {weeks} weeks</p>
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">{f.current_count}</span> birds
                        {f.current_count !== f.initial_count && <span className="text-gray-400"> (started with {f.initial_count})</span>}
                      </p>
                    </div>
                    {f.active && (
                      <button onClick={() => deactivateFlock(f.id)}
                        className="text-xs text-gray-400 border border-gray-200 rounded-lg px-3 py-1">
                        Deactivate
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'inputs' && (
        <div className="space-y-5">
          <form onSubmit={saveInput} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-800 mb-4">Add Input</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input value={inputForm.name} onChange={e => setInputForm(p => ({ ...p, name: e.target.value }))} required
                  className="w-full border border-gray-300 rounded-xl px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={inputForm.category} onChange={e => setInputForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 bg-white">
                  <option value="feed">Feed</option>
                  <option value="vaccine">Vaccine</option>
                  <option value="medicine">Medicine</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <input value={inputForm.unit} onChange={e => setInputForm(p => ({ ...p, unit: e.target.value }))} required
                  className="w-full border border-gray-300 rounded-xl px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (KES)</label>
                <input type="number" min="0" value={inputForm.price_kes} onChange={e => setInputForm(p => ({ ...p, price_kes: e.target.value }))} required
                  className="w-full border border-gray-300 rounded-xl px-3 py-2" />
              </div>
            </div>
            <button disabled={saving} className="mt-4 bg-green-700 text-white rounded-xl px-6 py-3 font-semibold disabled:opacity-40">
              Add Input
            </button>
          </form>

          <div className="space-y-3">
            {inputs.map(i => {
              const daysSince = differenceInDays(new Date(), new Date(i.last_price_update))
              const stale = daysSince > 30
              return (
                <div key={i.id} className={`bg-white rounded-2xl p-4 shadow-sm border ${stale ? 'border-amber-200' : 'border-gray-100'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{i.name}</p>
                      <p className="text-sm text-gray-500 capitalize">{i.category} Â· per {i.unit}</p>
                      {stale && <p className="text-xs text-amber-600 mt-0.5">âš  Price last updated {daysSince} days ago</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">KES {i.price_kes.toLocaleString()}</p>
                      <button onClick={() => updatePrice(i.id, i.price_kes)}
                        className="text-xs text-green-700 underline mt-1">Update price</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

