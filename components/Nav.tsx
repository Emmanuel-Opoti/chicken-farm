'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, ClipboardList, CalendarDays, Users,
  ShoppingCart, Archive, BarChart2, BookOpen, FileText, HelpCircle,
  Menu, X, Home, BookMarked, LogOut, Sun, Moon, Receipt
} from 'lucide-react'
import { useState } from 'react'

const links = [
  { href: '/welcome',   label: 'Welcome',     icon: Home },
  { href: '/dashboard', label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/daily',     label: 'Daily Log',   icon: ClipboardList },
  { href: '/calendar',  label: 'Calendar',    icon: CalendarDays },
  { href: '/analytics', label: 'Analytics',   icon: BarChart2 },
  { href: '/clients',   label: 'Clients',     icon: Users },
  { href: '/sales',     label: 'Sales',       icon: ShoppingCart },
  { href: '/registry',  label: 'Registry',    icon: Archive },
  { href: '/reports',   label: 'Reports',     icon: FileText },
  { href: '/expenses',  label: 'Expenses',    icon: Receipt },
  { href: '/sop',       label: 'SOP',         icon: BookOpen },
  { href: '/help',      label: 'Help',        icon: HelpCircle },
  { href: '/manual',    label: 'User Manual', icon: BookMarked },
]

async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' })
  window.location.href = '/login'
}

interface NavProps {
  isDark: boolean
  toggleTheme: () => void
}

export default function Nav({ isDark, toggleTheme }: NavProps) {
  const path = usePathname()
  const [open, setOpen] = useState(false)

  const ThemeButton = () => (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors text-gray-700 hover:bg-gray-100">
      {isDark
        ? <Sun size={18} className="text-yellow-400" />
        : <Moon size={18} className="text-gray-500" />}
      {isDark ? 'Light Mode' : 'Dark Mode'}
    </button>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-green-700 text-white flex items-center justify-between px-4 h-14 shadow-md md:hidden">
        <span className="font-bold text-sm leading-tight">Wandera Retirement Chicken Business</span>
        <div className="flex items-center gap-1">
          <button onClick={toggleTheme} className="p-2 rounded-lg">
            {isDark
              ? <Sun size={20} className="text-yellow-300" />
              : <Moon size={20} className="text-green-200" />}
          </button>
          <button onClick={() => setOpen(!open)} className="p-2">
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setOpen(false)}>
          <div className="w-64 h-full bg-white shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="bg-green-700 text-white px-4 py-4">
              <p className="font-bold text-base leading-tight">Wandera Retirement</p>
              <p className="font-bold text-base leading-tight">Chicken Business</p>
            </div>
            <nav className="flex flex-col p-2 gap-1 flex-1 overflow-y-auto">
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
            <div className="border-t border-gray-100 p-2">
              <ThemeButton />
              <button onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                <LogOut size={20} />
                Sign Out
              </button>
              <p className="text-center text-xs text-gray-400 py-2">Made with love by Emo</p>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen bg-white border-r border-gray-200 fixed top-0 left-0">
        <div className="bg-green-700 text-white px-4 py-4">
          <p className="font-bold text-sm leading-snug">Wandera Retirement</p>
          <p className="font-bold text-sm leading-snug">Chicken Business</p>
          <p className="text-green-300 text-xs mt-1">Farm Manager</p>
        </div>
        <nav className="flex flex-col p-2 gap-1 mt-2 flex-1 overflow-y-auto">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                ${path.startsWith(href) ? 'bg-green-100 text-green-800' : 'text-gray-700 hover:bg-gray-100'}`}>
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-gray-100 p-2">
          <ThemeButton />
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
            <LogOut size={18} />
            Sign Out
          </button>
          <p className="text-center text-xs text-gray-400 py-2">Made with love by Emo</p>
        </div>
      </aside>
    </>
  )
}
