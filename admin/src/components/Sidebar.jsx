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

const sidebarStyles = `
  .sb-nav-link {
    position: relative;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 500;
    color: rgba(210,213,235,0.6);
    text-decoration: none;
    transition: color 0.18s ease, background 0.18s ease;
    overflow: hidden;
    cursor: pointer;
    user-select: none;
  }
  .sb-nav-link::before {
    content: '';
    position: absolute;
    left: 0; top: 50%;
    transform: translateY(-50%) scaleY(0);
    width: 3px;
    height: 60%;
    border-radius: 0 3px 3px 0;
    background: #5B5CEB;
    transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
  }
  .sb-nav-link .sb-icon {
    flex-shrink: 0;
    transition: transform 0.18s ease, color 0.18s ease;
    color: rgba(210,213,235,0.45);
  }
  .sb-nav-link:hover {
    color: rgba(210,213,235,0.95);
    background: rgba(255,255,255,0.055);
  }
  .sb-nav-link:hover .sb-icon {
    transform: scale(1.12);
    color: rgba(210,213,235,0.85);
  }
  .sb-nav-link.active {
    color: #c7c8f8;
    background: rgba(91,92,235,0.14);
    font-weight: 600;
  }
  .sb-nav-link.active::before {
    transform: translateY(-50%) scaleY(1);
  }
  .sb-nav-link.active .sb-icon {
    color: #818CF8;
    transform: scale(1.05);
  }

  .sb-poll-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 11px 16px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 700;
    color: #fff;
    text-decoration: none;
    background: linear-gradient(135deg, #5B5CEB 0%, #7C7DFA 100%);
    box-shadow: 0 4px 20px rgba(91,92,235,0.45);
    transition: transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease;
    letter-spacing: 0.01em;
  }
  .sb-poll-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 7px 26px rgba(91,92,235,0.6);
    filter: brightness(1.07);
  }
  .sb-poll-btn:active {
    transform: translateY(0);
    box-shadow: 0 3px 14px rgba(91,92,235,0.4);
  }
  .sb-poll-btn.active {
    filter: brightness(0.9);
    box-shadow: 0 2px 10px rgba(91,92,235,0.35);
  }

  .sb-logout {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 12px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 600;
    color: rgba(210,213,235,0.35);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: color 0.15s ease, background 0.15s ease;
    text-align: left;
  }
  .sb-logout:hover {
    color: #F87171;
    background: rgba(239,68,68,0.1);
  }

  .sb-scroll::-webkit-scrollbar { display: none; }
  .sb-scroll { scrollbar-width: none; }
`

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <>
      <style>{sidebarStyles}</style>
      <aside
        className="fixed left-0 top-0 h-screen w-64 flex flex-col z-50"
        style={{
          background: 'linear-gradient(180deg, #0A0C22 0%, #080B1E 100%)',
          borderRight: '1px solid rgba(255,255,255,0.055)',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-5 flex-shrink-0"
          style={{
            height: 64,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: 36, height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #5B5CEB 0%, #818CF8 100%)',
              boxShadow: '0 4px 16px rgba(91,92,235,0.5)',
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" width={17} height={17}>
              <path
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <p style={{ color: '#fff', fontWeight: 800, fontSize: 14, letterSpacing: '0.2em', lineHeight: 1.2 }}>CAST</p>
            <p style={{ color: 'rgba(210,213,235,0.28)', fontWeight: 600, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
              Admin Portal
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="sb-scroll flex-1 overflow-y-auto" style={{ padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {navGroups.map((group) => (
            <div key={group.label} style={{ marginBottom: 20 }}>
              <p style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.16em',
                color: 'rgba(210,213,235,0.22)',
                padding: '0 12px',
                marginBottom: 4,
              }}>
                {group.label}
              </p>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {group.items.map(({ icon: Icon, label, path }) => (
                  <li key={path}>
                    <NavLink
                      to={path}
                      end={path === '/'}
                      className={({ isActive }) => `sb-nav-link${isActive ? ' active' : ''}`}
                    >
                      <Icon size={15} className="sb-icon" />
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Voting Day Poll CTA */}
        <div style={{ padding: '0 10px 10px' }}>
          <NavLink
            to="/voting-day-poll"
            className={({ isActive }) => `sb-poll-btn${isActive ? ' active' : ''}`}
          >
            <Radio size={15} />
            Voting Day Poll
          </NavLink>
        </div>

        {/* User section */}
        <div
          className="flex-shrink-0"
          style={{
            padding: '10px 10px 10px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div
            className="flex items-center gap-3"
            style={{
              padding: '9px 12px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.04)',
              marginBottom: 4,
            }}
          >
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: 32, height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #5B5CEB, #818CF8)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {(user?.name?.[0] ?? 'A').toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: '#E2E4F0', fontSize: 12, fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name ?? 'Admin'}
              </p>
              <p style={{ color: 'rgba(210,213,235,0.28)', fontSize: 10, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email ?? ''}
              </p>
            </div>
          </div>
          <button
            className="sb-logout"
            onClick={() => { logout(); navigate('/login') }}
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
