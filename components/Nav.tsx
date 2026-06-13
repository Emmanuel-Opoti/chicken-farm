'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ClipboardList, CalendarDays, Users,
  ShoppingCart, Archive, BarChart2, BookOpen, FileText, HelpCircle, Menu, X, Home
} from 'lucide-react'
import { useState } from 'react'

const links = [
  { href: '/welcome',    label: 'Welcome',    icon: Home },
  { href: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/daily',      label: 'Daily Log',  icon: ClipboardList },
  { href: '/calendar',   label: 'Calendar',   icon: CalendarDays },
  { href: '/analytics',  label: 'Analytics',  icon: BarChart2 },
  { href: '/clients',    label: 'Clients',    icon: Users },
  { href: '/sales',      label: 'Sales',      icon: ShoppingCart },
  { href: '/registry',   label: 'Registry',   icon: Archive },
  { href: '/reports',    label: 'Reports',    icon: FileText },
  { href: '/sop',        label: 'SOP',        icon: BookOpen },
  { href: '/help',       label: 'Help',       icon: HelpCircle },
]

export default function Nav() {
  const path = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-green-700 text-white flex items-center justify-between px-4 h-14 shadow-md md:hidden">
        <span className="font-bold text-sm leading-tight">Wandera Retirement Chicken Business</span>
        <button onClick={() => setOpen(!open)} className="p-2">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setOpen(false)}>
          <div className="w-64 h-full bg-white shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="bg-green-700 text-white px-4 py-4">
              <p className="font-bold text-base leading-tight">Wandera Retirement</p>
              <p className="font-bold text-base leading-tight">Chicken Business</p>
            </div>
            <nav className="flex flex-col p-2 gap-1 flex-1">
              {links.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors
                    ${path.startsWith(href) ? 'bg-green-100 text-green-800' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <Icon size={20} />
                  {label}
                </Link>
              ))}
            </nav>
            <p className="text-center text-xs text-gray-400 py-3 border-t border-gray-100">
              Made with love by Emo
            </p>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen bg-white border-r border-gray-200 fixed top-0 left-0">
        <div className="bg-green-700 text-white px-4 py-4">
          <p className="font-bold text-sm leading-snug">Wandera Retirement</p>
          <p className="font-bold text-sm leading-snug">Chicken Business</p>
          <p className="text-green-300 text-xs mt-1">Dashboard</p>
        </div>
        <nav className="flex flex-col p-2 gap-1 mt-2 flex-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                ${path.startsWith(href) ? 'bg-green-100 text-green-800' : 'text-gray-700 hover:bg-gray-100'}`}>
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <p className="text-center text-xs text-gray-400 py-3 border-t border-gray-100">
          Made with love by Emo
        </p>
      </aside>
    </>
  )
}
