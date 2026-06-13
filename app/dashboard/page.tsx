export const dynamic = 'force-dynamic'
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { Egg, Wheat, Users, AlertTriangle, TrendingUp } from 'lucide-react'

interface Stats {
  todayEggs: number
  todayTrays: number
  todayFeedCost: number
  activeFlocks: number
  totalBirds: number
  monthRevenue: number
  pendingVaccinations: number
  priceReviewDue: boolean
}

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub?: string; icon: React.ElementType; color: string
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const today = format(new Date(), 'yyyy-MM-dd')
  const monthStart = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')

  useEffect(() => {
    async function load() {
      const [eggs, feed, flocks, sales, adhoc, vaccinations, inputs] = await Promise.all([
        supabase.from('egg_logs').select('total_eggs, trays').eq('log_date', today),
        supabase.from('feed_logs').select('cost_kes').eq('log_date', today),
        supabase.from('flocks').select('current_count').eq('active', true),
        supabase.from('sales').select('amount_kes').gte('sale_date', monthStart),
        supabase.from('adhoc_sales').select('amount_kes').gte('sale_date', monthStart),
        supabase.from('vaccination_logs').select('id').lte('scheduled_date', today).is('administered_date', null),
        supabase.from('inputs').select('last_price_update'),
      ])

      const todayEggs = (eggs.data || []).reduce((s, r) => s + r.total_eggs, 0)
      const todayFeedCost = (feed.data || []).reduce((s, r) => s + r.cost_kes, 0)
      const totalBirds = (flocks.data || []).reduce((s, r) => s + r.current_count, 0)
      const monthRevenue =
        (sales.data || []).reduce((s, r) => s + r.amount_kes, 0) +
        (adhoc.data || []).reduce((s, r) => s + r.amount_kes, 0)
      const priceReviewDue = (inputs.data || []).some(i => {
        const last = new Date(i.last_price_update)
        const diff = (new Date().getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
        return diff > 30
      })

      setStats({
        todayEggs,
        todayTrays: Math.floor(todayEggs / 12),
        todayFeedCost,
        activeFlocks: flocks.data?.length || 0,
        totalBirds,
        monthRevenue,
        pendingVaccinations: vaccinations.data?.length || 0,
        priceReviewDue,
      })
    }
    load()
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
      <p className="text-gray-500 text-sm mb-6">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>

      {stats?.priceReviewDue && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-amber-500 shrink-0" />
          <div>
            <p className="font-semibold text-amber-800">Prices need review</p>
            <p className="text-sm text-amber-700">Some input prices haven't been updated in over 30 days.
              <a href="/registry" className="underline ml-1">Update in Registry â†’</a>
            </p>
          </div>
        </div>
      )}

      {stats?.pendingVaccinations ? (
        <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-red-500 shrink-0" />
          <p className="text-red-800 font-semibold">
            {stats.pendingVaccinations} vaccination(s) overdue â€”
            <a href="/sop" className="underline ml-1">check schedule â†’</a>
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Eggs Today" value={stats ? `${stats.todayEggs}` : 'â€”'}
          sub={stats ? `${stats.todayTrays} trays + ${stats.todayEggs % 12} loose` : undefined}
          icon={Egg} color="bg-yellow-500" />
        <StatCard label="Feed Cost Today" value={stats ? `KES ${stats.todayFeedCost.toLocaleString()}` : 'â€”'}
          icon={Wheat} color="bg-green-600" />
        <StatCard label="Total Birds" value={stats ? `${stats.totalBirds}` : 'â€”'}
          sub={stats ? `${stats.activeFlocks} active flock(s)` : undefined}
          icon={Users} color="bg-blue-500" />
        <StatCard label="Revenue This Month" value={stats ? `KES ${stats.monthRevenue.toLocaleString()}` : 'â€”'}
          icon={TrendingUp} color="bg-purple-600" />
      </div>

      <div className="mt-8 grid md:grid-cols-2 gap-4">
        <a href="/daily" className="block bg-green-700 text-white rounded-2xl p-6 shadow hover:bg-green-800 transition-colors">
          <p className="text-lg font-bold">+ Log Today&apos;s Data</p>
          <p className="text-green-200 text-sm mt-1">Feed, eggs, water</p>
        </a>
        <a href="/sales" className="block bg-blue-600 text-white rounded-2xl p-6 shadow hover:bg-blue-700 transition-colors">
          <p className="text-lg font-bold">+ Record a Sale</p>
          <p className="text-blue-200 text-sm mt-1">Client delivery or ad-hoc</p>
        </a>
      </div>
    </div>
  )
}

