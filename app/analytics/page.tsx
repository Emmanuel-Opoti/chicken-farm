'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, subDays, eachDayOfInterval } from 'date-fns'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, ScatterChart, Scatter, ResponsiveContainer
} from 'recharts'

interface Flock { id: string; name: string; current_count: number }

interface DailyPoint {
  date: string; eggs: number; feedCost: number; revenue: number
}

export default function Analytics() {
  const [flocks, setFlocks]               = useState<Flock[]>([])
  const [selectedFlock, setSelectedFlock] = useState<string | null>(null)
  const [data, setData]                   = useState<DailyPoint[]>([])
  const [days, setDays]                   = useState(30)

  // Load active flocks once
  useEffect(() => {
    supabase.from('flocks').select('id, name, current_count').eq('active', true).order('name')
      .then(({ data }) => setFlocks(data || []))
  }, [])

  // Reload chart data when flock or days changes
  useEffect(() => {
    async function load() {
      const start = format(subDays(new Date(), days), 'yyyy-MM-dd')
      const end   = format(new Date(), 'yyyy-MM-dd')

      const flockFilter = (q: any) => selectedFlock ? q.eq('flock_id', selectedFlock) : q

      const [eggs, feed, sales, adhoc] = await Promise.all([
        flockFilter(supabase.from('egg_logs').select('log_date, total_eggs')).gte('log_date', start).lte('log_date', end),
        flockFilter(supabase.from('feed_logs').select('log_date, cost_kes')).gte('log_date', start).lte('log_date', end),
        supabase.from('sales').select('sale_date, amount_kes').gte('sale_date', start).lte('sale_date', end),
        supabase.from('adhoc_sales').select('sale_date, amount_kes').gte('sale_date', start).lte('sale_date', end),
      ])

      const range = eachDayOfInterval({ start: new Date(start), end: new Date(end) })
      const points: DailyPoint[] = range.map(d => {
        const dateStr = format(d, 'yyyy-MM-dd')
        const dayEggs = (eggs.data || []).filter((r: any) => r.log_date === dateStr).reduce((s: number, r: any) => s + r.total_eggs, 0)
        const dayFeed = (feed.data || []).filter((r: any) => r.log_date === dateStr).reduce((s: number, r: any) => s + r.cost_kes, 0)
        const dayRev =
          (sales.data || []).filter((r: any) => r.sale_date === dateStr).reduce((s: number, r: any) => s + r.amount_kes, 0) +
          (adhoc.data || []).filter((r: any) => r.sale_date === dateStr).reduce((s: number, r: any) => s + r.amount_kes, 0)
        return { date: format(d, 'd MMM'), eggs: dayEggs, feedCost: dayFeed, revenue: dayRev }
      })
      setData(points)
    }
    load()
  }, [days, selectedFlock])

  const scatterData = data.filter(d => d.feedCost > 0 && d.eggs > 0).map(d => ({
    feedCost: d.feedCost, eggs: d.eggs,
  }))

  const flockName = selectedFlock
    ? (flocks.find(f => f.id === selectedFlock)?.name ?? 'Flock')
    : 'All Flocks'

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics</h1>

      {/* Flock selector */}
      <div className="mb-4">
        <p className="text-xs font-medium text-gray-500 mb-2">Viewing data for</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedFlock(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedFlock === null
                ? 'bg-green-700 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-green-400'
            }`}>
            All Flocks
          </button>
          {flocks.map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedFlock(f.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedFlock === f.id
                  ? 'bg-green-700 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-green-400'
              }`}>
              {f.name}
              <span className={`ml-1.5 text-xs ${selectedFlock === f.id ? 'text-green-200' : 'text-gray-400'}`}>
                ({f.current_count} birds)
              </span>
            </button>
          ))}
        </div>
        {selectedFlock !== null && (
          <p className="mt-2 text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2 border border-amber-100">
            Revenue bars show farm-wide sales — sales are not linked to individual flocks.
          </p>
        )}
      </div>

      {/* Time period */}
      <div className="flex gap-2 mb-6">
        {[7, 30, 90].map(d => (
          <button key={d} onClick={() => setDays(d)}
            className={`px-4 py-2 rounded-xl font-medium text-sm ${days === d ? 'bg-green-700 text-white' : 'bg-white border text-gray-600'}`}>
            {d}d
          </button>
        ))}
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800">Eggs Collected (daily)</h2>
            {selectedFlock !== null && (
              <span className="text-xs bg-green-100 text-green-800 rounded-full px-2 py-0.5 font-medium">{flockName}</span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={Math.floor(data.length / 6)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="eggs" stroke="#eab308" strokeWidth={2} dot={false} name="Eggs" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-gray-800">Revenue vs Feed Cost (KES)</h2>
              {selectedFlock !== null && (
                <p className="text-xs text-gray-400 mt-0.5">Feed cost: {flockName} only. Revenue: all flocks.</p>
              )}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={Math.floor(data.length / 6)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#16a34a" name="Revenue (KES)" radius={[3,3,0,0]} />
              <Bar dataKey="feedCost" fill="#ef4444" name="Feed Cost (KES)" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-gray-800">Feed Cost vs Egg Output (correlation)</h2>
            {selectedFlock !== null && (
              <span className="text-xs bg-green-100 text-green-800 rounded-full px-2 py-0.5 font-medium">{flockName}</span>
            )}
          </div>
          <p className="text-xs text-gray-400 mb-4">Each dot = one day. Look for a consistent upward trend.</p>
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="feedCost" name="Feed Cost (KES)" tick={{ fontSize: 11 }} label={{ value: 'Feed Cost (KES)', position: 'insideBottom', offset: -5, fontSize: 11 }} />
              <YAxis dataKey="eggs" name="Eggs" tick={{ fontSize: 11 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={scatterData} fill="#2563eb" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
