import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, MapPin, Users, UserCheck, Layers,
  ClipboardList, ClipboardCheck, MessageSquare, Radio,
  BarChart2, Target, UserCog, Settings, LogOut,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navGroups = [
  {
    label: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    ],
  },
  {
    label: 'Management',
    items: [
      { icon: MapPin,    label: 'Booths',       path: '/booths' },
      { icon: Users,     label: 'Booth Agents', path: '/booth-agents' },
      { icon: UserCheck, label: 'Voters',       path: '/voters' },
    ],
  },
  {
    label: 'Survey',
    items: [
      { icon: Layers,         label: 'Phases',          path: '/phases' },
      { icon: ClipboardList,  label: 'Surveys',         path: '/surveys' },
      { icon: ClipboardCheck, label: 'Assign Surveys',  path: '/assign-surveys' },
      { icon: MessageSquare,  label: 'Responses',       path: '/responses' },
      { icon: Radio,          label: 'Voting Day Poll', path: '/voting-day-poll' },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { icon: BarChart2, label: 'Reports',        path: '/reports' },
      { icon: Target,    label: 'KPI Management', path: '/kpi' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { icon: UserCog,  label: 'Users',    path: '/users' },
      { icon: Settings, label: 'Settings', path: '/settings' },
    ],
  },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col z-50"
      style={{ background: '#0B0D27', borderRight: '1px solid rgba(255,255,255,0.05)' }}>

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-[60px] flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #5B5CEB, #818CF8)' }}>
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <p className="text-white font-bold text-sm tracking-[3px]">CAST</p>
          <p className="text-[9px] font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>Admin Portal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="text-[9px] font-bold uppercase tracking-[1.5px] px-3 mb-2"
              style={{ color: 'rgba(255,255,255,0.2)' }}>
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(({ icon: Icon, label, path }) => (
                <li key={path}>
                  <NavLink
                    to={path}
                    end={path === '/'}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 group"
                    style={({ isActive }) => ({
                      background: isActive ? 'rgba(91,92,235,0.9)' : 'transparent',
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                      boxShadow: isActive ? '0 2px 12px rgba(91,92,235,0.4)' : 'none',
                    })}
                    onMouseEnter={e => {
                      if (!e.currentTarget.classList.contains('active')) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                        e.currentTarget.style.color = 'rgba(255,255,255,0.75)'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!e.currentTarget.getAttribute('aria-current')) {
                        e.currentTarget.style.background = ''
                        e.currentTarget.style.color = ''
                      }
                    }}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon size={15} style={{ opacity: isActive ? 1 : 0.7, flexShrink: 0 }} />
                        {label}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1"
          style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #5B5CEB, #818CF8)' }}>
            {(user?.name?.[0] ?? 'A').toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-bold truncate">{user?.name ?? 'Admin'}</p>
            <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{user?.email ?? ''}</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate('/login') }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-semibold transition-colors"
          style={{ color: 'rgba(255,255,255,0.3)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.color = '#F87171' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)' }}
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
