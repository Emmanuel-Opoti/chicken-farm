export const dynamic = 'force-dynamic'
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isToday, getDay, subMonths, addMonths
} from 'date-fns'

interface DayData { eggs: number; feedCost: number }

export default function CalendarPage() {
  const [current, setCurrent] = useState(new Date())
  const [dayData, setDayData] = useState<Record<string, DayData>>({})
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    const start = format(startOfMonth(current), 'yyyy-MM-dd')
    const end = format(endOfMonth(current), 'yyyy-MM-dd')

    Promise.all([
      supabase.from('egg_logs').select('log_date, total_eggs').gte('log_date', start).lte('log_date', end),
      supabase.from('feed_logs').select('log_date, cost_kes').gte('log_date', start).lte('log_date', end),
    ]).then(([eggs, feed]) => {
      const map: Record<string, DayData> = {}
      ;(eggs.data || []).forEach(r => {
        if (!map[r.log_date]) map[r.log_date] = { eggs: 0, feedCost: 0 }
        map[r.log_date].eggs += r.total_eggs
      })
      ;(feed.data || []).forEach(r => {
        if (!map[r.log_date]) map[r.log_date] = { eggs: 0, feedCost: 0 }
        map[r.log_date].feedCost += r.cost_kes
      })
      setDayData(map)
    })
  }, [current])

  const days = eachDayOfInterval({ start: startOfMonth(current), end: endOfMonth(current) })
  const startPad = getDay(startOfMonth(current))
  const selData = selected ? dayData[selected] : null

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{format(current, 'MMMM yyyy')}</h1>
        <div className="flex gap-2">
          <button onClick={() => setCurrent(subMonths(current, 1))}
            className="bg-white border rounded-xl px-4 py-2 text-gray-600">â€¹</button>
          <button onClick={() => setCurrent(new Date())}
            className="bg-white border rounded-xl px-4 py-2 text-gray-600 text-sm">Today</button>
          <button onClick={() => setCurrent(addMonths(current, 1))}
            className="bg-white border rounded-xl px-4 py-2 text-gray-600">â€º</button>
        </div>
      </div>

      {selected && selData && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4 flex gap-6">
          <div>
            <p className="text-xs text-gray-500">Date</p>
            <p className="font-semibold">{format(new Date(selected), 'd MMMM yyyy')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Eggs</p>
            <p className="font-semibold">{selData.eggs} ({Math.floor(selData.eggs/12)} trays + {selData.eggs%12} loose)</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Feed cost</p>
            <p className="font-semibold">KES {selData.feedCost.toLocaleString()}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-500 border-b">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} className="py-2">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: startPad }).map((_, i) => (
            <div key={`pad-${i}`} className="min-h-[72px] border-b border-r border-gray-50" />
          ))}
          {days.map(day => {
            const key = format(day, 'yyyy-MM-dd')
            const d = dayData[key]
            const sel = selected === key
            return (
              <button key={key} onClick={() => setSelected(sel ? null : key)}
                className={`min-h-[72px] border-b border-r border-gray-50 p-1.5 text-left transition-colors
                  ${isToday(day) ? 'bg-green-50' : ''}
                  ${sel ? 'bg-green-100 ring-2 ring-green-400 ring-inset' : 'hover:bg-gray-50'}
                  ${!isSameMonth(day, current) ? 'opacity-30' : ''}`}>
                <p className={`text-xs font-medium ${isToday(day) ? 'text-green-700' : 'text-gray-700'}`}>
                  {format(day, 'd')}
                </p>
                {d?.eggs ? (
                  <p className="text-[10px] text-yellow-600 font-medium mt-0.5">ðŸ¥š {d.eggs}</p>
                ) : null}
                {d?.feedCost ? (
                  <p className="text-[10px] text-green-700 font-medium">ðŸŒ¾ {d.feedCost}</p>
                ) : null}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

