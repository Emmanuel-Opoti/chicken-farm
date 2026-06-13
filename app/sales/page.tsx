'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

interface Client { id: string; name: string; delivery_cost_kes: number }
interface Sale {
  id: string; sale_date: string; eggs_sold: number; amount_kes: number
  paid: boolean; delivery_cost_kes: number; notes: string
  clients: { name: string } | null
}
interface AdhocSale {
  id: string; sale_date: string; eggs_sold: number; amount_kes: number; notes: string
}

export default function Sales() {
  const [clients, setClients] = useState<Client[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [adhoc, setAdhoc] = useState<AdhocSale[]>([])
  const [tab, setTab] = useState<'client' | 'adhoc' | 'history'>('client')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const [clientForm, setClientForm] = useState({
    client_id: '', sale_date: format(new Date(), 'yyyy-MM-dd'),
    eggs_sold: '', price_per_egg_kes: '15', delivery_cost_kes: '0', notes: '',
  })
  const [adhocForm, setAdhocForm] = useState({
    sale_date: format(new Date(), 'yyyy-MM-dd'),
    eggs_sold: '', price_per_egg_kes: '15', notes: '',
  })

  async function load() {
    const [c, s, a] = await Promise.all([
      supabase.from('clients').select('id, name, delivery_cost_kes').eq('active', true).order('name'),
      supabase.from('sales').select('*, clients(name)').order('sale_date', { ascending: false }).limit(50),
      supabase.from('adhoc_sales').select('*').order('sale_date', { ascending: false }).limit(50),
    ])
    if (c.data) setClients(c.data)
    if (s.data) setSales(s.data as Sale[])
    if (a.data) setAdhoc(a.data)
  }

  useEffect(() => { load() }, [])

  const clientTotal = clientForm.eggs_sold && clientForm.price_per_egg_kes
    ? (parseInt(clientForm.eggs_sold) * parseFloat(clientForm.price_per_egg_kes) + parseFloat(clientForm.delivery_cost_kes || '0')).toFixed(0)
    : null

  const adhocTotal = adhocForm.eggs_sold && adhocForm.price_per_egg_kes
    ? (parseInt(adhocForm.eggs_sold) * parseFloat(adhocForm.price_per_egg_kes)).toFixed(0)
    : null

  async function saveClientSale(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const eggs = parseInt(clientForm.eggs_sold)
    const pricePer = parseFloat(clientForm.price_per_egg_kes)
    const delivery = parseFloat(clientForm.delivery_cost_kes || '0')
    const { error } = await supabase.from('sales').insert({
      client_id: clientForm.client_id || null,
      sale_date: clientForm.sale_date,
      eggs_sold: eggs,
      price_per_egg_kes: pricePer,
      delivery_cost_kes: delivery,
      amount_kes: eggs * pricePer + delivery,
      notes: clientForm.notes,
    })
    setSaving(false)
    if (!error) { setMsg('Sale recorded!'); setClientForm(p => ({ ...p, eggs_sold: '', notes: '' })); load() }
  }

  async function saveAdhoc(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const eggs = parseInt(adhocForm.eggs_sold)
    const pricePer = parseFloat(adhocForm.price_per_egg_kes)
    const { error } = await supabase.from('adhoc_sales').insert({
      sale_date: adhocForm.sale_date,
      eggs_sold: eggs,
      price_per_egg_kes: pricePer,
      amount_kes: eggs * pricePer,
      notes: adhocForm.notes,
    })
    setSaving(false)
    if (!error) { setMsg('Sale recorded!'); setAdhocForm(p => ({ ...p, eggs_sold: '', notes: '' })); load() }
  }

  async function markPaid(id: string) {
    await supabase.from('sales').update({ paid: true, payment_date: format(new Date(), 'yyyy-MM-dd') }).eq('id', id)
    load()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Sales</h1>

      {msg && <div className="mb-4 bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3">✓ {msg}</div>}

      <div className="flex gap-2 mb-6 flex-wrap">
        {(['client', 'adhoc', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl font-medium capitalize ${tab === t ? 'bg-green-700 text-white' : 'bg-white border text-gray-600'}`}>
            {t === 'client' ? 'Client Sale' : t === 'adhoc' ? 'Ad-hoc Sale' : 'History'}
          </button>
        ))}
      </div>

      {tab === 'client' && (
        <form onSubmit={saveClientSale} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-4">Record Client Sale</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
              <select value={clientForm.client_id} onChange={e => {
                const c = clients.find(x => x.id === e.target.value)
                setClientForm(p => ({ ...p, client_id: e.target.value, delivery_cost_kes: c ? String(c.delivery_cost_kes) : '0' }))
              }} className="w-full border border-gray-300 rounded-xl px-3 py-2 bg-white">
                <option value="">Walk-in / unregistered</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={clientForm.sale_date} onChange={e => setClientForm(p => ({ ...p, sale_date: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Eggs sold</label>
              <input type="number" min="1" value={clientForm.eggs_sold} onChange={e => setClientForm(p => ({ ...p, eggs_sold: e.target.value }))} required
                className="w-full border border-gray-300 rounded-xl px-3 py-2" />
              {clientForm.eggs_sold && <p className="text-xs text-gray-400 mt-0.5">{Math.floor(parseInt(clientForm.eggs_sold)/12)} trays + {parseInt(clientForm.eggs_sold)%12} loose</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price per egg (KES)</label>
              <input type="number" min="0" step="0.5" value={clientForm.price_per_egg_kes} onChange={e => setClientForm(p => ({ ...p, price_per_egg_kes: e.target.value }))} required
                className="w-full border border-gray-300 rounded-xl px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery cost (KES)</label>
              <input type="number" min="0" value={clientForm.delivery_cost_kes} onChange={e => setClientForm(p => ({ ...p, delivery_cost_kes: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input value={clientForm.notes} onChange={e => setClientForm(p => ({ ...p, notes: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2" />
            </div>
          </div>
          {clientTotal && <p className="mt-3 text-green-700 font-semibold">Total: KES {parseInt(clientTotal).toLocaleString()}</p>}
          <button disabled={saving} className="mt-4 bg-green-700 text-white rounded-xl px-6 py-3 font-semibold disabled:opacity-40">
            Save Sale
          </button>
        </form>
      )}

      {tab === 'adhoc' && (
        <form onSubmit={saveAdhoc} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-4">Ad-hoc Sale (under a tray, no client)</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={adhocForm.sale_date} onChange={e => setAdhocForm(p => ({ ...p, sale_date: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Eggs sold</label>
              <input type="number" min="1" max="11" value={adhocForm.eggs_sold} onChange={e => setAdhocForm(p => ({ ...p, eggs_sold: e.target.value }))} required
                className="w-full border border-gray-300 rounded-xl px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price per egg (KES)</label>
              <input type="number" min="0" step="0.5" value={adhocForm.price_per_egg_kes} onChange={e => setAdhocForm(p => ({ ...p, price_per_egg_kes: e.target.value }))} required
                className="w-full border border-gray-300 rounded-xl px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input value={adhocForm.notes} onChange={e => setAdhocForm(p => ({ ...p, notes: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2" />
            </div>
          </div>
          {adhocTotal && <p className="mt-3 text-green-700 font-semibold">Total: KES {parseInt(adhocTotal).toLocaleString()}</p>}
          <button disabled={saving} className="mt-4 bg-blue-600 text-white rounded-xl px-6 py-3 font-semibold disabled:opacity-40">
            Save Sale
          </button>
        </form>
      )}

      {tab === 'history' && (
        <div className="space-y-3">
          <h2 className="font-bold text-gray-800">Client Sales</h2>
          {sales.map(s => (
            <div key={s.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{s.clients?.name || 'Walk-in'}</p>
                  <p className="text-sm text-gray-500">{format(new Date(s.sale_date), 'd MMM yyyy')} · {s.eggs_sold} eggs ({Math.floor(s.eggs_sold/12)} trays)</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">KES {s.amount_kes.toLocaleString()}</p>
                  {s.paid
                    ? <span className="text-xs text-green-600">Paid</span>
                    : <button onClick={() => markPaid(s.id)} className="text-xs text-red-500 underline">Mark paid</button>
                  }
                </div>
              </div>
            </div>
          ))}

          <h2 className="font-bold text-gray-800 pt-4">Ad-hoc Sales</h2>
          {adhoc.map(s => (
            <div key={s.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{format(new Date(s.sale_date), 'd MMM yyyy')} · {s.eggs_sold} eggs</p>
                  {s.notes && <p className="text-xs text-gray-400">{s.notes}</p>}
                </div>
                <p className="font-bold text-gray-900">KES {s.amount_kes.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
