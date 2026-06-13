export const dynamic = 'force-dynamic'
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { format, addDays } from 'date-fns'

const VACCINATION_SCHEDULE = [
  { day: 1,   name: "Marek's Disease",        method: "Injection (done at hatchery)", note: "Given before chicks leave hatchery" },
  { day: 7,   name: "Newcastle + IB (ND+IB)", method: "Eye drop",                     note: "Hold chick, one drop per eye" },
  { day: 14,  name: "Gumboro (IBD)",           method: "Drinking water",               note: "Withhold water 2hrs before, vaccinate in morning" },
  { day: 21,  name: "Newcastle (ND)",          method: "Drinking water",               note: "Clean drinkers thoroughly first" },
  { day: 28,  name: "Gumboro booster (IBD)",   method: "Drinking water",               note: "Withhold water 2hrs before" },
  { day: 42,  name: "Fowl Typhoid",            method: "Injection (wing web)",         note: "Use sterile needle per bird" },
  { day: 56,  name: "Newcastle booster",       method: "Drinking water",               note: "" },
  { day: 84,  name: "Fowl Typhoid booster",    method: "Injection (wing web)",         note: "" },
  { day: 112, name: "Newcastle (pre-lay)",     method: "Drinking water",               note: "Must be done before point of lay" },
]

const FEEDING_SCHEDULE = [
  { phase: "Starter", weeks: "1-8",  feed: "Chick Mash",  rate: "~8-10g/bird/day up to 40g/bird/day by end",   tips: "Keep feeders and drinkers close to heat source. Ad-lib feeding. Check for pasty butt daily." },
  { phase: "Grower",  weeks: "9-18", feed: "Grower Mash", rate: "~70-90g/bird/day",                             tips: "Reduce heat gradually. Ensure adequate space. Deworm at week 10 and 16." },
  { phase: "Layer",   weeks: "19+",  feed: "Layer Mash",  rate: "~110-120g/bird/day",                           tips: "Switch to layer mash at first signs of lay (red comb, squatting). Provide oyster shell supplement for strong shells." },
]

interface Flock { id: string; name: string; date_received: string }

export default function SOP() {
  const [tab, setTab] = useState<'vaccination' | 'feeding'>('vaccination')
  const [flocks, setFlocks] = useState<Flock[]>([])
  const [selectedFlock, setSelectedFlock] = useState<Flock | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase.from('flocks').select('id, name, date_received').eq('active', true).then(({ data }) => {
      if (data) setFlocks(data)
    })
  }, [])

  async function generateVaccinationSchedule() {
    if (!selectedFlock) return
    setSaving(true)
    const received = new Date(selectedFlock.date_received)
    const rows = VACCINATION_SCHEDULE.map(v => ({
      flock_id: selectedFlock.id,
      vaccine_name: v.name,
      method: v.method,
      scheduled_date: format(addDays(received, v.day - 1), 'yyyy-MM-dd'),
    }))
    const { error } = await supabase.from('vaccination_logs').insert(rows)
    setSaving(false)
    if (!error) setMsg(`Vaccination schedule generated for ${selectedFlock.name}!`)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Standard Operating Procedures</h1>
      <p className="text-gray-500 text-sm mb-6">Kenchic Layer Program</p>

      <div className="flex gap-2 mb-6">
        {([['vaccination', 'Vaccination'], ['feeding', 'Feeding']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl font-medium ${tab === t ? 'bg-green-700 text-white' : 'bg-white border text-gray-600'}`}>
            {t === 'vaccination' ? '💉 ' : '🌾 '}{label}
          </button>
        ))}
      </div>

      {tab === 'vaccination' && (
        <div className="space-y-5">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
            {msg && <p className="text-green-800 font-semibold mb-3">✓ {msg}</p>}
            <p className="text-sm font-medium text-green-900 mb-2">Generate vaccination schedule for a flock</p>
            <div className="flex gap-3 flex-wrap">
              <select onChange={e => setSelectedFlock(flocks.find(f => f.id === e.target.value) || null)}
                className="border border-green-300 rounded-xl px-3 py-2 bg-white text-sm">
                <option value="">Select flock</option>
                {flocks.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              <button onClick={generateVaccinationSchedule} disabled={!selectedFlock || saving}
                className="bg-green-700 text-white rounded-xl px-5 py-2 text-sm font-semibold disabled:opacity-40">
                Generate Schedule
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {VACCINATION_SCHEDULE.map((v, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-gray-900">{v.name}</p>
                    <p className="text-sm text-gray-500">Day {v.day} · {v.method}</p>
                    {v.note && <p className="text-xs text-gray-400 mt-1 italic">{v.note}</p>}
                  </div>
                  <span className="text-xs bg-green-100 text-green-800 rounded-full px-3 py-1 font-medium">
                    Day {v.day}
                  </span>
                </div>
              </div>
            ))}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="font-bold text-gray-900">Newcastle Disease (ongoing)</p>
              <p className="text-sm text-gray-500">Every 3 months from week 19 · Drinking water</p>
              <p className="text-xs text-gray-400 mt-1 italic">Continue throughout laying life</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'feeding' && (
        <div className="space-y-4">
          {FEEDING_SCHEDULE.map((f, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-green-100 text-green-800 font-bold text-sm rounded-full px-3 py-1">
                  Week {f.weeks}
                </span>
                <span className="font-bold text-gray-900">{f.phase} Phase</span>
              </div>
              <div className="grid grid-cols-2 gap-y-2 text-sm mb-3">
                <span className="text-gray-500">Feed</span>
                <span className="font-semibold">{f.feed}</span>
                <span className="text-gray-500">Rate</span>
                <span className="font-semibold">{f.rate}</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-600">{f.tips}</p>
              </div>
            </div>
          ))}

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="font-semibold text-amber-900 mb-2">💧 Water Schedule</p>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• Provide clean, fresh water at all times (ad-lib)</li>
              <li>• Chicks: 1 litre per 10 birds per day (week 1-2)</li>
              <li>• Growers/Layers: 2-3 litres per 10 birds per day</li>
              <li>• Add electrolytes during stress or after vaccination</li>
              <li>• Clean and disinfect drinkers daily</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
