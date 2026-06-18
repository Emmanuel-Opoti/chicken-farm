'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subWeeks, subMonths, subYears } from 'date-fns'

interface Flock { id: string; name: string; current_count: number }

interface ReportData {
  totalEggs: number; totalTrays: number; totalFeedCost: number
  totalRevenue: number; totalVaccineCost: number; clientSales: number; adhocSales: number
  totalMortality: number; mortalitySickness: number; mortalitySlaughter: number; mortalityCulling: number; mortalityAge: number
  totalLiveBirds: number; miscExpenses: number; flockPurchaseCost: number
}

const emptyReport: ReportData = {
  totalEggs: 0, totalTrays: 0, totalFeedCost: 0,
  totalRevenue: 0, totalVaccineCost: 0, clientSales: 0, adhocSales: 0,
  totalMortality: 0, mortalitySickness: 0, mortalitySlaughter: 0, mortalityCulling: 0, mortalityAge: 0,
  totalLiveBirds: 0, miscExpenses: 0, flockPurchaseCost: 0,
}

async function fetchReport(start: string, end: string, flockId: string | null): Promise<ReportData> {
  const flockFilter = (q: any) => flockId ? q.eq('flock_id', flockId) : q

  const [eggs, feed, sales, adhoc, vaccines, mortality, flocks, misc, flockPurchase] = await Promise.all([
    flockFilter(supabase.from('egg_logs').select('total_eggs, trays')).gte('log_date', start).lte('log_date', end),
    flockFilter(supabase.from('feed_logs').select('cost_kes')).gte('log_date', start).lte('log_date', end),
    supabase.from('sales').select('amount_kes').gte('sale_date', start).lte('sale_date', end),
    supabase.from('adhoc_sales').select('amount_kes').gte('sale_date', start).lte('sale_date', end),
    flockFilter(supabase.from('vaccination_logs').select('cost_kes')).gte('scheduled_date', start).lte('scheduled_date', end).not('administered_date', 'is', null),
    flockFilter(supabase.from('mortality_logs').select('count, cause_type')).gte('log_date', start).lte('log_date', end),
    flockId
      ? supabase.from('flocks').select('current_count').eq('id', flockId)
      : supabase.from('flocks').select('current_count').eq('active', true),
    flockId
      ? supabase.from('misc_expenses').select('amount_kes').eq('flock_id', flockId).gte('expense_date', start).lte('expense_date', end)
      : supabase.from('misc_expenses').select('amount_kes').gte('expense_date', start).lte('expense_date', end),
    flockId
      ? supabase.from('flocks').select('purchase_cost_kes').eq('id', flockId).gte('date_received', start).lte('date_received', end)
      : supabase.from('flocks').select('purchase_cost_kes').gte('date_received', start).lte('date_received', end),
  ])

  const totalEggs = (eggs.data || []).reduce((s: number, r: any) => s + r.total_eggs, 0)
  const clientSales = (sales.data || []).reduce((s: number, r: any) => s + r.amount_kes, 0)
  const adhocSales = (adhoc.data || []).reduce((s: number, r: any) => s + r.amount_kes, 0)
  const mortalityRows: any[] = mortality.data || []
  return {
    totalEggs,
    totalTrays: Math.floor(totalEggs / 12),
    totalFeedCost: (feed.data || []).reduce((s: number, r: any) => s + r.cost_kes, 0),
    totalVaccineCost: (vaccines.data || []).reduce((s: number, r: any) => s + (r.cost_kes || 0), 0),
    clientSales, adhocSales,
    totalRevenue: clientSales + adhocSales,
    totalMortality: mortalityRows.reduce((s: number, r: any) => s + r.count, 0),
    mortalitySickness:  mortalityRows.filter((r: any) => r.cause_type === 'sickness').reduce((s: number, r: any) => s + r.count, 0),
    mortalitySlaughter: mortalityRows.filter((r: any) => r.cause_type === 'slaughter').reduce((s: number, r: any) => s + r.count, 0),
    mortalityCulling:   mortalityRows.filter((r: any) => r.cause_type === 'culling').reduce((s: number, r: any) => s + r.count, 0),
    mortalityAge:       mortalityRows.filter((r: any) => r.cause_type === 'age').reduce((s: number, r: any) => s + r.count, 0),
    totalLiveBirds: (flocks.data || []).reduce((s: number, r: any) => s + r.current_count, 0),
    miscExpenses: (misc.data || []).reduce((s: number, r: any) => s + r.amount_kes, 0),
    flockPurchaseCost: (flockPurchase.data || []).reduce((s: number, r: any) => s + (r.purchase_cost_kes || 0), 0),
  }
}

function ReportCard({ label, data, start, end, flockName, onExport }: {
  label: string; data: ReportData; start: string; end: string; flockName: string; onExport: () => void
}) {
  const totalCosts = data.totalFeedCost + data.totalVaccineCost + data.miscExpenses + data.flockPurchaseCost
  const profit = data.totalRevenue - totalCosts
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="font-bold text-gray-800 text-lg">{label}</h2>
          {flockName !== 'All Flocks' && (
            <span className="inline-block mt-0.5 text-xs bg-green-100 text-green-800 rounded-full px-2 py-0.5 font-medium">
              {flockName}
            </span>
          )}
        </div>
        <button onClick={onExport}
          className="flex items-center gap-1.5 text-xs bg-green-700 text-white rounded-lg px-3 py-1.5 font-medium shrink-0 ml-2">
          Export PDF
        </button>
      </div>
      <p className="text-xs text-gray-400 mb-4">{format(new Date(start), 'd MMM')} – {format(new Date(end), 'd MMM yyyy')}</p>
      <div className="grid grid-cols-2 gap-y-3 text-sm">
        <span className="text-gray-500">Live birds (now)</span>
        <span className="font-semibold">{data.totalLiveBirds.toLocaleString()}</span>
        <span className="text-gray-500">Total eggs</span>
        <span className="font-semibold">{data.totalEggs.toLocaleString()} ({data.totalTrays} trays)</span>
        <span className="text-gray-500">Feed cost</span>
        <span className="font-semibold text-red-600">KES {data.totalFeedCost.toLocaleString()}</span>
        <span className="text-gray-500">Vaccine cost</span>
        <span className="font-semibold text-red-600">KES {data.totalVaccineCost.toLocaleString()}</span>
        {data.miscExpenses > 0 && <>
          <span className="text-gray-500">Misc expenses</span>
          <span className="font-semibold text-red-600">KES {data.miscExpenses.toLocaleString()}</span>
        </>}
        {data.flockPurchaseCost > 0 && <>
          <span className="text-gray-500">Flock purchase</span>
          <span className="font-semibold text-red-600">KES {data.flockPurchaseCost.toLocaleString()}</span>
        </>}
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
        {data.totalMortality > 0 && <>
          <span className="text-gray-400 text-xs pt-1 col-span-2 border-t border-gray-100">Mortality this period</span>
          <span className="text-gray-500">Deaths (total)</span>
          <span className="font-semibold text-red-500">{data.totalMortality}</span>
          {data.mortalitySickness  > 0 && <><span className="text-gray-400 pl-3">· Sickness</span><span>{data.mortalitySickness}</span></>}
          {data.mortalitySlaughter > 0 && <><span className="text-gray-400 pl-3">· Slaughter</span><span>{data.mortalitySlaughter}</span></>}
          {data.mortalityCulling   > 0 && <><span className="text-gray-400 pl-3">· Culling</span><span>{data.mortalityCulling}</span></>}
          {data.mortalityAge       > 0 && <><span className="text-gray-400 pl-3">· Natural/Age</span><span>{data.mortalityAge}</span></>}
        </>}
      </div>
    </div>
  )
}

async function exportPDF(label: string, data: ReportData, start: string, end: string, flockName: string) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()

  doc.setFillColor(21, 128, 61)
  doc.roundedRect(0, 0, pageW, 38, 0, 0, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('times', 'bold')
  doc.text('WANDERA RETIREMENT', pageW / 2, 13, { align: 'center' })
  doc.text('CHICKEN BUSINESS', pageW / 2, 22, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Farm Performance Report', pageW / 2, 31, { align: 'center' })

  doc.setTextColor(40, 40, 40)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(label + (flockName !== 'All Flocks' ? ' — ' + flockName : ''), 14, 50)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text(`${format(new Date(start), 'd MMM yyyy')} – ${format(new Date(end), 'd MMM yyyy')}`, 14, 57)
  doc.text(`Generated: ${format(new Date(), 'd MMM yyyy, HH:mm')}`, pageW - 14, 57, { align: 'right' })
  if (flockName !== 'All Flocks') {
    doc.setFontSize(8)
    doc.setTextColor(130, 130, 130)
    doc.text('Note: Sales revenue is farm-wide (not flock-specific).', 14, 63)
  }

  const totalCosts = data.totalFeedCost + data.totalVaccineCost + data.miscExpenses + data.flockPurchaseCost
  const profit = data.totalRevenue - totalCosts

  autoTable(doc, {
    startY: flockName !== 'All Flocks' ? 70 : 65,
    head: [['Metric', 'Value']],
    body: [
      ['Live Birds (current)', data.totalLiveBirds.toLocaleString()],
      ['Total Eggs Collected', `${data.totalEggs.toLocaleString()} eggs (${data.totalTrays} trays)`],
      ['Feed Cost', `KES ${data.totalFeedCost.toLocaleString()}`],
      ['Vaccine Cost', `KES ${data.totalVaccineCost.toLocaleString()}`],
      ['Misc Expenses', `KES ${data.miscExpenses.toLocaleString()}`],
      ['Flock Purchase Cost', `KES ${data.flockPurchaseCost.toLocaleString()}`],
      ['Total Costs', `KES ${totalCosts.toLocaleString()}`],
      ['Client Sales Revenue', `KES ${data.clientSales.toLocaleString()}`],
      ['Ad-hoc Sales Revenue', `KES ${data.adhocSales.toLocaleString()}`],
      ['Total Revenue', `KES ${data.totalRevenue.toLocaleString()}`],
      ['Net Profit', `KES ${profit.toLocaleString()}`],
      ['— Mortality (period) —', ''],
      ['Birds Lost (total)', String(data.totalMortality)],
      ['  · Sickness', String(data.mortalitySickness)],
      ['  · Slaughter', String(data.mortalitySlaughter)],
      ['  · Culling', String(data.mortalityCulling)],
      ['  · Natural / Age', String(data.mortalityAge)],
    ],
    headStyles: { fillColor: [21, 128, 61], textColor: 255, fontStyle: 'bold', fontSize: 10 },
    bodyStyles: { fontSize: 10, textColor: [40, 40, 40] },
    columnStyles: { 0: { cellWidth: 90 }, 1: { cellWidth: 80, halign: 'right' } },
    alternateRowStyles: { fillColor: [245, 250, 247] },
    didParseCell: (data) => {
      if (data.row.index === 8) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fontSize = 11
        data.cell.styles.textColor = profit >= 0 ? [21, 128, 61] : [220, 38, 38]
      }
      if (data.row.index === 4 || data.row.index === 7) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = [230, 245, 235]
      }
      if (data.row.index === 9) {
        data.cell.styles.textColor = [120, 120, 120]
        data.cell.styles.fontSize = 8
        data.cell.styles.fillColor = [248, 248, 248]
      }
    },
  })

  const finalY = (doc as any).lastAutoTable.finalY + 10
  doc.setDrawColor(21, 128, 61)
  doc.setLineWidth(0.3)
  doc.line(14, finalY, pageW - 14, finalY)
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.setFont('times', 'bold')
  doc.text('WANDERA', pageW / 2, finalY + 6, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.text('Wandera Retirement Chicken Business — Confidential', pageW / 2, finalY + 11, { align: 'center' })

  const suffix = flockName !== 'All Flocks' ? `-${flockName.replace(/\s+/g, '-')}` : ''
  doc.save(`Wandera-Farm-${label.replace(/\s+/g, '-')}${suffix}-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
}

export default function Reports() {
  const [flocks, setFlocks]       = useState<Flock[]>([])
  const [selectedFlock, setSelectedFlock] = useState<string | null>(null)   // null = All Flocks
  const [reports, setReports]     = useState<{ label: string; data: ReportData; start: string; end: string }[]>([])
  const [loading, setLoading]     = useState(false)

  // Load flocks once
  useEffect(() => {
    supabase.from('flocks').select('id, name, current_count').eq('active', true).order('name')
      .then(({ data }) => setFlocks(data || []))
  }, [])

  // Reload reports whenever flock selection changes
  useEffect(() => {
    setLoading(true)
    const now = new Date()
    const ranges = [
      { label: 'This Week',  start: format(startOfWeek(now), 'yyyy-MM-dd'),               end: format(endOfWeek(now), 'yyyy-MM-dd') },
      { label: 'Last Week',  start: format(startOfWeek(subWeeks(now, 1)), 'yyyy-MM-dd'),  end: format(endOfWeek(subWeeks(now, 1)), 'yyyy-MM-dd') },
      { label: 'This Month', start: format(startOfMonth(now), 'yyyy-MM-dd'),              end: format(endOfMonth(now), 'yyyy-MM-dd') },
      { label: 'Last Month', start: format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd'),end: format(endOfMonth(subMonths(now, 1)), 'yyyy-MM-dd') },
      { label: 'This Year',  start: format(startOfYear(now), 'yyyy-MM-dd'),               end: format(endOfYear(now), 'yyyy-MM-dd') },
      { label: 'Last Year',  start: format(startOfYear(subYears(now, 1)), 'yyyy-MM-dd'),  end: format(endOfYear(subYears(now, 1)), 'yyyy-MM-dd') },
    ]
    Promise.all(ranges.map(r => fetchReport(r.start, r.end, selectedFlock))).then(results => {
      setReports(ranges.map((r, i) => ({ ...r, data: results[i] })))
      setLoading(false)
    })
  }, [selectedFlock])

  const flockName = selectedFlock
    ? (flocks.find(f => f.id === selectedFlock)?.name ?? 'Flock')
    : 'All Flocks'

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Reports</h1>

      {/* Flock selector */}
      <div className="mb-6">
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
            Sales revenue shows farm-wide totals — sales are not linked to individual flocks.
          </p>
        )}
      </div>

      {loading && (
        <p className="text-gray-400 text-center py-10">Loading reports...</p>
      )}

      {!loading && (
        <div className="grid md:grid-cols-2 gap-5">
          {reports.map(r => (
            <ReportCard key={r.label} {...r}
              flockName={flockName}
              onExport={() => exportPDF(r.label, r.data, r.start, r.end, flockName)} />
          ))}
        </div>
      )}
    </div>
  )
}
