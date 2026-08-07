import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, MapPin, Users, UserCheck, Layers,
  ClipboardList, ClipboardCheck, MessageSquare,
  BarChart2, Target, UserCog, Settings, LogOut, Vote,
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
      { icon: MapPin,      label: 'Booths',       path: '/booths' },
      { icon: Users,       label: 'Booth Agents', path: '/booth-agents' },
      { icon: UserCheck,   label: 'Voters',        path: '/voters' },
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
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col z-50" style={{ background: '#0B1228' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#5B5CEB' }}>
          <Vote size={17} className="text-white" />
        </div>
        <div>
          <span className="text-white font-bold text-base tracking-widest">CAST</span>
          <p className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Admin Portal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-1.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(({ icon: Icon, label, path }) => (
                <li key={path}>
                  <NavLink
                    to={path}
                    end={path === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                        isActive
                          ? 'text-white'
                          : 'hover:text-white'
                      }`
                    }
                    style={({ isActive }) => ({
                      background: isActive ? '#5B5CEB' : 'transparent',
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
                      boxShadow: isActive ? '0 4px 14px rgba(91,92,235,0.35)' : 'none',
                    })}
                  >
                    <Icon size={16} />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: '#5B5CEB' }}>
            {user?.name?.[0] ?? 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user?.name ?? 'Admin'}</p>
            <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate('/login') }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-colors hover:bg-red-500/10 hover:text-red-400"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
