'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subWeeks, subMonths, subYears } from 'date-fns'

interface ReportData {
  totalEggs: number; totalTrays: number; totalFeedCost: number
  totalRevenue: number; totalVaccineCost: number; clientSales: number; adhocSales: number
}

const emptyReport: ReportData = {
  totalEggs: 0, totalTrays: 0, totalFeedCost: 0,
  totalRevenue: 0, totalVaccineCost: 0, clientSales: 0, adhocSales: 0,
}

async function fetchReport(start: string, end: string): Promise<ReportData> {
  const [eggs, feed, sales, adhoc, vaccines] = await Promise.all([
    supabase.from('egg_logs').select('total_eggs, trays').gte('log_date', start).lte('log_date', end),
    supabase.from('feed_logs').select('cost_kes').gte('log_date', start).lte('log_date', end),
    supabase.from('sales').select('amount_kes').gte('sale_date', start).lte('sale_date', end),
    supabase.from('adhoc_sales').select('amount_kes').gte('sale_date', start).lte('sale_date', end),
    supabase.from('vaccination_logs').select('cost_kes').gte('scheduled_date', start).lte('scheduled_date', end).not('administered_date', 'is', null),
  ])
  const totalEggs = (eggs.data || []).reduce((s, r) => s + r.total_eggs, 0)
  const clientSales = (sales.data || []).reduce((s, r) => s + r.amount_kes, 0)
  const adhocSales = (adhoc.data || []).reduce((s, r) => s + r.amount_kes, 0)
  return {
    totalEggs,
    totalTrays: Math.floor(totalEggs / 12),
    totalFeedCost: (feed.data || []).reduce((s, r) => s + r.cost_kes, 0),
    totalVaccineCost: (vaccines.data || []).reduce((s, r) => s + (r.cost_kes || 0), 0),
    clientSales, adhocSales,
    totalRevenue: clientSales + adhocSales,
  }
}

function ReportCard({ label, data, start, end }: { label: string; data: ReportData; start: string; end: string }) {
  const profit = data.totalRevenue - data.totalFeedCost - data.totalVaccineCost
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h2 className="font-bold text-gray-800 text-lg mb-1">{label}</h2>
      <p className="text-xs text-gray-400 mb-4">{format(new Date(start), 'd MMM')} - {format(new Date(end), 'd MMM yyyy')}</p>
      <div className="grid grid-cols-2 gap-y-3 text-sm">
        <span className="text-gray-500">Total eggs</span>
        <span className="font-semibold">{data.totalEggs.toLocaleString()} ({data.totalTrays} trays)</span>
        <span className="text-gray-500">Feed cost</span>
        <span className="font-semibold text-red-600">KES {data.totalFeedCost.toLocaleString()}</span>
        <span className="text-gray-500">Vaccine cost</span>
        <span className="font-semibold text-red-600">KES {data.totalVaccineCost.toLocaleString()}</span>
        <span className="text-gray-500">Client sales</span>
        <span className="font-semibold text-green-700">KES {data.clientSales.toLocaleString()}</span>
        <span className="text-gray-500">Ad-hoc sales</span>
        <span className="font-semibold text-green-700">KES {data.adhocSales.toLocaleString()}</span>
        <span className="text-gray-500">Total revenue</span>
        <span className="font-bold text-green-700">KES {data.totalRevenue.toLocaleString()}</span>
        <span className="text-gray-500 font-medium">Net profit</span>
        <span className={`font-bold text-lg ${profit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
          KES {profit.toLocaleString()}
        </span>
      </div>
    </div>
  )
}

export default function Reports() {
  const [reports, setReports] = useState<{ label: string; data: ReportData; start: string; end: string }[]>([])

  useEffect(() => {
    const now = new Date()
    const ranges = [
      { label: 'This Week', start: format(startOfWeek(now), 'yyyy-MM-dd'), end: format(endOfWeek(now), 'yyyy-MM-dd') },
      { label: 'Last Week', start: format(startOfWeek(subWeeks(now, 1)), 'yyyy-MM-dd'), end: format(endOfWeek(subWeeks(now, 1)), 'yyyy-MM-dd') },
      { label: 'This Month', start: format(startOfMonth(now), 'yyyy-MM-dd'), end: format(endOfMonth(now), 'yyyy-MM-dd') },
      { label: 'Last Month', start: format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd'), end: format(endOfMonth(subMonths(now, 1)), 'yyyy-MM-dd') },
      { label: 'This Year', start: format(startOfYear(now), 'yyyy-MM-dd'), end: format(endOfYear(now), 'yyyy-MM-dd') },
      { label: 'Last Year', start: format(startOfYear(subYears(now, 1)), 'yyyy-MM-dd'), end: format(endOfYear(subYears(now, 1)), 'yyyy-MM-dd') },
    ]
    Promise.all(ranges.map(r => fetchReport(r.start, r.end))).then(results => {
      setReports(ranges.map((r, i) => ({ ...r, data: results[i] })))
    })
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>
      <div className="grid md:grid-cols-2 gap-5">
        {reports.length === 0
          ? <p className="text-gray-400 col-span-2 py-10 text-center">Loading reports...</p>
          : reports.map(r => <ReportCard key={r.label} {...r} />)
        }
      </div>
    </div>
  )
}

