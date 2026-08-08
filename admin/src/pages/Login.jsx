import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, ArrowRight, ShieldCheck, BarChart3, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const FEATURES = [
  { icon: Users,       title: 'Booth Management',  desc: 'Manage agents across all booths in real time' },
  { icon: BarChart3,   title: 'Live Analytics',     desc: 'Survey results and voter data at a glance' },
  { icon: ShieldCheck, title: 'Secure & Reliable',  desc: 'Role-based access with end-to-end data sync' },
]

export default function Login() {
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error,        setError]        = useState('')
  const [loading,      setLoading]      = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Please enter your email and password.'); return }
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      const code = err?.code || ''
      if (code.includes('invalid-credential') || code.includes('user-not-found') || code.includes('wrong-password')) {
        setError('Invalid email or password.')
      } else if (code.includes('too-many-requests')) {
        setError('Too many attempts. Please wait a moment.')
      } else {
        setError('Sign in failed. Please check your credentials.')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#F6F7FB' }}>

      {/* ── Left: Brand panel ─────────────────────────────────────────────── */}
      <div className="hidden lg:flex w-[480px] xl:w-[540px] flex-shrink-0 flex-col relative overflow-hidden"
        style={{ background: 'linear-gradient(155deg, #1a1b4b 0%, #0D0E2E 55%, #13143D 100%)' }}>

        {/* Grid overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Glow blobs */}
        <div className="absolute top-[-80px] left-[-80px] w-[400px] h-[400px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #5B5CEB, transparent 70%)' }} />
        <div className="absolute bottom-[-100px] right-[-60px] w-[360px] h-[360px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #818CF8, transparent 70%)' }} />

        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-auto">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #5B5CEB, #818CF8)' }}>
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-white font-bold text-xl tracking-widest">CAST</span>
          </div>

          {/* Hero text */}
          <div className="py-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8 text-xs font-semibold"
              style={{ background: 'rgba(91,92,235,0.25)', color: '#A5B4FC', border: '1px solid rgba(91,92,235,0.4)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Election 2027 · Live
            </div>
            <h1 className="text-white font-bold leading-tight mb-5"
              style={{ fontSize: '36px', letterSpacing: '-0.5px' }}>
              Election Survey<br />
              <span style={{ background: 'linear-gradient(90deg, #818CF8, #C4B5FD)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Management
              </span><br />
              Platform
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '15px', lineHeight: '1.7', maxWidth: '320px' }}>
              Coordinate booth agents, track voters, and monitor survey data in real time across all constituencies.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-4 mb-16">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(91,92,235,0.2)', border: '1px solid rgba(91,92,235,0.3)' }}>
                  <Icon size={16} style={{ color: '#A5B4FC' }} />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{title}</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '2px' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>
            © {new Date().getFullYear()} CAST Platform · Secure Admin Access
          </p>
        </div>
      </div>

      {/* ── Right: Login form ─────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-[400px] animate-fade-in">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #5B5CEB, #818CF8)' }}>
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-bold text-xl" style={{ color: '#0D1117', letterSpacing: '2px' }}>CAST</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="font-bold mb-2" style={{ fontSize: '26px', color: '#0D1117', letterSpacing: '-0.3px' }}>
              Welcome back
            </h2>
            <p style={{ color: '#6B7280', fontSize: '14px' }}>Sign in to access the admin portal</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#374151' }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@cast.com"
                className="inp"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#374151' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="inp pr-11"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#9CA3AF' }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium"
                style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary mt-2 h-11 font-semibold group"
              style={{ background: loading ? '#9DA3F0' : 'linear-gradient(135deg, #5B5CEB, #6B6CF0)', boxShadow: '0 4px 14px rgba(91,92,235,0.35)' }}
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Signing in…</>
              ) : (
                <>Sign in <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-7">
            <div className="flex-1 h-px" style={{ background: '#E3E7F1' }} />
            <span style={{ color: '#9CA3AF', fontSize: '12px' }}>Admin access only</span>
            <div className="flex-1 h-px" style={{ background: '#E3E7F1' }} />
          </div>

          {/* Info note */}
          <div className="flex items-center gap-2.5 p-3.5 rounded-lg" style={{ background: '#EDEDFD', border: '1px solid #D9D9FB' }}>
            <ShieldCheck size={15} style={{ color: '#5B5CEB', flexShrink: 0 }} />
            <p style={{ color: '#4748D4', fontSize: '12px', lineHeight: '1.5' }}>
              This portal is restricted to authorised administrators. Contact your system admin for access.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
