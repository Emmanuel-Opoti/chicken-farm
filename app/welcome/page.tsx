'use client'
import Link from 'next/link'
import {
  LayoutDashboard, ClipboardList, CalendarDays, BarChart2,
  Users, ShoppingCart, Archive, FileText, BookOpen, HelpCircle
} from 'lucide-react'

const modules = [
  {
    href: '/dashboard',
    icon: LayoutDashboard,
    color: 'bg-green-700',
    title: 'Dashboard',
    summary: 'Your daily command centre.',
    points: [
      'See today\'s egg count, feed cost, total birds, and monthly revenue at a glance',
      'Get alerted when input prices haven\'t been reviewed in over 30 days',
      'Get alerted when a vaccination is overdue',
      'Quick-tap buttons to jump straight to Daily Log or record a sale',
    ],
  },
  {
    href: '/daily',
    icon: ClipboardList,
    color: 'bg-yellow-500',
    title: 'Daily Log',
    summary: 'Record what happens every day.',
    points: [
      'Log eggs collected — app auto-calculates trays (12 eggs = 1 tray) and loose eggs',
      'Log broken eggs separately',
      'Log feed used — select feed type, enter kg; cost is calculated automatically',
      'Log water given in litres',
      'Phase banner shows current Starter / Grower / Layer phase for the selected flock',
      'Recommended feed type and quantity pre-filled based on flock age and bird count',
      'Edit or delete any record if a mistake was made',
    ],
  },
  {
    href: '/calendar',
    icon: CalendarDays,
    color: 'bg-teal-600',
    title: 'Calendar',
    summary: 'See the whole month at a glance.',
    points: [
      'Monthly grid — each day shows egg count and feed cost if data exists',
      'Tap any day to see the full detail for that date',
      'Navigate month by month with arrow buttons',
      'Tap "Today" to return to the current month instantly',
    ],
  },
  {
    href: '/analytics',
    icon: BarChart2,
    color: 'bg-blue-600',
    title: 'Analytics',
    summary: 'Understand trends over time.',
    points: [
      'Line chart: daily egg output over the last 7, 30, or 90 days',
      'Bar chart: revenue vs feed cost side by side — green is money in, red is money out',
      'Scatter chart: see whether more feed spending is producing more eggs',
      'Switch time period with one tap (7d / 30d / 90d)',
    ],
  },
  {
    href: '/clients',
    icon: Users,
    color: 'bg-purple-600',
    title: 'Clients',
    summary: 'Manage who you sell to.',
    points: [
      'Add clients with name, phone number, location, and standard delivery cost',
      'Active clients appear in the Sales dropdown automatically',
      'Deactivate a client to hide them from sales without losing their history',
    ],
  },
  {
    href: '/sales',
    icon: ShoppingCart,
    color: 'bg-indigo-600',
    title: 'Sales',
    summary: 'Record every egg sold.',
    points: [
      'Client Sale: record a tray delivery — select client, eggs, price per egg, delivery cost',
      'Ad-hoc Sale: record a small walk-in purchase under one tray, no client needed',
      'Total is calculated before saving so you can confirm the amount',
      'History tab: view all past sales, mark client sales as paid',
      'Edit or delete any sale if a mistake was made',
    ],
  },
  {
    href: '/registry',
    icon: Archive,
    color: 'bg-amber-600',
    title: 'Registry',
    summary: 'The foundation the rest of the app builds on.',
    points: [
      'Add flocks — name, date received, number of birds, age at receipt in weeks',
      'App calculates current age and phase (Starter / Grower / Layer) automatically',
      'Each flock card shows recommended feed type, rate per bird, and expected daily kg',
      'Inputs & Prices: track current prices for feeds, vaccines, and medicines',
      'Amber warning appears when a price hasn\'t been reviewed in 30 days',
      'Price history is recorded every time you update a price',
      'Deactivate retired flocks or permanently delete a flock entered by mistake',
    ],
  },
  {
    href: '/reports',
    icon: FileText,
    color: 'bg-rose-600',
    title: 'Reports',
    summary: 'Automatic summaries, no setup needed.',
    points: [
      'Six auto-generated reports: This Week, Last Week, This Month, Last Month, This Year, Last Year',
      'Each report shows: total eggs, feed cost, vaccine cost, client sales, ad-hoc sales, total revenue',
      'Net profit calculated automatically (revenue minus all costs)',
      'Reports update in real time as you add new records',
    ],
  },
  {
    href: '/sop',
    icon: BookOpen,
    color: 'bg-green-800',
    title: 'SOP',
    summary: 'The Kenchic standard layer programme in your pocket.',
    points: [
      'Full vaccination schedule: Marek\'s, Newcastle, Gumboro, Fowl Typhoid, and more — with method and timing notes',
      'Select a flock and tap Generate Schedule to auto-create all vaccination dates from the chick receipt date',
      'Feeding guide: correct feed type and daily rate for Starter, Grower, and Layer phases',
      'Water schedule with electrolyte guidance for stress periods',
      'Ongoing Newcastle Disease booster reminder every 3 months from week 19',
    ],
  },
  {
    href: '/help',
    icon: HelpCircle,
    color: 'bg-gray-600',
    title: 'Help',
    summary: 'Answers to common questions, always available.',
    points: [
      'Search bar — type any question to find an answer instantly',
      'Browse by section: Daily Log, Dashboard, Registry, Sales, Clients, Calendar, Analytics, Reports, SOP',
      'Getting Started checklist for first-time setup',
      'Explains how to correct mistakes (edit and delete) across all modules',
    ],
  },
]

export default function Welcome() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome to Wandera Farm</h1>
        <p className="text-gray-500 text-sm">A quick guide to every module and what it does</p>
      </div>

      <div className="space-y-4">
        {modules.map(({ href, icon: Icon, color, title, summary, points }) => (
          <Link key={href} href={href}
            className="block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:border-green-200 transition-colors">
            <div className="flex items-center gap-4 p-4 border-b border-gray-50">
              <div className={`p-2.5 rounded-xl ${color} shrink-0`}>
                <Icon size={20} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900">{title}</p>
                <p className="text-sm text-gray-500">{summary}</p>
              </div>
              <span className="ml-auto text-gray-300 text-lg shrink-0">›</span>
            </div>
            <ul className="px-5 py-3 space-y-1.5">
              {points.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-green-500 mt-0.5 shrink-0">•</span>
                  {p}
                </li>
              ))}
            </ul>
          </Link>
        ))}
      </div>
    </div>
  )
}
