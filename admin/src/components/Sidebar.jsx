import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  MapPin,
  Users,
  UserCheck,
  ClipboardList,
  ClipboardCheck,
  MessageSquare,
  BarChart2,
  Target,
  UserCog,
  Settings,
  LogOut,
  Vote,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navGroups = [
  {
    label: 'Main',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    ],
  },
  {
    label: 'Management',
    items: [
      { icon: MapPin, label: 'Booths', path: '/booths' },
      { icon: Users, label: 'Booth Agents', path: '/booth-agents' },
      { icon: UserCheck, label: 'Voters', path: '/voters' },
    ],
  },
  {
    label: 'Survey',
    items: [
      { icon: ClipboardList, label: 'Surveys', path: '/surveys' },
      { icon: ClipboardCheck, label: 'Assign Surveys', path: '/assign-surveys' },
      { icon: MessageSquare, label: 'Responses', path: '/responses' },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { icon: BarChart2, label: 'Reports', path: '/reports' },
      { icon: Target, label: 'KPI Management', path: '/kpi' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { icon: UserCog, label: 'Users', path: '/users' },
      { icon: Settings, label: 'Settings', path: '/settings' },
    ],
  },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 flex flex-col z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700/50">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
          <Vote size={18} className="text-white" />
        </div>
        <div>
          <span className="text-white font-bold text-lg tracking-wide">CAST</span>
          <p className="text-slate-400 text-[10px] uppercase tracking-widest">Admin Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-6">
            <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest px-3 mb-2">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(({ icon: Icon, label, path }) => (
                <li key={path}>
                  <NavLink
                    to={path}
                    end={path === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`
                    }
                  >
                    <Icon size={17} />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-slate-700/50 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.[0] ?? 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name ?? 'Admin'}</p>
            <p className="text-slate-500 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg text-sm transition-colors"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
