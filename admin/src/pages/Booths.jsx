import { useState, useMemo } from 'react'
import {
  Search, Plus, Upload, Download, MapPin, Users, UserCheck,
  AlertCircle, Eye, Edit2, Trash2, X, ChevronDown,
  Building2, Phone, ChevronLeft, ChevronRight,
} from 'lucide-react'

// ── Mock Data ──────────────────────────────────────────────────────────────────

const STATIONS = [
  { id: 1,  name: 'Atal Utkrisht Rajkiya Inter College',    location: 'Rishikesh',      boothCount: 4, voters: 4807, status: 'Active'  },
  { id: 2,  name: 'Govt. Primary School Muni Ki Reti',       location: 'Muni Ki Reti',   boothCount: 5, voters: 5243, status: 'Active'  },
  { id: 3,  name: 'Saraswati Vidya Mandir',                  location: 'Tapovan',        boothCount: 4, voters: 4215, status: 'Active'  },
  { id: 4,  name: 'Rajkiya Inter College Rishikesh',         location: 'Rishikesh',      boothCount: 6, voters: 6840, status: 'Active'  },
  { id: 5,  name: 'Government Girls Inter College',          location: 'Haridwar Road',  boothCount: 3, voters: 3120, status: 'Active'  },
  { id: 6,  name: 'Primary School Lakshman Jhula',           location: 'Lakshman Jhula', boothCount: 4, voters: 4560, status: 'Active'  },
  { id: 7,  name: 'Nehru Smarak Vidyalaya',                  location: 'Dehradun Road',  boothCount: 5, voters: 5890, status: 'Pending' },
  { id: 8,  name: 'Municipal Corporation School',            location: 'City Centre',    boothCount: 3, voters: 3450, status: 'Active'  },
  { id: 9,  name: 'Shri Ram Primary School',                 location: 'Ram Jhula',      boothCount: 4, voters: 4120, status: 'Active'  },
  { id: 10, name: 'Kendriya Vidyalaya No. 1',                location: 'Dehradun Road',  boothCount: 5, voters: 5670, status: 'Active'  },
]

const BOOTHS = {
  1: [
    { id: 101, number: 1,  name: 'Chidderwala Part-1',    voters: 1245, agent: 'Ramesh Kumar',    phone: '+91 98765 43210', phase: 'Phase 2', status: 'Active',   created: '01 Jan 2024', updated: '2 hrs ago'  },
    { id: 102, number: 2,  name: 'Chidderwala Part-2',    voters: 1198, agent: 'Mohan Verma',     phone: '+91 98765 43211', phase: 'Phase 2', status: 'Active',   created: '01 Jan 2024', updated: '3 hrs ago'  },
    { id: 103, number: 3,  name: 'Chidderwala Part-3',    voters: 1210, agent: 'Sita Devi',       phone: '+91 98765 43212', phase: 'Phase 2', status: 'Pending',  created: '01 Jan 2024', updated: '1 day ago'  },
    { id: 104, number: 4,  name: 'Chidderwala Part-4',    voters: 1154, agent: 'Vikram Singh',    phone: '+91 98765 43213', phase: 'Phase 2', status: 'Active',   created: '01 Jan 2024', updated: '5 hrs ago'  },
  ],
  2: [
    { id: 201, number: 5,  name: 'Muni Ki Reti Part-1',   voters: 1043, agent: 'Priya Sharma',   phone: '+91 98765 43214', phase: 'Phase 2', status: 'Active',   created: '01 Jan 2024', updated: '1 hr ago'   },
    { id: 202, number: 6,  name: 'Muni Ki Reti Part-2',   voters: 1087, agent: 'Anjali Singh',   phone: '+91 98765 43215', phase: 'Phase 2', status: 'Active',   created: '01 Jan 2024', updated: '4 hrs ago'  },
    { id: 203, number: 7,  name: 'Muni Ki Reti Part-3',   voters: 1056, agent: 'Deepak Negi',    phone: '+91 98765 43216', phase: 'Phase 2', status: 'Active',   created: '01 Jan 2024', updated: '6 hrs ago'  },
    { id: 204, number: 8,  name: 'Muni Ki Reti Part-4',   voters: 1024, agent: null,             phone: null,              phase: 'Phase 2', status: 'Pending',  created: '01 Jan 2024', updated: '2 days ago' },
    { id: 205, number: 9,  name: 'Muni Ki Reti Part-5',   voters: 1033, agent: 'Suresh Rawat',   phone: '+91 98765 43217', phase: 'Phase 2', status: 'Active',   created: '01 Jan 2024', updated: '3 hrs ago'  },
  ],
  3: [
    { id: 301, number: 10, name: 'Tapovan Area Part-1',   voters: 1045, agent: 'Kavita Bhatt',   phone: '+91 98765 43218', phase: 'Phase 2', status: 'Active',   created: '01 Jan 2024', updated: '7 hrs ago'  },
    { id: 302, number: 11, name: 'Tapovan Area Part-2',   voters: 1098, agent: null,             phone: null,              phase: 'Phase 2', status: 'Pending',  created: '01 Jan 2024', updated: '3 days ago' },
    { id: 303, number: 12, name: 'Tapovan Area Part-3',   voters: 1034, agent: 'Mahesh Joshi',   phone: '+91 98765 43219', phase: 'Phase 2', status: 'Active',   created: '01 Jan 2024', updated: '2 hrs ago'  },
    { id: 304, number: 13, name: 'Tapovan Area Part-4',   voters: 1038, agent: 'Geeta Rawat',    phone: '+91 98765 43220', phase: 'Phase 2', status: 'Inactive', created: '01 Jan 2024', updated: '5 days ago' },
  ],
  4: [
    { id: 401, number: 14, name: 'Rishikesh Main Part-1', voters: 1142, agent: 'Arun Sharma',    phone: '+91 98765 43221', phase: 'Phase 2', status: 'Active',   created: '01 Jan 2024', updated: '1 hr ago'   },
    { id: 402, number: 15, name: 'Rishikesh Main Part-2', voters: 1134, agent: 'Pooja Negi',     phone: '+91 98765 43222', phase: 'Phase 2', status: 'Active',   created: '01 Jan 2024', updated: '2 hrs ago'  },
    { id: 403, number: 16, name: 'Rishikesh Main Part-3', voters: 1156, agent: 'Dinesh Kumar',   phone: '+91 98765 43223', phase: 'Phase 2', status: 'Active',   created: '01 Jan 2024', updated: '3 hrs ago'  },
    { id: 404, number: 17, name: 'Rishikesh Main Part-4', voters: 1120, agent: null,             phone: null,              phase: 'Phase 2', status: 'Pending',  created: '01 Jan 2024', updated: '1 day ago'  },
    { id: 405, number: 18, name: 'Rishikesh Main Part-5', voters: 1178, agent: 'Neha Bisht',     phone: '+91 98765 43224', phase: 'Phase 2', status: 'Active',   created: '01 Jan 2024', updated: '4 hrs ago'  },
    { id: 406, number: 19, name: 'Rishikesh Main Part-6', voters: 1110, agent: 'Rahul Dobhal',   phone: '+91 98765 43225', phase: 'Phase 2', status: 'Active',   created: '01 Jan 2024', updated: '5 hrs ago'  },
  ],
  5: [
    { id: 501, number: 20, name: 'Haridwar Road Part-1',  voters: 1024, agent: 'Meena Devi',     phone: '+91 98765 43226', phase: 'Phase 2', status: 'Active',   created: '01 Jan 2024', updated: '2 hrs ago'  },
    { id: 502, number: 21, name: 'Haridwar Road Part-2',  voters: 1048, agent: 'Rajiv Gupta',    phone: '+91 98765 43227', phase: 'Phase 2', status: 'Active',   created: '01 Jan 2024', updated: '1 hr ago'   },
    { id: 503, number: 22, name: 'Haridwar Road Part-3',  voters: 1048, agent: null,             phone: null,              phase: 'Phase 2', status: 'Inactive', created: '01 Jan 2024', updated: '4 days ago' },
  ],
  6: [
    { id: 601, number: 23, name: 'Lakshman Jhula Part-1', voters: 1140, agent: 'Uma Shankar',    phone: '+91 98765 43229', phase: 'Phase 2', status: 'Active',   created: '01 Jan 2024', updated: '3 hrs ago'  },
    { id: 602, number: 24, name: 'Lakshman Jhula Part-2', voters: 1150, agent: 'Ravi Thapa',     phone: '+91 98765 43230', phase: 'Phase 2', status: 'Active',   created: '01 Jan 2024', updated: '2 hrs ago'  },
    { id: 603, number: 25, name: 'Lakshman Jhula Part-3', voters: 1130, agent: null,             phone: null,              phase: 'Phase 2', status: 'Pending',  created: '01 Jan 2024', updated: '2 days ago' },
    { id: 604, number: 26, name: 'Lakshman Jhula Part-4', voters: 1140, agent: 'Anita Rawat',    phone: '+91 98765 43231', phase: 'Phase 2', status: 'Active',   created: '01 Jan 2024', updated: '6 hrs ago'  },
  ],
  7: [
    { id: 701, number: 27, name: 'Dehradun Road Part-1',  voters: 1178, agent: 'Sunita Rana',    phone: '+91 98765 43232', phase: 'Phase 2', status: 'Active',   created: '01 Jan 2024', updated: '1 hr ago'   },
    { id: 702, number: 28, name: 'Dehradun Road Part-2',  voters: 1182, agent: null,             phone: null,              phase: 'Phase 2', status: 'Pending',  created: '01 Jan 2024', updated: '1 day ago'  },
    { id: 703, number: 29, name: 'Dehradun Road Part-3',  voters: 1175, agent: 'Bharat Singh',   phone: '+91 98765 43233', phase: 'Phase 2', status: 'Active',   created: '01 Jan 2024', updated: '4 hrs ago'  },
    { id: 704, number: 30, name: 'Dehradun Road Part-4',  voters: 1188, agent: 'Kamla Devi',     phone: '+91 98765 43234', phase: 'Phase 2', status: 'Active',   created: '01 Jan 2024', updated: '7 hrs ago'  },
    { id: 705, number: 31, name: 'Dehradun Road Part-5',  voters: 1167, agent: null,             phone: null,              phase: 'Phase 2', status: 'Pending',  created: '01 Jan 2024', updated: '3 days ago' },
  ],
  8: [
    { id: 801, number: 32, name: 'City Centre Part-1',    voters: 1156, agent: 'Harish Bahuguna', phone: '+91 98765 43236', phase: 'Phase 2', status: 'Active',   created: '01 Jan 2024', updated: '2 hrs ago'  },
    { id: 802, number: 33, name: 'City Centre Part-2',    voters: 1148, agent: 'Pushpa Devi',    phone: '+91 98765 43237', phase: 'Phase 2', status: 'Active',   created: '01 Jan 2024', updated: '3 hrs ago'  },
    { id: 803, number: 34, name: 'City Centre Part-3',    voters: 1146, agent: null,             phone: null,              phase: 'Phase 2', status: 'Inactive', created: '01 Jan 2024', updated: '6 days ago' },
  ],
  9: [
    { id: 901, number: 35, name: 'Ram Jhula Area Part-1', voters: 1030, agent: 'Vinod Rawat',    phone: '+91 98765 43238', phase: 'Phase 2', status: 'Active',   created: '01 Jan 2024', updated: '1 hr ago'   },
    { id: 902, number: 36, name: 'Ram Jhula Area Part-2', voters: 1040, agent: 'Savita Negi',    phone: '+91 98765 43239', phase: 'Phase 2', status: 'Active',   created: '01 Jan 2024', updated: '5 hrs ago'  },
    { id: 903, number: 37, name: 'Ram Jhula Area Part-3', voters: 1025, agent: 'Manoj Bhatt',    phone: '+91 98765 43240', phase: 'Phase 2', status: 'Active',   created: '01 Jan 2024', updated: '8 hrs ago'  },
    { id: 904, number: 38, name: 'Ram Jhula Area Part-4', voters: 1025, agent: null,             phone: null,              phase: 'Phase 2', status: 'Pending',  created: '01 Jan 2024', updated: '2 days ago' },
  ],
  10: [
    { id: 1001, number: 39, name: 'KV Campus Part-1',     voters: 1134, agent: 'Prakash Semwal', phone: '+91 98765 43241', phase: 'Phase 2', status: 'Active',   created: '01 Jan 2024', updated: '2 hrs ago'  },
    { id: 1002, number: 40, name: 'KV Campus Part-2',     voters: 1134, agent: 'Rekha Rana',     phone: '+91 98765 43242', phase: 'Phase 2', status: 'Active',   created: '01 Jan 2024', updated: '3 hrs ago'  },
    { id: 1003, number: 41, name: 'KV Campus Part-3',     voters: 1134, agent: 'Govind Prasad',  phone: '+91 98765 43243', phase: 'Phase 2', status: 'Active',   created: '01 Jan 2024', updated: '4 hrs ago'  },
    { id: 1004, number: 42, name: 'KV Campus Part-4',     voters: 1134, agent: null,             phone: null,              phase: 'Phase 2', status: 'Pending',  created: '01 Jan 2024', updated: '1 day ago'  },
    { id: 1005, number: 43, name: 'KV Campus Part-5',     voters: 1134, agent: 'Nirmala Rawat',  phone: '+91 98765 43244', phase: 'Phase 2', status: 'Active',   created: '01 Jan 2024', updated: '6 hrs ago'  },
  ],
}

const ALL_BOOTHS = Object.values(BOOTHS).flat()
const TOTAL_BOOTHS     = ALL_BOOTHS.length
const TOTAL_STATIONS   = STATIONS.length
const ASSIGNED_AGENTS  = ALL_BOOTHS.filter(b => b.agent).length
const UNASSIGNED_BOOTHS = ALL_BOOTHS.filter(b => !b.agent).length

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = {
    Active:   { bg: '#ECFDF5', color: '#059669', dot: '#10B981' },
    Pending:  { bg: '#FFFBEB', color: '#D97706', dot: '#F59E0B' },
    Inactive: { bg: '#F8FAFC', color: '#64748B', dot: '#94A3B8' },
  }[status] ?? { bg: '#F8FAFC', color: '#64748B', dot: '#94A3B8' }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.color }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      {status}
    </span>
  )
}

function AgentCell({ agent }) {
  if (!agent) return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full">
      <AlertCircle size={11} /> Unassigned
    </span>
  )
  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
        style={{ background: '#5B5CEB' }}>
        {agent[0]}
      </div>
      <span className="text-slate-700 text-[12px] font-medium">{agent}</span>
    </div>
  )
}

function SelectBtn({ label, value }) {
  return (
    <button className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E8ECF4] rounded-xl text-[12px] text-slate-600 hover:border-[#5B5CEB]/40 transition-colors">
      {label && <span className="text-slate-400">{label}:</span>}
      <span className="font-medium">{value}</span>
      <ChevronDown size={13} className="text-slate-400" />
    </button>
  )
}

// ── Booth Drawer ──────────────────────────────────────────────────────────────

function BoothDrawer({ booth, station, onClose }) {
  const fields = [
    { label: 'Booth Number',    value: `#${booth.number}`    },
    { label: 'Booth Name',      value: booth.name            },
    { label: 'Polling Station', value: station?.name         },
    { label: 'Phase',           value: booth.phase           },
    { label: 'Total Voters',    value: booth.voters.toLocaleString() },
    { label: 'Created Date',    value: booth.created         },
    { label: 'Last Updated',    value: booth.updated         },
  ]

  return (
    <>
      <div className="fixed inset-0 bg-black/25 z-40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-[380px] bg-white z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[#E8ECF4]">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Booth Details</p>
            <h2 className="text-slate-800 font-bold text-lg leading-tight">Booth #{booth.number}</h2>
            <p className="text-slate-400 text-[12px] mt-0.5">{booth.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors mt-0.5">
            <X size={16} />
          </button>
        </div>

        {/* Status */}
        <div className="px-5 py-3 border-b border-[#E8ECF4] flex items-center justify-between">
          <span className="text-[12px] text-slate-500">Status</span>
          <StatusBadge status={booth.status} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Fields */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
            {fields.map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-4">
                <span className="text-slate-400 text-[12px] flex-shrink-0">{label}</span>
                <span className="text-slate-700 text-[12px] font-semibold text-right">{value}</span>
              </div>
            ))}
          </div>

          {/* Agent */}
          <div className="bg-slate-50 rounded-2xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Assigned Agent</p>
            {booth.agent ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ background: '#5B5CEB' }}>
                  {booth.agent[0]}
                </div>
                <div>
                  <p className="text-slate-800 font-semibold text-[13px]">{booth.agent}</p>
                  {booth.phone && (
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mt-0.5">
                      <Phone size={11} />
                      {booth.phone}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <AlertCircle size={16} className="text-amber-500 flex-shrink-0" />
                <p className="text-amber-700 text-[12px] font-medium">No agent assigned to this booth</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-5 border-t border-[#E8ECF4] space-y-2">
          <button className="w-full py-2.5 rounded-xl text-white font-semibold text-[13px] transition-opacity hover:opacity-90"
            style={{ background: '#5B5CEB' }}>
            Edit Booth
          </button>
          <button className="w-full py-2.5 rounded-xl font-semibold text-[13px] text-slate-700 border border-[#E8ECF4] hover:bg-slate-50 transition-colors">
            Change Agent
          </button>
          <button className="w-full py-2.5 rounded-xl font-semibold text-[13px] text-slate-700 border border-[#E8ECF4] hover:bg-slate-50 transition-colors">
            View Responses
          </button>
        </div>
      </div>
    </>
  )
}

// ── Empty States ──────────────────────────────────────────────────────────────

function NoStationSelected() {
  return (
    <div className="flex-1 bg-white rounded-2xl border border-[#E8ECF4] flex flex-col items-center justify-center py-20">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
        <Building2 size={28} className="text-indigo-300" />
      </div>
      <h3 className="text-slate-700 font-semibold text-base mb-1">Select a Polling Station</h3>
      <p className="text-slate-400 text-[13px]">Choose a polling station from the left to view its booths.</p>
    </div>
  )
}

function NoBoothsFound() {
  return (
    <tr>
      <td colSpan={8} className="py-16 text-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-3">
            <MapPin size={22} className="text-slate-300" />
          </div>
          <p className="text-slate-600 font-medium text-[13px]">No booths found</p>
          <p className="text-slate-400 text-[12px] mt-1">Try changing your filters or search query.</p>
        </div>
      </td>
    </tr>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

const PAGE_SIZE = 10

export default function Booths() {
  const [selectedStation, setSelectedStation] = useState(null)
  const [selectedBooth,   setSelectedBooth]   = useState(null)
  const [stationSearch,   setStationSearch]   = useState('')
  const [boothSearch,     setBoothSearch]     = useState('')
  const [statusFilter,    setStatusFilter]    = useState('All')
  const [page,            setPage]            = useState(1)

  const filteredStations = useMemo(() =>
    STATIONS.filter(s =>
      s.name.toLowerCase().includes(stationSearch.toLowerCase()) ||
      s.location.toLowerCase().includes(stationSearch.toLowerCase())
    ), [stationSearch])

  const stationBooths = useMemo(() =>
    selectedStation ? (BOOTHS[selectedStation.id] ?? []) : [],
    [selectedStation])

  const filteredBooths = useMemo(() => {
    let list = stationBooths
    if (boothSearch) {
      const q = boothSearch.toLowerCase()
      list = list.filter(b =>
        b.name.toLowerCase().includes(q) ||
        String(b.number).includes(q) ||
        (b.agent && b.agent.toLowerCase().includes(q))
      )
    }
    if (statusFilter !== 'All') list = list.filter(b => b.status === statusFilter)
    return list
  }, [stationBooths, boothSearch, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredBooths.length / PAGE_SIZE))
  const paginatedBooths = filteredBooths.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleStationSelect = (station) => {
    setSelectedStation(station)
    setPage(1)
    setBoothSearch('')
    setStatusFilter('All')
  }

  const summaryCards = [
    { label: 'Total Booths',         value: TOTAL_BOOTHS,     icon: MapPin,      color: '#5B5CEB', bg: '#EEF2FF' },
    { label: 'Polling Stations',      value: TOTAL_STATIONS,   icon: Building2,   color: '#3B82F6', bg: '#EFF6FF' },
    { label: 'Assigned Booth Agents', value: ASSIGNED_AGENTS,  icon: UserCheck,   color: '#10B981', bg: '#ECFDF5' },
    { label: 'Unassigned Booths',     value: UNASSIGNED_BOOTHS, icon: AlertCircle, color: '#F59E0B', bg: '#FFFBEB' },
  ]

  return (
    <div className="-m-6">

      {/* ── Action Bar ─────────────────────────────────────────────────────── */}
      <div className="px-6 py-4 bg-white border-b border-[#E8ECF4]">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-slate-800 font-bold text-xl">Booths</h2>
            <p className="text-slate-400 text-[13px] mt-0.5">Manage polling stations and booths</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 border border-[#E8ECF4] rounded-xl text-[12px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              <Download size={14} /> Export
            </button>
            <button className="flex items-center gap-2 px-3 py-2 border border-[#E8ECF4] rounded-xl text-[12px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              <Upload size={14} /> Import Booths
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: '#5B5CEB' }}>
              <Plus size={14} /> Add Booth
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={boothSearch}
              onChange={e => { setBoothSearch(e.target.value); setPage(1) }}
              placeholder="Search booth number, booth name or polling station..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B5CEB]/20 focus:border-[#5B5CEB]/50 transition-all"
            />
          </div>
          <SelectBtn label="Polling Station" value="All" />
          <SelectBtn label="Phase" value="Phase 2" />
          <div className="flex items-center gap-1">
            {['All', 'Active', 'Pending', 'Inactive'].map(s => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1) }}
                className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
                style={statusFilter === s
                  ? { background: '#5B5CEB', color: '#fff' }
                  : { background: '#F8FAFC', color: '#64748B' }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 bg-[#F5F7FB] pt-5">

        {/* ── Summary Cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-4 mb-5">
          {summaryCards.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl border border-[#E8ECF4] p-4 flex items-center gap-4"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                <Icon size={20} style={{ color }} />
              </div>
              <div>
                <p className="text-slate-800 font-bold text-2xl leading-tight">{value}</p>
                <p className="text-slate-400 text-[11px] font-medium mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Two Column Layout ──────────────────────────────────────────────── */}
        <div className="flex gap-5 pb-6" style={{ minHeight: 560 }}>

          {/* ── Left: Polling Station List ─────────────────────────────────── */}
          <div className="w-72 flex-shrink-0 bg-white rounded-2xl border border-[#E8ECF4] flex flex-col overflow-hidden"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div className="p-4 border-b border-[#E8ECF4]">
              <h3 className="text-slate-800 font-semibold text-[13px] mb-3">Polling Stations</h3>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={stationSearch}
                  onChange={e => setStationSearch(e.target.value)}
                  placeholder="Search polling station..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B5CEB]/20 focus:border-[#5B5CEB]/50 transition-all"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredStations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <MapPin size={24} className="text-slate-200 mb-2" />
                  <p className="text-slate-400 text-[12px]">No stations found</p>
                </div>
              ) : (
                filteredStations.map((station, idx) => {
                  const isActive = selectedStation?.id === station.id
                  return (
                    <button
                      key={station.id}
                      onClick={() => handleStationSelect(station)}
                      className="w-full text-left px-4 py-3.5 transition-all"
                      style={{
                        background: isActive ? '#EEF2FF' : 'transparent',
                        borderLeft: isActive ? '3px solid #5B5CEB' : '3px solid transparent',
                        borderBottom: idx < filteredStations.length - 1 ? '1px solid #F1F5F9' : 'none',
                      }}
                    >
                      <div className="flex items-start gap-2.5">
                        <MapPin size={13} className="mt-0.5 flex-shrink-0" style={{ color: isActive ? '#5B5CEB' : '#94A3B8' }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold leading-snug truncate"
                            style={{ color: isActive ? '#5B5CEB' : '#334155' }}>
                            {station.name}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] text-slate-400">{station.boothCount} Booths</span>
                            <span className="text-[10px] text-slate-400">{station.voters.toLocaleString()} Voters</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* ── Right: Booth Table ─────────────────────────────────────────── */}
          {!selectedStation ? <NoStationSelected /> : (
            <div className="flex-1 flex flex-col min-w-0">
              {/* Station Header */}
              <div className="bg-white rounded-2xl border border-[#E8ECF4] p-5 mb-4 flex items-center justify-between"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-slate-800 font-bold text-[15px]">{selectedStation.name}</h3>
                    <StatusBadge status={selectedStation.status} />
                  </div>
                  <div className="flex items-center gap-4 text-[12px] text-slate-400">
                    <span className="flex items-center gap-1.5"><MapPin size={12} />{selectedStation.location}</span>
                    <span className="flex items-center gap-1.5"><Building2 size={12} />{selectedStation.boothCount} Booths</span>
                    <span className="flex items-center gap-1.5"><Users size={12} />{selectedStation.voters.toLocaleString()} Voters</span>
                  </div>
                </div>
                <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold text-white"
                  style={{ background: '#5B5CEB' }}>
                  <Plus size={13} /> Add Booth
                </button>
              </div>

              {/* Table Card */}
              <div className="bg-white rounded-2xl border border-[#E8ECF4] flex-1 flex flex-col overflow-hidden"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div className="px-5 py-3.5 border-b border-[#E8ECF4] flex items-center justify-between">
                  <p className="text-slate-600 text-[12px] font-medium">
                    Booths in this Polling Station
                    <span className="ml-2 text-slate-400">({filteredBooths.length})</span>
                  </p>
                </div>

                <div className="flex-1 overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E8ECF4' }}>
                        {['Booth No', 'Booth Name / Area', 'Total Voters', 'Assigned Agent', 'Phase', 'Status', 'Last Updated', 'Actions'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {paginatedBooths.length === 0
                        ? <NoBoothsFound />
                        : paginatedBooths.map(booth => (
                          <tr
                            key={booth.id}
                            onClick={() => setSelectedBooth(booth)}
                            className="hover:bg-indigo-50/30 cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-3.5">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-[11px] font-bold"
                                style={{ background: '#EEF2FF', color: '#5B5CEB' }}>
                                {booth.number}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <p className="text-slate-700 text-[12px] font-semibold">{booth.name}</p>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="text-slate-600 text-[12px]">{booth.voters.toLocaleString()}</span>
                            </td>
                            <td className="px-4 py-3.5">
                              <AgentCell agent={booth.agent} />
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="text-slate-500 text-[12px]">{booth.phase}</span>
                            </td>
                            <td className="px-4 py-3.5">
                              <StatusBadge status={booth.status} />
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="text-slate-400 text-[11px]">{booth.updated}</span>
                            </td>
                            <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setSelectedBooth(booth)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#5B5CEB] hover:bg-indigo-50 transition-colors">
                                  <Eye size={13} />
                                </button>
                                <button className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                                  <Edit2 size={13} />
                                </button>
                                <button className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {filteredBooths.length > 0 && (
                  <div className="px-5 py-3.5 border-t border-[#E8ECF4] flex items-center justify-between">
                    <p className="text-[12px] text-slate-400">
                      Showing {Math.min((page - 1) * PAGE_SIZE + 1, filteredBooths.length)}–{Math.min(page * PAGE_SIZE, filteredBooths.length)} of {filteredBooths.length} booths
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E8ECF4] text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        <ChevronLeft size={14} />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-[12px] font-medium transition-all"
                          style={page === p
                            ? { background: '#5B5CEB', color: '#fff' }
                            : { border: '1px solid #E8ECF4', color: '#64748B' }}>
                          {p}
                        </button>
                      ))}
                      <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E8ECF4] text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Drawer ──────────────────────────────────────────────────────────── */}
      {selectedBooth && (
        <BoothDrawer
          booth={selectedBooth}
          station={selectedStation}
          onClose={() => setSelectedBooth(null)}
        />
      )}
    </div>
  )
}
