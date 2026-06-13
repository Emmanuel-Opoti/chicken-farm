'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

interface Flock { id: string; name: string }
interface Input { id: string; name: string; category: string; unit: string; price_kes: number }
interface EggLog { id: string; total_eggs: number; broken_eggs: number }
interface FeedLog { id: string; input_id: string; quantity_kg: number; cost_kes: number; inputs?: { name: string } }
interface WaterLog { id: string; litres: number }

export default function DailyLog() {
  const [flocks, setFlocks] = useState<Flock[]>([])
  const [inputs, setInputs] = useState<Input[]>([])
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [flockId, setFlockId] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState('')

  const [eggs, setEggs] = useState('')
  const [brokenEggs, setBrokenEggs] = useState('0')
  const [feedInputId, setFeedInputId] = useState('')
  const [feedQty, setFeedQty] = useState('')
  const [water, setWater] = useState('')

  const [eggLogs, setEggLogs] = useState<EggLog[]>([])
  const [feedLogs, setFeedLogs] = useState<FeedLog[]>([])
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([])

  const [editingEgg, setEditingEgg] = useState<EggLog | null>(null)
  const [editingFeed, setEditingFeed] = useState<FeedLog | null>(null)
  const [editingWater, setEditingWater] = useState<WaterLog | null>(null)

  useEffect(() => {
    supabase.from('flocks').select('id, name').eq('active', true).then(({ data }) => {
      if (data) { setFlocks(data); if (data.length === 1) setFlockId(data[0].id) }
    })
    supabase.from('inputs').select('*').then(({ data }) => { if (data) setInputs(data) })
  }, [])

  async function loadLogs() {
    if (!flockId || !date) return
    const [e, f, w] = await Promise.all([
      supabase.from('egg_logs').select('id, total_eggs, broken_eggs').eq('flock_id', flockId).eq('log_date', date),
      supabase.from('feed_logs').select('id, input_id, quantity_kg, cost_kes, inputs(name)').eq('flock_id', flockId).eq('log_date', date),
      supabase.from('water_logs').select('id, litres').eq('flock_id', flockId).eq('log_date', date),
    ])
    if (e.data) setEggLogs(e.data)
    if (f.data) setFeedLogs(f.data as FeedLog[])
    if (w.data) setWaterLogs(w.data)
  }

  useEffect(() => { loadLogs() }, [flockId, date])

  const feedInputs = inputs.filter(i => i.category === 'feed')
  const selectedFeed = inputs.find(i => i.id === feedInputId)
  const feedCost = selectedFeed && feedQty
    ? ((parseFloat(feedQty) / 50) * selectedFeed.price_kes).toFixed(0)
    : null

  async function saveEggs(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const { error } = await supabase.from('egg_logs').insert({
      flock_id: flockId, log_date: date,
      total_eggs: parseInt(eggs), broken_eggs: parseInt(brokenEggs),
    })
    setSaving(false)
    if (!error) { setSaved('Eggs saved!'); setEggs(''); setBrokenEggs('0'); loadLogs() }
  }

  async function saveFeed(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFeed || !feedQty) return
    setSaving(true)
    const cost = (parseFloat(feedQty) / 50) * selectedFeed.price_kes
    const { error } = await supabase.from('feed_logs').insert({
      flock_id: flockId, input_id: feedInputId, log_date: date,
      quantity_kg: parseFloat(feedQty), cost_kes: cost,
    })
    setSaving(false)
    if (!error) { setSaved('Feed saved!'); setFeedQty(''); loadLogs() }
  }

  async function saveWater(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const { error } = await supabase.from('water_logs').insert({
      flock_id: flockId, log_date: date, litres: parseFloat(water),
    })
    setSaving(false)
    if (!error) { setSaved('Water saved!'); setWater(''); loadLogs() }
  }

  async function deleteEgg(id: string) {
    if (!confirm('Delete this egg record?')) return
    await supabase.from('egg_logs').delete().eq('id', id)
    loadLogs()
  }

  async function deleteFeed(id: string) {
    if (!confirm('Delete this feed record?')) return
    await supabase.from('feed_logs').delete().eq('id', id)
    loadLogs()
  }

  async function deleteWater(id: string) {
    if (!confirm('Delete this water record?')) return
    await supabase.from('water_logs').delete().eq('id', id)
    loadLogs()
  }

  async function updateEgg(id: string, total: number, broken: number) {
    await supabase.from('egg_logs').update({ total_eggs: total, broken_eggs: broken }).eq('id', id)
    setEditingEgg(null); loadLogs()
  }

  async function updateFeed(id: string, qty: number) {
    const inp = inputs.find(i => i.id === editingFeed?.input_id)
    const cost = inp ? (qty / 50) * inp.price_kes : 0
    await supabase.from('feed_logs').update({ quantity_kg: qty, cost_kes: cost }).eq('id', id)
    setEditingFeed(null); loadLogs()
  }

  async function updateWater(id: string, litres: number) {
    await supabase.from('water_logs').update({ litres }).eq('id', id)
    setEditingWater(null); loadLogs()
  }

  const hasLogs = eggLogs.length > 0 || feedLogs.length > 0 || waterLogs.length > 0

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Daily Log</h1>

      {saved && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 font-medium">
          ✓ {saved}
        </div>
      )}

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-5 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-base" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Flock</label>
          <select value={flockId} onChange={e => setFlockId(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-base bg-white">
            <option value="">Select flock</option>
            {flocks.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-5 mb-8">
        <form onSubmit={saveEggs} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-4 text-lg">Eggs Collected</h2>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Total eggs</label>
            <input type="number" min="0" value={eggs} onChange={e => setEggs(e.target.value)}
              placeholder="e.g. 144"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-base" required />
            {eggs && (
              <p className="text-xs text-gray-500 mt-1">
                = {Math.floor(parseInt(eggs) / 12)} trays + {parseInt(eggs) % 12} loose
              </p>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Broken eggs</label>
            <input type="number" min="0" value={brokenEggs} onChange={e => setBrokenEggs(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-base" />
          </div>
          <button disabled={!flockId || saving}
            className="w-full bg-yellow-500 text-white rounded-xl py-3 font-semibold disabled:opacity-40">
            Save Eggs
          </button>
        </form>

        <form onSubmit={saveFeed} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-4 text-lg">Feed Used</h2>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Feed type</label>
            <select value={feedInputId} onChange={e => setFeedInputId(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-base bg-white" required>
              <option value="">Select feed</option>
              {feedInputs.map(f => (
                <option key={f.id} value={f.id}>{f.name} - KES {f.price_kes}/{f.unit}</option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (kg)</label>
            <input type="number" min="0" step="0.1" value={feedQty} onChange={e => setFeedQty(e.target.value)}
              placeholder="e.g. 5"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-base" required />
            {feedCost && <p className="text-xs text-gray-500 mt-1">Estimated cost: KES {feedCost}</p>}
          </div>
          <button disabled={!flockId || saving}
            className="w-full bg-green-600 text-white rounded-xl py-3 font-semibold disabled:opacity-40">
            Save Feed
          </button>
        </form>

        <form onSubmit={saveWater} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-4 text-lg">Water</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Litres given</label>
            <input type="number" min="0" step="0.5" value={water} onChange={e => setWater(e.target.value)}
              placeholder="e.g. 20"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-base" required />
          </div>
          <button disabled={!flockId || saving}
            className="w-full bg-blue-500 text-white rounded-xl py-3 font-semibold disabled:opacity-40 mt-8">
            Save Water
          </button>
        </form>
      </div>

      {flockId && hasLogs && (
        <div>
          <h2 className="font-bold text-gray-800 mb-3">Records for {format(new Date(date), 'd MMM yyyy')}</h2>
          <div className="space-y-3">

            {eggLogs.map(r => (
              <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm border border-yellow-100">
                {editingEgg?.id === r.id ? (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Edit egg record</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500">Total eggs</label>
                        <input type="number" min="0" defaultValue={r.total_eggs}
                          id={`egg-total-${r.id}`}
                          className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm mt-0.5" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Broken eggs</label>
                        <input type="number" min="0" defaultValue={r.broken_eggs}
                          id={`egg-broken-${r.id}`}
                          className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm mt-0.5" />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => {
                        const t = parseInt((document.getElementById(`egg-total-${r.id}`) as HTMLInputElement).value)
                        const b = parseInt((document.getElementById(`egg-broken-${r.id}`) as HTMLInputElement).value)
                        updateEgg(r.id, t, b)
                      }} className="bg-green-600 text-white rounded-lg px-4 py-1.5 text-sm font-medium">Save</button>
                      <button onClick={() => setEditingEgg(null)} className="border border-gray-300 rounded-lg px-4 py-1.5 text-sm text-gray-600">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">🥚 {r.total_eggs} eggs</p>
                      <p className="text-xs text-gray-400">{Math.floor(r.total_eggs / 12)} trays + {r.total_eggs % 12} loose · {r.broken_eggs} broken</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingEgg(r)} className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600">Edit</button>
                      <button onClick={() => deleteEgg(r.id)} className="text-xs border border-red-200 rounded-lg px-3 py-1.5 text-red-500">Delete</button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {feedLogs.map(r => (
              <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm border border-green-100">
                {editingFeed?.id === r.id ? (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Edit feed record</p>
                    <div>
                      <label className="text-xs text-gray-500">Quantity (kg)</label>
                      <input type="number" min="0" step="0.1" defaultValue={r.quantity_kg}
                        id={`feed-qty-${r.id}`}
                        className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm mt-0.5" />
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => {
                        const q = parseFloat((document.getElementById(`feed-qty-${r.id}`) as HTMLInputElement).value)
                        updateFeed(r.id, q)
                      }} className="bg-green-600 text-white rounded-lg px-4 py-1.5 text-sm font-medium">Save</button>
                      <button onClick={() => setEditingFeed(null)} className="border border-gray-300 rounded-lg px-4 py-1.5 text-sm text-gray-600">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">🌾 {r.inputs?.name || 'Feed'}</p>
                      <p className="text-xs text-gray-400">{r.quantity_kg} kg · KES {r.cost_kes.toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingFeed(r)} className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600">Edit</button>
                      <button onClick={() => deleteFeed(r.id)} className="text-xs border border-red-200 rounded-lg px-3 py-1.5 text-red-500">Delete</button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {waterLogs.map(r => (
              <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm border border-blue-100">
                {editingWater?.id === r.id ? (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Edit water record</p>
                    <div>
                      <label className="text-xs text-gray-500">Litres</label>
                      <input type="number" min="0" step="0.5" defaultValue={r.litres}
                        id={`water-litres-${r.id}`}
                        className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm mt-0.5" />
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => {
                        const l = parseFloat((document.getElementById(`water-litres-${r.id}`) as HTMLInputElement).value)
                        updateWater(r.id, l)
                      }} className="bg-blue-500 text-white rounded-lg px-4 py-1.5 text-sm font-medium">Save</button>
                      <button onClick={() => setEditingWater(null)} className="border border-gray-300 rounded-lg px-4 py-1.5 text-sm text-gray-600">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">💧 {r.litres} litres</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingWater(r)} className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600">Edit</button>
                      <button onClick={() => deleteWater(r.id)} className="text-xs border border-red-200 rounded-lg px-3 py-1.5 text-red-500">Delete</button>
                    </div>
                  </div>
                )}
              </div>
            ))}

          </div>
        </div>
      )}
    </div>
  )
}
