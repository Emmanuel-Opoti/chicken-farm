'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

interface Flock { id: string; name: string }
interface Input { id: string; name: string; category: string; unit: string; price_kes: number }

export default function DailyLog() {
  const [flocks, setFlocks] = useState<Flock[]>([])
  const [inputs, setInputs] = useState<Input[]>([])
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [flockId, setFlockId] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState('')

  // egg form
  const [eggs, setEggs] = useState('')
  const [brokenEggs, setBrokenEggs] = useState('0')

  // feed form
  const [feedInputId, setFeedInputId] = useState('')
  const [feedQty, setFeedQty] = useState('')

  // water form
  const [water, setWater] = useState('')

  useEffect(() => {
    supabase.from('flocks').select('id, name').eq('active', true).then(({ data }) => {
      if (data) { setFlocks(data); if (data.length === 1) setFlockId(data[0].id) }
    })
    supabase.from('inputs').select('*').then(({ data }) => { if (data) setInputs(data) })
  }, [])

  const feedInputs = inputs.filter(i => i.category === 'feed')
  const selectedFeed = inputs.find(i => i.id === feedInputId)
  const feedCost = selectedFeed && feedQty
    ? ((parseFloat(feedQty) / 50) * selectedFeed.price_kes).toFixed(0)
    : null

  async function saveEggs(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('egg_logs').insert({
      flock_id: flockId, log_date: date,
      total_eggs: parseInt(eggs), broken_eggs: parseInt(brokenEggs),
    })
    setSaving(false)
    if (!error) { setSaved('Eggs saved!'); setEggs(''); setBrokenEggs('0') }
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
    if (!error) { setSaved('Feed saved!'); setFeedQty('') }
  }

  async function saveWater(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('water_logs').insert({
      flock_id: flockId, log_date: date, litres: parseFloat(water),
    })
    setSaving(false)
    if (!error) { setSaved('Water saved!'); setWater('') }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Daily Log</h1>

      {saved && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 font-medium">
          ✓ {saved}
        </div>
      )}

      {/* Date + flock selectors */}
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

      <div className="grid md:grid-cols-3 gap-5">
        {/* Eggs */}
        <form onSubmit={saveEggs} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-4 text-lg">🥚 Eggs Collected</h2>
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

        {/* Feed */}
        <form onSubmit={saveFeed} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-4 text-lg">🌾 Feed Used</h2>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Feed type</label>
            <select value={feedInputId} onChange={e => setFeedInputId(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-base bg-white" required>
              <option value="">Select feed</option>
              {feedInputs.map(f => (
                <option key={f.id} value={f.id}>{f.name} — KES {f.price_kes}/{f.unit}</option>
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

        {/* Water */}
        <form onSubmit={saveWater} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-4 text-lg">💧 Water</h2>
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
    </div>
  )
}
