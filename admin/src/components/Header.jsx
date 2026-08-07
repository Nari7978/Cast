import { useLocation } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const pageTitles = {
  '/': 'Dashboard',
  '/booths': 'Booths',
  '/booth-agents': 'Booth Agents',
  '/voters': 'Voters',
  '/surveys': 'Surveys',
  '/assign-surveys': 'Assign Surveys',
  '/responses': 'Responses',
  '/reports': 'Reports',
  '/kpi': 'KPI Management',
  '/users': 'Users',
  '/settings': 'Settings',
}

export default function Header() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const title = pageTitles[pathname] ?? 'Cast Admin'

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-40">
      <div>
        <h1 className="text-slate-800 font-semibold text-lg">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.[0] ?? 'A'}
          </div>
          <span className="text-slate-700 text-sm font-medium hidden sm:block">{user?.name ?? 'Admin'}</span>
        </div>
      </div>
    </header>
  )
}
