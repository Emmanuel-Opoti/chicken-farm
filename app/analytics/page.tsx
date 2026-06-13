'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, subDays, eachDayOfInterval } from 'date-fns'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, ScatterChart, Scatter, ResponsiveContainer
} from 'recharts'

interface DailyPoint {
  date: string; eggs: number; feedCost: number; revenue: number
}

export default function Analytics() {
  const [data, setData] = useState<DailyPoint[]>([])
  const [days, setDays] = useState(30)

  useEffect(() => {
    async function load() {
      const start = format(subDays(new Date(), days), 'yyyy-MM-dd')
      const end = format(new Date(), 'yyyy-MM-dd')

      const [eggs, feed, sales, adhoc] = await Promise.all([
        supabase.from('egg_logs').select('log_date, total_eggs').gte('log_date', start).lte('log_date', end),
        supabase.from('feed_logs').select('log_date, cost_kes').gte('log_date', start).lte('log_date', end),
        supabase.from('sales').select('sale_date, amount_kes').gte('sale_date', start).lte('sale_date', end),
        supabase.from('adhoc_sales').select('sale_date, amount_kes').gte('sale_date', start).lte('sale_date', end),
      ])

      const range = eachDayOfInterval({ start: new Date(start), end: new Date(end) })
      const points: DailyPoint[] = range.map(d => {
        const dateStr = format(d, 'yyyy-MM-dd')
        const dayEggs = (eggs.data || []).filter(r => r.log_date === dateStr).reduce((s, r) => s + r.total_eggs, 0)
        const dayFeed = (feed.data || []).filter(r => r.log_date === dateStr).reduce((s, r) => s + r.cost_kes, 0)
        const dayRev =
          (sales.data || []).filter(r => r.sale_date === dateStr).reduce((s, r) => s + r.amount_kes, 0) +
          (adhoc.data || []).filter(r => r.sale_date === dateStr).reduce((s, r) => s + r.amount_kes, 0)
        return { date: format(d, 'd MMM'), eggs: dayEggs, feedCost: dayFeed, revenue: dayRev }
      })
      setData(points)
    }
    load()
  }, [days])

  const scatterData = data.filter(d => d.feedCost > 0 && d.eggs > 0).map(d => ({
    feedCost: d.feedCost, eggs: d.eggs,
  }))

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics</h1>

      <div className="flex gap-2 mb-6">
        {[7, 30, 90].map(d => (
          <button key={d} onClick={() => setDays(d)}
            className={`px-4 py-2 rounded-xl font-medium ${days === d ? 'bg-green-700 text-white' : 'bg-white border text-gray-600'}`}>
            {d}d
          </button>
        ))}
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-4">Eggs Collected (daily)</h2>
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
          <h2 className="font-bold text-gray-800 mb-4">Revenue vs Feed Cost (KES)</h2>
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
          <h2 className="font-bold text-gray-800 mb-1">Feed Cost vs Egg Output (correlation)</h2>
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

