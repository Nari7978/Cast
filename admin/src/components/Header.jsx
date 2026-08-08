import { useLocation } from 'react-router-dom'
import { Bell, Search, Globe, ChevronDown, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const PAGE_META = {
  '/':               { title: 'Dashboard',       sub: 'Overview' },
  '/booths':         { title: 'Booths',           sub: 'Management' },
  '/booth-agents':   { title: 'Booth Agents',     sub: 'Management' },
  '/voters':         { title: 'Voters',           sub: 'Management' },
  '/phases':         { title: 'Phases',           sub: 'Survey' },
  '/surveys':        { title: 'Surveys',          sub: 'Survey' },
  '/assign-surveys': { title: 'Assign Surveys',   sub: 'Survey' },
  '/responses':      { title: 'Responses',        sub: 'Survey' },
  '/voting-day-poll':{ title: 'Voting Day Poll',  sub: 'Survey' },
  '/reports':        { title: 'Reports',          sub: 'Analytics' },
  '/kpi':            { title: 'KPI Management',   sub: 'Analytics' },
  '/users':          { title: 'Users',            sub: 'Admin' },
  '/settings':       { title: 'Settings',         sub: 'Admin' },
}

export default function Header() {
  const { pathname } = useLocation()
  const { user }     = useAuth()
  const meta = PAGE_META[pathname] ?? { title: 'CAST Admin', sub: 'Portal' }
  const now  = new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <header className="fixed top-0 left-64 right-0 h-[60px] flex items-center px-6 z-40 gap-4"
      style={{ background: 'rgba(246,247,251,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #E3E7F1' }}>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 min-w-fit">
        <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{meta.sub}</span>
        <ChevronRight size={12} style={{ color: '#D1D5DB' }} />
        <h1 className="font-bold text-sm" style={{ color: '#0D1117' }}>{meta.title}</h1>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-sm relative mx-4">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
        <input
          type="text"
          placeholder="Search anything…"
          className="w-full pl-9 pr-4 py-2 text-[13px] rounded-lg outline-none transition-all"
          style={{
            background: '#FFFFFF',
            border: '1px solid #E3E7F1',
            color: '#0D1117',
          }}
          onFocus={e => { e.target.style.borderColor = '#5B5CEB'; e.target.style.boxShadow = '0 0 0 3px #EDEDFD' }}
          onBlur={e  => { e.target.style.borderColor = '#E3E7F1'; e.target.style.boxShadow = 'none' }}
        />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1.5 ml-auto">

        {/* Timestamp */}
        <span className="text-[11px] hidden xl:block mr-3" style={{ color: '#9CA3AF' }}>
          Updated {now}
        </span>

        {/* Language */}
        <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold transition-colors"
          style={{ color: '#6B7280', border: '1px solid #E3E7F1', background: '#FFFFFF' }}>
          <Globe size={12} />
          EN
          <ChevronDown size={10} />
        </button>

        {/* Notifications */}
        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
          style={{ color: '#6B7280' }}
          onMouseEnter={e => e.currentTarget.style.background = '#F0F2F8'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <Bell size={16} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: '#5B5CEB', border: '1.5px solid #F6F7FB' }} />
        </button>

        {/* Divider */}
        <div className="w-px h-5 mx-1" style={{ background: '#E3E7F1' }} />

        {/* User pill */}
        <div className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-xl cursor-pointer transition-colors"
          style={{ border: '1px solid #E3E7F1', background: '#FFFFFF' }}
          onMouseEnter={e => e.currentTarget.style.background = '#F0F2F8'}
          onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #5B5CEB, #818CF8)' }}>
            {(user?.name?.[0] ?? 'A').toUpperCase()}
          </div>
          <div className="hidden sm:block leading-tight">
            <p className="text-xs font-bold" style={{ color: '#0D1117' }}>{user?.name ?? 'Admin'}</p>
            <p className="text-[10px] font-medium" style={{ color: '#9CA3AF' }}>Super Admin</p>
          </div>
        </div>
      </div>
    </header>
  )
}
