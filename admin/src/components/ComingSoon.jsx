import { Construction } from 'lucide-react'

export default function ComingSoon({ title }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
        <Construction size={28} className="text-indigo-400" />
      </div>
      <h2 className="text-slate-700 text-xl font-semibold mb-2">{title}</h2>
      <p className="text-slate-400 text-sm">This section is under construction. Coming soon.</p>
    </div>
  )
}
