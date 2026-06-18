'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, differenceInDays } from 'date-fns'

interface Flock {
  id: string; name: string; breed: string; date_received: string
  initial_count: number; current_count: number; active: boolean; notes: string
  age_at_receipt_weeks: number; purchase_cost_kes: number
}
interface Input {
  id: string; name: string; category: string; unit: string
  price_kes: number; last_price_update: string
}

function getCurrentWeeks(flock: Flock) {
  const daysSince = differenceInDays(new Date(), new Date(flock.date_received))
  return (flock.age_at_receipt_weeks || 0) + Math.floor(daysSince / 7)
}

function getPhase(weeksOld: number) {
  if (weeksOld <= 8) return { label: 'Starter', feed: 'Chick Mash', rate: Math.round(10 + (weeksOld - 1) * 4.3), color: 'bg-yellow-100 text-yellow-800' }
  if (weeksOld <= 18) return { label: 'Grower', feed: 'Grower Mash', rate: 80, color: 'bg-blue-100 text-blue-800' }
  return { label: 'Layer', feed: 'Layer Mash', rate: 115, color: 'bg-green-100 text-green-800' }
}

export default function Registry() {
  const [flocks, setFlocks] = useState<Flock[]>([])
  const [inputs, setInputs] = useState<Input[]>([])
  const [tab, setTab] = useState<'flocks' | 'inputs'>('flocks')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const [flockForm, setFlockForm] = useState({
    name: '', breed: 'Kenchic Layer', date_received: format(new Date(), 'yyyy-MM-dd'),
    initial_count: '', notes: '', age_at_receipt_weeks: '0', purchase_cost_kes: '',
  })

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
      name: flockForm.name, breed: flockForm.breed, date_received: flockForm.date_received,
      notes: flockForm.notes, initial_count: count, current_count: count,
      age_at_receipt_weeks: parseInt(flockForm.age_at_receipt_weeks) || 0,
      purchase_cost_kes: parseFloat(flockForm.purchase_cost_kes) || 0,
    })
    setSaving(false)
    if (!error) {
      setMsg('Flock added!')
      setFlockForm({ name: '', breed: 'Kenchic Layer', date_received: format(new Date(), 'yyyy-MM-dd'), initial_count: '', notes: '', age_at_receipt_weeks: '0', purchase_cost_kes: '' })
      loadData()
    }
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

  async function deleteFlock(id: string) {
    if (!confirm('Permanently delete this flock and all its records? This cannot be undone.')) return
    await supabase.from('flocks').delete().eq('id', id)
    loadData()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Registry</h1>

      {msg && <div className="mb-4 bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3">✓ {msg}</div>}

      <div className="flex gap-2 mb-6">
        {(['flocks', 'inputs'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-xl font-medium capitalize ${tab === t ? 'bg-green-700 text-white' : 'bg-white border text-gray-600'}`}>
            {t === 'flocks' ? 'Flocks' : 'Inputs & Prices'}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of birds</label>
                <input type="number" min="1" value={flockForm.initial_count} onChange={e => setFlockForm(p => ({ ...p, initial_count: e.target.value }))} required
                  className="w-full border border-gray-300 rounded-xl px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age when received (weeks)</label>
                <input type="number" min="0" max="100" value={flockForm.age_at_receipt_weeks}
                  onChange={e => setFlockForm(p => ({ ...p, age_at_receipt_weeks: e.target.value }))}
                  placeholder="0 = day-old chicks"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2" />
                {(() => {
                  const w = parseInt(flockForm.age_at_receipt_weeks) || 0
                  const p = getPhase(w)
                  return w > 0 ? (
                    <p className="text-xs mt-1">
                      At receipt: <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${p.color}`}>{p.label} phase</span>
                      <span className="text-gray-400 ml-1">— {p.feed}</span>
                    </p>
                  ) : <p className="text-xs text-gray-400 mt-1">0 = day-old chicks from hatchery</p>
                })()}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
                <input value={flockForm.breed} onChange={e => setFlockForm(p => ({ ...p, breed: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purchase cost (KES)</label>
                <input type="number" min="0" value={flockForm.purchase_cost_kes}
                  onChange={e => setFlockForm(p => ({ ...p, purchase_cost_kes: e.target.value }))}
                  placeholder="e.g. 15000 — total paid for all chicks"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2" />
              </div>
              <div>
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
              const weeks = getCurrentWeeks(f)
              const phase = getPhase(weeks)
              return (
                <div key={f.id} className={`bg-white rounded-2xl p-5 shadow-sm border ${f.active ? 'border-gray-100' : 'border-gray-200 opacity-60'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-gray-900">{f.name}</p>
                        <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${phase.color}`}>
                          {phase.label} · Week {weeks}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{f.breed} · Received {format(new Date(f.date_received), 'd MMM yyyy')}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">{f.current_count}</span> birds
                        {f.current_count !== f.initial_count && <span className="text-gray-400"> (started with {f.initial_count})</span>}
                      </p>
                      <div className="mt-2 bg-gray-50 rounded-xl px-3 py-2 text-xs text-gray-600">
                        <span className="font-medium">Current feed:</span> {phase.feed} &nbsp;·&nbsp;
                        <span className="font-medium">Rate:</span> ~{phase.rate}g/bird/day &nbsp;·&nbsp;
                        <span className="font-medium">Expected daily:</span> {((phase.rate * f.current_count) / 1000).toFixed(1)} kg
                        {f.purchase_cost_kes > 0 && (
                          <span> &nbsp;·&nbsp; <span className="font-medium">Purchase cost:</span> KES {f.purchase_cost_kes.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-3 shrink-0">
                      {f.active && (
                        <button onClick={() => deactivateFlock(f.id)}
                          className="text-xs text-gray-400 border border-gray-200 rounded-lg px-3 py-1">
                          Deactivate
                        </button>
                      )}
                      <button onClick={() => deleteFlock(f.id)}
                        className="text-xs text-red-400 border border-red-200 rounded-lg px-3 py-1">
                        Delete
                      </button>
                    </div>
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
                      <p className="text-sm text-gray-500 capitalize">{i.category} · per {i.unit}</p>
                      {stale && <p className="text-xs text-amber-600 mt-0.5">Price last updated {daysSince} days ago - please review</p>}
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
