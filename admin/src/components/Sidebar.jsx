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
      { icon: Layers,         label: 'Phases',         path: '/phases' },
      { icon: ClipboardList,  label: 'Surveys',        path: '/surveys' },
      { icon: ClipboardCheck, label: 'Assign Surveys', path: '/assign-surveys' },
      { icon: MessageSquare,  label: 'Responses',      path: '/responses' },
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
    <aside
      className="fixed left-0 top-0 h-screen w-64 flex flex-col z-50"
      style={{ background: '#0B0D27', borderRight: '1px solid rgba(255,255,255,0.05)' }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-5 h-[64px] flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #5B5CEB, #818CF8)', boxShadow: '0 4px 14px rgba(91,92,235,0.45)' }}
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-4.5 h-4.5 w-[18px] h-[18px]">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <p className="text-white font-bold text-sm tracking-[3px]">CAST</p>
          <p className="text-[9px] font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Admin Portal
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5"
        style={{ scrollbarWidth: 'none' }}>
        {navGroups.map((group) => (
          <div key={group.label} className="mb-5">
            <p
              className="text-[9px] font-bold uppercase tracking-[1.8px] px-3 mb-1.5"
              style={{ color: 'rgba(255,255,255,0.22)' }}
            >
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(({ icon: Icon, label, path }) => (
                <li key={path}>
                  <NavLink
                    to={path}
                    end={path === '/'}
                    className="flex items-center gap-3 px-3 py-[9px] rounded-xl text-[13px] font-medium transition-all duration-150"
                    style={({ isActive }) => ({
                      background: isActive ? 'rgba(91,92,235,0.18)' : 'transparent',
                      color: isActive ? '#818CF8' : 'rgba(255,255,255,0.45)',
                      borderLeft: isActive ? '2.5px solid #5B5CEB' : '2.5px solid transparent',
                    })}
                    onMouseEnter={e => {
                      if (!e.currentTarget.getAttribute('aria-current')) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                        e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
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
                        <Icon size={15} style={{ opacity: isActive ? 1 : 0.6, flexShrink: 0 }} />
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

      {/* Voting Day Poll — pinned CTA */}
      <div className="px-3 pb-3 flex-shrink-0">
        <NavLink
          to="/voting-day-poll"
          className="flex items-center justify-center gap-2.5 w-full py-3 rounded-2xl text-[13px] font-bold transition-all duration-150"
          style={({ isActive }) => ({
            background: isActive
              ? 'linear-gradient(135deg, #4748c4, #6366f1)'
              : 'linear-gradient(135deg, #5B5CEB, #818CF8)',
            color: '#fff',
            boxShadow: '0 4px 18px rgba(91,92,235,0.5)',
          })}
        >
          <Radio size={15} />
          Voting Day Poll
        </NavLink>
      </div>

      {/* User section */}
      <div className="px-3 pb-3 pt-2 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #5B5CEB, #818CF8)' }}
          >
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
