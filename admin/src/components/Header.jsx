import { useLocation } from 'react-router-dom'
import { Bell, Search, Globe, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const pageTitles = {
  '/': 'Dashboard',
  '/booths': 'Booths',
  '/booth-agents': 'Booth Agents',
  '/voters': 'Voters',
  '/phases': 'Phases',
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
  const now = new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-white border-b border-[#E8ECF4] flex items-center px-6 z-40 gap-4">
      {/* Page Title */}
      <h1 className="text-slate-800 font-semibold text-[15px] whitespace-nowrap min-w-[120px]">{title}</h1>

      {/* Search */}
      <div className="flex-1 max-w-md relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search booths, voters, agents..."
          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B5CEB]/20 focus:border-[#5B5CEB]/50 transition-all"
        />
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Last updated */}
        <span className="text-[11px] text-slate-400 hidden xl:block mr-2">Updated {now}</span>

        {/* Language */}
        <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 text-[12px] hover:bg-slate-50 transition-colors">
          <Globe size={13} />
          EN
          <ChevronDown size={11} />
        </button>

        {/* Notifications */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell size={17} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: '#5B5CEB' }} />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-200 mx-1" />

        {/* User */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: '#5B5CEB' }}>
            {user?.name?.[0] ?? 'A'}
          </div>
          <div className="hidden sm:block">
            <p className="text-slate-700 text-xs font-semibold leading-tight">{user?.name ?? 'Admin'}</p>
            <p className="text-slate-400 text-[10px]">Super Admin</p>
          </div>
        </div>
      </div>
    </header>
  )
}
