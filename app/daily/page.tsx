'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, differenceInDays } from 'date-fns'

interface Flock { id: string; name: string; current_count: number; date_received: string; age_at_receipt_weeks: number }
interface Input { id: string; name: string; category: string; unit: string; price_kes: number }
interface EggLog { id: string; total_eggs: number; broken_eggs: number }
interface FeedLog { id: string; input_id: string; quantity_kg: number; cost_kes: number; inputs?: { name: string } | { name: string }[] }
interface WaterLog { id: string; litres: number }
interface MortalityLog { id: string; count: number; cause: string }

function getPhaseInfo(flock: Flock) {
  const daysSince = differenceInDays(new Date(), new Date(flock.date_received))
  const weeks = (flock.age_at_receipt_weeks || 0) + Math.floor(daysSince / 7)
  if (weeks <= 8) return { phase: 'Starter', feed: 'Chick Mash', rate: Math.round(10 + (weeks - 1) * 4.3), weeks, color: 'bg-yellow-100 text-yellow-800', border: 'border-yellow-200' }
  if (weeks <= 18) return { phase: 'Grower', feed: 'Grower Mash', rate: 80, weeks, color: 'bg-blue-100 text-blue-800', border: 'border-blue-200' }
  return { phase: 'Layer', feed: 'Layer Mash', rate: 115, weeks, color: 'bg-green-100 text-green-800', border: 'border-green-200' }
}

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
  const [mortalityCount, setMortalityCount] = useState('')
  const [mortalityCause, setMortalityCause] = useState('')

  const [eggLogs, setEggLogs] = useState<EggLog[]>([])
  const [feedLogs, setFeedLogs] = useState<FeedLog[]>([])
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([])
  const [mortalityLogs, setMortalityLogs] = useState<MortalityLog[]>([])

  const [editingEgg, setEditingEgg] = useState<EggLog | null>(null)
  const [editingFeed, setEditingFeed] = useState<FeedLog | null>(null)
  const [editingWater, setEditingWater] = useState<WaterLog | null>(null)

  useEffect(() => {
    supabase.from('flocks').select('id, name, current_count, date_received, age_at_receipt_weeks').eq('active', true).then(({ data }) => {
      if (data) { setFlocks(data); if (data.length === 1) setFlockId(data[0].id) }
    })
    supabase.from('inputs').select('*').then(({ data }) => { if (data) setInputs(data) })
  }, [])

  const selectedFlock = flocks.find(f => f.id === flockId) || null
  const phaseInfo = selectedFlock ? getPhaseInfo(selectedFlock) : null

  useEffect(() => {
    if (!phaseInfo) return
    const match = inputs.find(i => i.category === 'feed' && i.name.toLowerCase().includes(phaseInfo.feed.toLowerCase().split(' ')[0]))
    if (match) setFeedInputId(match.id)
  }, [flockId, inputs])

  useEffect(() => {
    if (!phaseInfo || !selectedFlock) return
    setFeedQty(((phaseInfo.rate * selectedFlock.current_count) / 1000).toFixed(1))
  }, [flockId])

  async function loadLogs() {
    if (!flockId || !date) return
    const [e, f, w, m] = await Promise.all([
      supabase.from('egg_logs').select('id, total_eggs, broken_eggs').eq('flock_id', flockId).eq('log_date', date),
      supabase.from('feed_logs').select('id, input_id, quantity_kg, cost_kes, inputs(name)').eq('flock_id', flockId).eq('log_date', date),
      supabase.from('water_logs').select('id, litres').eq('flock_id', flockId).eq('log_date', date),
      supabase.from('mortality_logs').select('id, count, cause').eq('flock_id', flockId).eq('log_date', date),
    ])
    if (e.data) setEggLogs(e.data)
    if (f.data) setFeedLogs(f.data as FeedLog[])
    if (w.data) setWaterLogs(w.data)
    if (m.data) setMortalityLogs(m.data)
  }

  useEffect(() => { loadLogs() }, [flockId, date])

  const feedInputs = inputs.filter(i => i.category === 'feed')
  const selectedFeed = inputs.find(i => i.id === feedInputId)
  const feedCost = selectedFeed && feedQty ? ((parseFloat(feedQty) / 50) * selectedFeed.price_kes).toFixed(0) : null

  async function saveEggs(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const { error } = await supabase.from('egg_logs').insert({ flock_id: flockId, log_date: date, total_eggs: parseInt(eggs), broken_eggs: parseInt(brokenEggs) })
    setSaving(false)
    if (!error) { setSaved('Eggs saved!'); setEggs(''); setBrokenEggs('0'); loadLogs() }
  }

  async function saveFeed(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFeed || !feedQty) return
    setSaving(true)
    const cost = (parseFloat(feedQty) / 50) * selectedFeed.price_kes
    const { error } = await supabase.from('feed_logs').insert({ flock_id: flockId, input_id: feedInputId, log_date: date, quantity_kg: parseFloat(feedQty), cost_kes: cost })
    setSaving(false)
    if (!error) { setSaved('Feed saved!'); loadLogs() }
  }

  async function saveWater(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const { error } = await supabase.from('water_logs').insert({ flock_id: flockId, log_date: date, litres: parseFloat(water) })
    setSaving(false)
    if (!error) { setSaved('Water saved!'); setWater(''); loadLogs() }
  }

  async function saveMortality(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const count = parseInt(mortalityCount)
    const { error } = await supabase.from('mortality_logs').insert({ flock_id: flockId, log_date: date, count, cause: mortalityCause })
    if (!error) {
      // Update current_count on the flock
      if (selectedFlock) {
        await supabase.from('flocks').update({ current_count: Math.max(0, selectedFlock.current_count - count) }).eq('id', flockId)
      }
    }
    setSaving(false)
    if (!error) { setSaved('Mortality logged!'); setMortalityCount(''); setMortalityCause(''); loadLogs() }
  }

  async function deleteEgg(id: string) { if (!confirm('Delete this egg record?')) return; await supabase.from('egg_logs').delete().eq('id', id); loadLogs() }
  async function deleteFeed(id: string) { if (!confirm('Delete this feed record?')) return; await supabase.from('feed_logs').delete().eq('id', id); loadLogs() }
  async function deleteWater(id: string) { if (!confirm('Delete this water record?')) return; await supabase.from('water_logs').delete().eq('id', id); loadLogs() }
  async function deleteMortality(id: string, count: number) {
    if (!confirm('Delete this mortality record?')) return
    await supabase.from('mortality_logs').delete().eq('id', id)
    if (selectedFlock) await supabase.from('flocks').update({ current_count: selectedFlock.current_count + count }).eq('id', flockId)
    loadLogs()
  }

  async function updateEgg(id: string, total: number, broken: number) {
    await supabase.from('egg_logs').update({ total_eggs: total, broken_eggs: broken }).eq('id', id)
    setEditingEgg(null); loadLogs()
  }
  async function updateFeed(id: string, qty: number) {
    const inp = inputs.find(i => i.id === editingFeed?.input_id)
    await supabase.from('feed_logs').update({ quantity_kg: qty, cost_kes: inp ? (qty / 50) * inp.price_kes : 0 }).eq('id', id)
    setEditingFeed(null); loadLogs()
  }
  async function updateWater(id: string, litres: number) {
    await supabase.from('water_logs').update({ litres }).eq('id', id)
    setEditingWater(null); loadLogs()
  }

  const hasLogs = eggLogs.length > 0 || feedLogs.length > 0 || waterLogs.length > 0 || mortalityLogs.length > 0

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Daily Log</h1>

      {saved && <div className="mb-4 bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 font-medium">✓ {saved}</div>}

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-5 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-base" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Flock</label>
          <select value={flockId} onChange={e => setFlockId(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-base bg-white">
            <option value="">Select flock</option>
            {flocks.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
      </div>

      {phaseInfo && selectedFlock && (
        <div className={`mb-5 rounded-2xl border p-4 ${phaseInfo.border} bg-gray-50`}>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-sm font-bold ${phaseInfo.color}`}>{phaseInfo.phase} Phase — Week {phaseInfo.weeks}</span>
            <span className="text-sm text-gray-700"><span className="font-medium">Feed:</span> {phaseInfo.feed}</span>
            <span className="text-sm text-gray-700"><span className="font-medium">Rate:</span> ~{phaseInfo.rate}g/bird/day</span>
            <span className="text-sm text-gray-700"><span className="font-medium">Expected:</span> {((phaseInfo.rate * selectedFlock.current_count) / 1000).toFixed(1)} kg · {selectedFlock.current_count} birds</span>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Eggs */}
        <form onSubmit={saveEggs} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-4 text-lg">🥚 Eggs</h2>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Total eggs</label>
            <input type="number" min="0" value={eggs} onChange={e => setEggs(e.target.value)} placeholder="e.g. 144"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-base" required />
            {eggs && <p className="text-xs text-gray-500 mt-1">= {Math.floor(parseInt(eggs) / 12)} trays + {parseInt(eggs) % 12} loose</p>}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Broken eggs</label>
            <input type="number" min="0" value={brokenEggs} onChange={e => setBrokenEggs(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-base" />
          </div>
          <button disabled={!flockId || saving} className="w-full bg-yellow-500 text-white rounded-xl py-3 font-semibold disabled:opacity-40">Save Eggs</button>
        </form>

        {/* Feed */}
        <form onSubmit={saveFeed} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-4 text-lg">🌾 Feed</h2>
          {phaseInfo && <p className="text-xs text-gray-500 mb-3 bg-gray-50 rounded-lg px-2 py-1.5">Phase: <span className="font-medium">{phaseInfo.feed}</span></p>}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Feed type</label>
            <select value={feedInputId} onChange={e => setFeedInputId(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-base bg-white" required>
              <option value="">Select feed</option>
              {feedInputs.map(f => <option key={f.id} value={f.id}>{f.name} — KES {f.price_kes}/{f.unit}</option>)}
            </select>
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (kg)</label>
            <input type="number" min="0" step="0.1" value={feedQty} onChange={e => setFeedQty(e.target.value)} placeholder="e.g. 5"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-base" required />
            {feedCost && <p className="text-xs text-gray-500 mt-1">Cost: KES {parseInt(feedCost).toLocaleString()}</p>}
          </div>
          <button disabled={!flockId || saving} className="w-full bg-green-600 text-white rounded-xl py-3 font-semibold disabled:opacity-40">Save Feed</button>
        </form>

        {/* Water */}
        <form onSubmit={saveWater} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-4 text-lg">💧 Water</h2>
          {phaseInfo && selectedFlock && (
            <p className="text-xs text-gray-500 mb-3 bg-gray-50 rounded-lg px-2 py-1.5">
              Recommended: <span className="font-medium">{phaseInfo.weeks <= 2 ? `~${(selectedFlock.current_count / 10).toFixed(0)} L` : `~${((selectedFlock.current_count / 10) * 2.5).toFixed(0)}–${((selectedFlock.current_count / 10) * 3).toFixed(0)} L`}</span>
            </p>
          )}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Litres given</label>
            <input type="number" min="0" step="0.5" value={water} onChange={e => setWater(e.target.value)} placeholder="e.g. 20"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-base" required />
          </div>
          <button disabled={!flockId || saving} className="w-full bg-blue-500 text-white rounded-xl py-3 font-semibold disabled:opacity-40 mt-8">Save Water</button>
        </form>

        {/* Mortality */}
        <form onSubmit={saveMortality} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-4 text-lg">💀 Mortality</h2>
          {selectedFlock && <p className="text-xs text-gray-500 mb-3 bg-gray-50 rounded-lg px-2 py-1.5">Current count: <span className="font-medium">{selectedFlock.current_count} birds</span></p>}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Birds lost</label>
            <input type="number" min="1" value={mortalityCount} onChange={e => setMortalityCount(e.target.value)} placeholder="e.g. 2"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-base" required />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Cause (optional)</label>
            <input value={mortalityCause} onChange={e => setMortalityCause(e.target.value)} placeholder="e.g. disease, injury"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-base" />
          </div>
          <button disabled={!flockId || saving} className="w-full bg-red-500 text-white rounded-xl py-3 font-semibold disabled:opacity-40">Log Mortality</button>
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
                      <div><label className="text-xs text-gray-500">Total eggs</label><input type="number" min="0" defaultValue={r.total_eggs} id={`egg-total-${r.id}`} className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm mt-0.5" /></div>
                      <div><label className="text-xs text-gray-500">Broken eggs</label><input type="number" min="0" defaultValue={r.broken_eggs} id={`egg-broken-${r.id}`} className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm mt-0.5" /></div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => updateEgg(r.id, parseInt((document.getElementById(`egg-total-${r.id}`) as HTMLInputElement).value), parseInt((document.getElementById(`egg-broken-${r.id}`) as HTMLInputElement).value))} className="bg-green-600 text-white rounded-lg px-4 py-1.5 text-sm font-medium">Save</button>
                      <button onClick={() => setEditingEgg(null)} className="border border-gray-300 rounded-lg px-4 py-1.5 text-sm text-gray-600">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div><p className="font-semibold text-gray-900">🥚 {r.total_eggs} eggs</p><p className="text-xs text-gray-400">{Math.floor(r.total_eggs / 12)} trays + {r.total_eggs % 12} loose · {r.broken_eggs} broken</p></div>
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
                    <div><label className="text-xs text-gray-500">Quantity (kg)</label><input type="number" min="0" step="0.1" defaultValue={r.quantity_kg} id={`feed-qty-${r.id}`} className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm mt-0.5" /></div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => updateFeed(r.id, parseFloat((document.getElementById(`feed-qty-${r.id}`) as HTMLInputElement).value))} className="bg-green-600 text-white rounded-lg px-4 py-1.5 text-sm font-medium">Save</button>
                      <button onClick={() => setEditingFeed(null)} className="border border-gray-300 rounded-lg px-4 py-1.5 text-sm text-gray-600">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div><p className="font-semibold text-gray-900">🌾 {(Array.isArray(r.inputs) ? r.inputs[0]?.name : r.inputs?.name) || 'Feed'}</p><p className="text-xs text-gray-400">{r.quantity_kg} kg · KES {r.cost_kes.toLocaleString()}</p></div>
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
                    <div><label className="text-xs text-gray-500">Litres</label><input type="number" min="0" step="0.5" defaultValue={r.litres} id={`water-litres-${r.id}`} className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm mt-0.5" /></div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => updateWater(r.id, parseFloat((document.getElementById(`water-litres-${r.id}`) as HTMLInputElement).value))} className="bg-blue-500 text-white rounded-lg px-4 py-1.5 text-sm font-medium">Save</button>
                      <button onClick={() => setEditingWater(null)} className="border border-gray-300 rounded-lg px-4 py-1.5 text-sm text-gray-600">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div><p className="font-semibold text-gray-900">💧 {r.litres} litres</p></div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingWater(r)} className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600">Edit</button>
                      <button onClick={() => deleteWater(r.id)} className="text-xs border border-red-200 rounded-lg px-3 py-1.5 text-red-500">Delete</button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {mortalityLogs.map(r => (
              <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm border border-red-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">💀 {r.count} bird{r.count !== 1 ? 's' : ''} lost</p>
                    {r.cause && <p className="text-xs text-gray-400">Cause: {r.cause}</p>}
                  </div>
                  <button onClick={() => deleteMortality(r.id, r.count)} className="text-xs border border-red-200 rounded-lg px-3 py-1.5 text-red-500">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
