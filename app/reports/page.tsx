'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subWeeks, subMonths, subYears } from 'date-fns'

interface ReportData {
  totalEggs: number; totalTrays: number; totalFeedCost: number
  totalRevenue: number; totalVaccineCost: number; clientSales: number; adhocSales: number
  totalMortality: number; mortalitySickness: number; mortalitySlaughter: number; mortalityCulling: number; mortalityAge: number
  totalLiveBirds: number
}

const emptyReport: ReportData = {
  totalEggs: 0, totalTrays: 0, totalFeedCost: 0,
  totalRevenue: 0, totalVaccineCost: 0, clientSales: 0, adhocSales: 0,
  totalMortality: 0, mortalitySickness: 0, mortalitySlaughter: 0, mortalityCulling: 0, mortalityAge: 0,
  totalLiveBirds: 0,
}

async function fetchReport(start: string, end: string): Promise<ReportData> {
  const [eggs, feed, sales, adhoc, vaccines, mortality, flocks] = await Promise.all([
    supabase.from('egg_logs').select('total_eggs, trays').gte('log_date', start).lte('log_date', end),
    supabase.from('feed_logs').select('cost_kes').gte('log_date', start).lte('log_date', end),
    supabase.from('sales').select('amount_kes').gte('sale_date', start).lte('sale_date', end),
    supabase.from('adhoc_sales').select('amount_kes').gte('sale_date', start).lte('sale_date', end),
    supabase.from('vaccination_logs').select('cost_kes').gte('scheduled_date', start).lte('scheduled_date', end).not('administered_date', 'is', null),
    supabase.from('mortality_logs').select('count, cause_type').gte('log_date', start).lte('log_date', end),
    supabase.from('flocks').select('current_count').eq('active', true),
  ])
  const totalEggs = (eggs.data || []).reduce((s, r) => s + r.total_eggs, 0)
  const clientSales = (sales.data || []).reduce((s, r) => s + r.amount_kes, 0)
  const adhocSales = (adhoc.data || []).reduce((s, r) => s + r.amount_kes, 0)
  const mortalityRows = mortality.data || []
  return {
    totalEggs,
    totalTrays: Math.floor(totalEggs / 12),
    totalFeedCost: (feed.data || []).reduce((s, r) => s + r.cost_kes, 0),
    totalVaccineCost: (vaccines.data || []).reduce((s, r) => s + (r.cost_kes || 0), 0),
    clientSales, adhocSales,
    totalRevenue: clientSales + adhocSales,
    totalMortality: mortalityRows.reduce((s, r) => s + r.count, 0),
    mortalitySickness:  mortalityRows.filter(r => r.cause_type === 'sickness').reduce((s, r) => s + r.count, 0),
    mortalitySlaughter: mortalityRows.filter(r => r.cause_type === 'slaughter').reduce((s, r) => s + r.count, 0),
    mortalityCulling:   mortalityRows.filter(r => r.cause_type === 'culling').reduce((s, r) => s + r.count, 0),
    mortalityAge:       mortalityRows.filter(r => r.cause_type === 'age').reduce((s, r) => s + r.count, 0),
    totalLiveBirds: (flocks.data || []).reduce((s, r) => s + r.current_count, 0),
  }
}

function ReportCard({ label, data, start, end, onExport }: {
  label: string; data: ReportData; start: string; end: string; onExport: () => void
}) {
  const profit = data.totalRevenue - data.totalFeedCost - data.totalVaccineCost
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-1">
        <h2 className="font-bold text-gray-800 text-lg">{label}</h2>
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

async function exportPDF(label: string, data: ReportData, start: string, end: string) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()

  // Green header
  doc.setFillColor(21, 128, 61)
  doc.roundedRect(0, 0, pageW, 38, 0, 0, 'F')

  // Farm name
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('times', 'bold')
  doc.text('WANDERA RETIREMENT', pageW / 2, 13, { align: 'center' })
  doc.text('CHICKEN BUSINESS', pageW / 2, 22, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Farm Performance Report', pageW / 2, 31, { align: 'center' })

  // Report period
  doc.setTextColor(40, 40, 40)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(label, 14, 50)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text(`${format(new Date(start), 'd MMM yyyy')} – ${format(new Date(end), 'd MMM yyyy')}`, 14, 57)
  doc.text(`Generated: ${format(new Date(), 'd MMM yyyy, HH:mm')}`, pageW - 14, 57, { align: 'right' })

  const profit = data.totalRevenue - data.totalFeedCost - data.totalVaccineCost

  // Summary table
  autoTable(doc, {
    startY: 65,
    head: [['Metric', 'Value']],
    body: [
      ['Live Birds (current)', data.totalLiveBirds.toLocaleString()],
      ['Total Eggs Collected', `${data.totalEggs.toLocaleString()} eggs (${data.totalTrays} trays)`],
      ['Feed Cost', `KES ${data.totalFeedCost.toLocaleString()}`],
      ['Vaccine Cost', `KES ${data.totalVaccineCost.toLocaleString()}`],
      ['Total Costs', `KES ${(data.totalFeedCost + data.totalVaccineCost).toLocaleString()}`],
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
      if (data.row.index === 8) { // Net Profit
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fontSize = 11
        data.cell.styles.textColor = profit >= 0 ? [21, 128, 61] : [220, 38, 38]
      }
      if (data.row.index === 4 || data.row.index === 7) { // Total Costs / Total Revenue
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = [230, 245, 235]
      }
      if (data.row.index === 9) { // Mortality header row
        data.cell.styles.textColor = [120, 120, 120]
        data.cell.styles.fontSize = 8
        data.cell.styles.fillColor = [248, 248, 248]
      }
    },
  })

  // Footer
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

  doc.save(`Wandera-Farm-${label.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
}

export default function Reports() {
  const [reports, setReports] = useState<{ label: string; data: ReportData; start: string; end: string }[]>([])

  useEffect(() => {
    const now = new Date()
    const ranges = [
      { label: 'This Week',  start: format(startOfWeek(now), 'yyyy-MM-dd'),            end: format(endOfWeek(now), 'yyyy-MM-dd') },
      { label: 'Last Week',  start: format(startOfWeek(subWeeks(now, 1)), 'yyyy-MM-dd'), end: format(endOfWeek(subWeeks(now, 1)), 'yyyy-MM-dd') },
      { label: 'This Month', start: format(startOfMonth(now), 'yyyy-MM-dd'),            end: format(endOfMonth(now), 'yyyy-MM-dd') },
      { label: 'Last Month', start: format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd'), end: format(endOfMonth(subMonths(now, 1)), 'yyyy-MM-dd') },
      { label: 'This Year',  start: format(startOfYear(now), 'yyyy-MM-dd'),             end: format(endOfYear(now), 'yyyy-MM-dd') },
      { label: 'Last Year',  start: format(startOfYear(subYears(now, 1)), 'yyyy-MM-dd'), end: format(endOfYear(subYears(now, 1)), 'yyyy-MM-dd') },
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
          : reports.map(r => (
            <ReportCard key={r.label} {...r}
              onExport={() => exportPDF(r.label, r.data, r.start, r.end)} />
          ))
        }
      </div>
    </div>
  )
}
