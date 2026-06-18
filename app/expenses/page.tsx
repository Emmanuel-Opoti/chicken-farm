'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

interface Flock   { id: string; name: string }
interface Expense {
  id: string; expense_date: string; category: string
  description: string; amount_kes: number; flock_id: string | null
  flocks?: { name: string } | null
}

const CATEGORIES = [
  { value: 'burner',        label: 'Burner' },
  { value: 'feeder',        label: 'Feeder' },
  { value: 'construction',  label: 'Construction Materials' },
  { value: 'sawdust',       label: 'Sawdust' },
  { value: 'water_feeder',  label: 'Water Feeder' },
  { value: 'charcoal',      label: 'Charcoal' },
  { value: 'egg_trays',     label: 'Egg Trays' },
  { value: 'wages',         label: 'Employee Wages' },
  { value: 'other',         label: 'Other' },
]

const catLabel = (v: string) => CATEGORIES.find(c => c.value === v)?.label ?? v

export default function Expenses() {
  const [flocks, setFlocks]       = useState<Flock[]>([])
  const [expenses, setExpenses]   = useState<Expense[]>([])
  const [saving, setSaving]       = useState(false)
  const [msg, setMsg]             = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [editing, setEditing]     = useState<Expense | null>(null)

  const [form, setForm] = useState({
    expense_date: format(new Date(), 'yyyy-MM-dd'),
    category:     'burner',
    description:  '',
    amount_kes:   '',
    flock_id:     '',
  })

  async function load() {
    const [f, e] = await Promise.all([
      supabase.from('flocks').select('id, name').order('name'),
      supabase.from('misc_expenses')
        .select('id, expense_date, category, description, amount_kes, flock_id, flocks(name)')
        .order('expense_date', { ascending: false }),
    ])
    if (f.data) setFlocks(f.data)
    if (e.data) setExpenses(e.data as unknown as Expense[])
  }

  useEffect(() => { load() }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      expense_date: form.expense_date,
      category:     form.category,
      description:  form.description || null,
      amount_kes:   parseFloat(form.amount_kes),
      flock_id:     form.flock_id || null,
    }
    const { error } = await supabase.from('misc_expenses').insert(payload)
    setSaving(false)
    if (!error) {
      setMsg('Expense saved!')
      setForm({ expense_date: format(new Date(), 'yyyy-MM-dd'), category: 'burner', description: '', amount_kes: '', flock_id: '' })
      load()
      setTimeout(() => setMsg(''), 3000)
    }
  }

  async function saveEdit(ex: Expense) {
    await supabase.from('misc_expenses').update({
      expense_date: ex.expense_date,
      category:     ex.category,
      description:  ex.description,
      amount_kes:   ex.amount_kes,
      flock_id:     ex.flock_id,
    }).eq('id', ex.id)
    setEditing(null)
    load()
  }

  async function del(id: string) {
    if (!confirm('Delete this expense?')) return
    await supabase.from('misc_expenses').delete().eq('id', id)
    load()
  }

  const filtered = filterCat === 'all' ? expenses : expenses.filter(e => e.category === filterCat)

  // Summary totals by category
  const totals = CATEGORIES.map(c => ({
    ...c,
    total: expenses.filter(e => e.category === c.value).reduce((s, e) => s + e.amount_kes, 0),
  })).filter(c => c.total > 0)

  const grandTotal = expenses.reduce((s, e) => s + e.amount_kes, 0)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Expenses</h1>
      <p className="text-gray-500 text-sm mb-6">Track all miscellaneous farm costs — equipment, materials, wages, and more.</p>

      {msg && <div className="mb-4 bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 font-medium">✓ {msg}</div>}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Add form */}
        <form onSubmit={save} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 h-fit">
          <h2 className="font-bold text-gray-800 mb-4">Record an Expense</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" value={form.expense_date}
                  onChange={e => setForm(p => ({ ...p, expense_date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 bg-white" required>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KES)</label>
              <input type="number" min="0" step="0.01" value={form.amount_kes}
                onChange={e => setForm(p => ({ ...p, amount_kes: e.target.value }))}
                placeholder="e.g. 2500"
                className="w-full border border-gray-300 rounded-xl px-3 py-2" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
              <input value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="e.g. 2 bags sawdust from Mwangi"
                className="w-full border border-gray-300 rounded-xl px-3 py-2" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Flock (optional)</label>
              <select value={form.flock_id}
                onChange={e => setForm(p => ({ ...p, flock_id: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 bg-white">
                <option value="">Farm-wide (not flock-specific)</option>
                {flocks.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>

            <button type="submit" disabled={saving}
              className="w-full bg-green-700 text-white rounded-xl py-3 font-semibold disabled:opacity-40 mt-1">
              Save Expense
            </button>
          </div>
        </form>

        {/* Summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-800">All-time totals by category</h2>
              <span className="text-lg font-extrabold text-green-700">KES {grandTotal.toLocaleString()}</span>
            </div>
            {totals.length === 0
              ? <p className="text-gray-400 text-sm">No expenses recorded yet.</p>
              : (
                <div className="space-y-2">
                  {totals.map(c => (
                    <div key={c.value} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{c.label}</span>
                      <span className="text-sm font-semibold text-gray-800">KES {c.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        </div>
      </div>

      {/* History */}
      <div className="mt-8">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <h2 className="font-bold text-gray-800 mr-2">History</h2>
          <button onClick={() => setFilterCat('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${filterCat === 'all' ? 'bg-green-700 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
            All
          </button>
          {CATEGORIES.map(c => (
            <button key={c.value} onClick={() => setFilterCat(c.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${filterCat === c.value ? 'bg-green-700 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
              {c.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-10">No expenses found.</p>
        )}

        <div className="space-y-3">
          {filtered.map(ex => (
            <div key={ex.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              {editing?.id === ex.id ? (
                <EditExpenseForm expense={ex} flocks={flocks} onSave={saveEdit} onCancel={() => setEditing(null)} />
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-xs font-semibold bg-green-100 text-green-800 rounded-full px-2 py-0.5">{catLabel(ex.category)}</span>
                      {ex.flocks && <span className="text-xs text-gray-400">{(ex.flocks as any).name}</span>}
                    </div>
                    <p className="font-bold text-gray-900 text-base">KES {ex.amount_kes.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {format(new Date(ex.expense_date), 'd MMM yyyy')}
                      {ex.description ? ` · ${ex.description}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setEditing(ex)} className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600">Edit</button>
                    <button onClick={() => del(ex.id)} className="text-xs border border-red-200 rounded-lg px-3 py-1.5 text-red-500">Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function EditExpenseForm({ expense, flocks, onSave, onCancel }: {
  expense: Expense; flocks: Flock[]
  onSave: (e: Expense) => void; onCancel: () => void
}) {
  const [ex, setEx] = useState({ ...expense })
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-gray-700">Edit expense</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-500">Date</label>
          <input type="date" value={ex.expense_date} onChange={e => setEx(p => ({ ...p, expense_date: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm mt-0.5" />
        </div>
        <div>
          <label className="text-xs text-gray-500">Category</label>
          <select value={ex.category} onChange={e => setEx(p => ({ ...p, category: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm mt-0.5 bg-white">
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500">Amount (KES)</label>
          <input type="number" min="0" value={ex.amount_kes}
            onChange={e => setEx(p => ({ ...p, amount_kes: parseFloat(e.target.value) }))}
            className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm mt-0.5" />
        </div>
        <div>
          <label className="text-xs text-gray-500">Flock (optional)</label>
          <select value={ex.flock_id || ''} onChange={e => setEx(p => ({ ...p, flock_id: e.target.value || null }))}
            className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm mt-0.5 bg-white">
            <option value="">Farm-wide</option>
            {flocks.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="text-xs text-gray-500">Description</label>
          <input value={ex.description || ''} onChange={e => setEx(p => ({ ...p, description: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm mt-0.5" />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSave(ex)} className="bg-green-700 text-white rounded-lg px-4 py-1.5 text-sm font-medium">Save</button>
        <button onClick={onCancel} className="border border-gray-300 rounded-lg px-4 py-1.5 text-sm text-gray-600">Cancel</button>
      </div>
    </div>
  )
}
