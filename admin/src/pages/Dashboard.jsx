import { ChevronDown, RefreshCw } from 'lucide-react'
import KPIGrid from '../components/dashboard/KPIGrid'
import ChartsRow1 from '../components/dashboard/ChartsRow1'
import TablesRow2 from '../components/dashboard/TablesRow2'
import ChartsRow3 from '../components/dashboard/ChartsRow3'
import BottomSection from '../components/dashboard/BottomSection'

function FilterBtn({ label, value }) {
  return (
    <button className="flex flex-col items-start px-4 py-2.5 bg-white border border-[#E8ECF4] rounded-xl hover:border-[#5B5CEB]/40 hover:shadow-sm transition-all group">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</span>
      <div className="flex items-center gap-1.5 mt-0.5">
        <span className="text-slate-800 text-[13px] font-semibold">{value}</span>
        <ChevronDown size={13} className="text-slate-400 group-hover:text-[#5B5CEB] transition-colors" />
      </div>
    </button>
  )
}

export default function Dashboard() {
  return (
    <div className="-m-6">
      {/* Filters Bar */}
      <div className="px-6 py-3 bg-white border-b border-[#E8ECF4] flex items-center gap-3 flex-wrap">
        <FilterBtn label="Campaign" value="Election 2027 – Rishikesh" />
        <FilterBtn label="Phase" value="Phase 2" />
        <FilterBtn label="Date Range" value="01 May 2024 – 31 May 2024" />
        <div className="ml-auto flex items-center gap-1.5 text-[11px] text-slate-400">
          <RefreshCw size={12} />
          Synced 2 min ago
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="p-6 space-y-6 min-h-screen" style={{ background: '#F5F7FB' }}>
        <KPIGrid />
        <ChartsRow1 />
        <TablesRow2 />
        <ChartsRow3 />
        <BottomSection />
      </div>
    </div>
  )
}
