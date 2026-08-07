import { useState, useMemo } from 'react'
import {
  Plus, Search, X, Edit2, Archive, Eye, Copy, Download,
  ChevronDown, ArrowLeft, Type, AlignLeft, Hash, Phone,
  Mail, ToggleLeft, CheckSquare, Star, Calendar, Clock,
  List, Trash2, GripVertical, CircleDot, Layers,
  CheckCircle2, Activity, FileText, Monitor, Smartphone,
  Link2, ClipboardList,
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const Q_TYPES = [
  { value: 'short_text',      label: 'Short Text',      icon: Type },
  { value: 'long_text',       label: 'Long Text',       icon: AlignLeft },
  { value: 'number',          label: 'Number',          icon: Hash },
  { value: 'mobile',          label: 'Mobile Number',   icon: Phone },
  { value: 'email',           label: 'Email',           icon: Mail },
  { value: 'yes_no',          label: 'Yes / No',        icon: ToggleLeft },
  { value: 'single_choice',   label: 'Single Choice',   icon: CircleDot },
  { value: 'multiple_choice', label: 'Multiple Choice', icon: CheckSquare },
  { value: 'dropdown',        label: 'Dropdown',        icon: List },
  { value: 'rating',          label: 'Rating (1–5)',    icon: Star },
  { value: 'checkbox',        label: 'Checkbox',        icon: CheckSquare },
  { value: 'date',            label: 'Date',            icon: Calendar },
  { value: 'time',            label: 'Time',            icon: Clock },
]
const HAS_OPTIONS = ['single_choice', 'multiple_choice', 'dropdown', 'checkbox']

const STATUS_CFG = {
  Active:   { color: '#10B981', bg: '#ECFDF5' },
  Draft:    { color: '#94A3B8', bg: '#F8FAFC' },
  Archived: { color: '#EF4444', bg: '#FEF2F2' },
}

const CATEGORIES = ['Outreach', 'Issue Collection', 'Verification', 'Feedback', 'Exit Poll', 'Other']

const LINKED_PHASES = [
  { id: 1, name: 'Door-to-Door Campaign',    color: '#5B5CEB' },
  { id: 2, name: 'Issue Collection',          color: '#10B981' },
  { id: 3, name: 'Beneficiary Verification',  color: '#F59E0B' },
  { id: 4, name: 'Opinion Poll',              color: '#8B5CF6' },
  { id: 5, name: 'Candidate Feedback',        color: '#EC4899' },
  { id: 6, name: 'Exit Poll',                 color: '#06B6D4' },
]

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_FORMS = [
  {
    id: 1, name: 'Door-to-Door Survey', description: 'Household voter outreach and sentiment analysis.',
    category: 'Outreach', status: 'Active', linkedPhases: [1],
    createdBy: 'Admin', createdAt: '2026-04-20', updatedAt: '2026-05-16',
    questions: [
      { id: 'q1', type: 'short_text',    question: "Voter's full name",                  required: true,  helpText: '',              placeholder: 'Enter name',      options: [],                                                          order: 1 },
      { id: 'q2', type: 'yes_no',        question: 'Are you a registered voter?',         required: true,  helpText: '',              placeholder: '',                options: [],                                                          order: 2 },
      { id: 'q3', type: 'single_choice', question: 'Do you support our candidate?',       required: true,  helpText: '',              placeholder: '',                options: ['Yes', 'No', 'Undecided'],                                  order: 3 },
      { id: 'q4', type: 'dropdown',      question: 'Biggest issue in your area?',         required: false, helpText: 'Select one',    placeholder: '',                options: ['Roads', 'Water Supply', 'Employment', 'Electricity', 'Others'], order: 4 },
      { id: 'q5', type: 'rating',        question: "Rate our party's performance (1–5)",  required: false, helpText: '1=Poor 5=Best', placeholder: '',                options: [],                                                          order: 5 },
      { id: 'q6', type: 'long_text',     question: 'Additional feedback or comments?',    required: false, helpText: '',              placeholder: 'Share thoughts…', options: [],                                                          order: 6 },
    ],
  },
  {
    id: 2, name: 'Beneficiary Verification', description: 'Verify government scheme beneficiaries.',
    category: 'Verification', status: 'Active', linkedPhases: [3],
    createdBy: 'Admin', createdAt: '2026-05-01', updatedAt: '2026-06-02',
    questions: [
      { id: 'q1', type: 'short_text',      question: 'Beneficiary Name',                           required: true,  helpText: '',  placeholder: '',            options: [],                                                                    order: 1 },
      { id: 'q2', type: 'mobile',          question: 'Mobile Number',                              required: true,  helpText: '',  placeholder: '10-digit',    options: [],                                                                    order: 2 },
      { id: 'q3', type: 'multiple_choice', question: 'Which schemes are you enrolled in?',          required: true,  helpText: '',  placeholder: '',            options: ['PM Awas Yojana', 'Ujjwala Yojana', 'Jan Dhan', 'MGNREGA', 'Kisan Samman Nidhi'], order: 3 },
      { id: 'q4', type: 'yes_no',          question: 'Are you receiving scheme benefits regularly?', required: true,  helpText: '',  placeholder: '',            options: [],                                                                    order: 4 },
      { id: 'q5', type: 'long_text',       question: 'Issues with scheme delivery?',                required: false, helpText: '',  placeholder: '',            options: [],                                                                    order: 5 },
    ],
  },
  {
    id: 3, name: 'Issue Collection Form', description: 'Primary voter concerns and local issues.',
    category: 'Issue Collection', status: 'Active', linkedPhases: [2],
    createdBy: 'Admin', createdAt: '2026-05-10', updatedAt: '2026-05-28',
    questions: [
      { id: 'q1', type: 'multiple_choice', question: 'Select your top 3 issues',          required: true,  helpText: '', placeholder: '', options: ['Roads', 'Water', 'Electricity', 'Employment', 'Education', 'Healthcare', 'Sanitation', 'Others'], order: 1 },
      { id: 'q2', type: 'rating',          question: 'Rate local infrastructure (1–5)',    required: true,  helpText: '', placeholder: '', options: [], order: 2 },
      { id: 'q3', type: 'long_text',       question: 'Describe the most urgent problem',  required: false, helpText: '', placeholder: '', options: [], order: 3 },
    ],
  },
  {
    id: 4, name: 'Opinion Poll', description: 'Voter sentiment and candidate preference survey.',
    category: 'Feedback', status: 'Active', linkedPhases: [4],
    createdBy: 'Admin', createdAt: '2026-06-15', updatedAt: '2026-06-28',
    questions: [
      { id: 'q1', type: 'single_choice', question: 'Who will you vote for?',             required: true,  helpText: '', placeholder: '', options: ['Candidate A', 'Candidate B', 'Candidate C', 'Not Decided'], order: 1 },
      { id: 'q2', type: 'rating',        question: 'Rate current MLA performance',        required: true,  helpText: '', placeholder: '', options: [], order: 2 },
      { id: 'q3', type: 'yes_no',        question: 'Satisfied with party work?',          required: false, helpText: '', placeholder: '', options: [], order: 3 },
      { id: 'q4', type: 'short_text',    question: 'What would make you vote for us?',    required: false, helpText: '', placeholder: '', options: [], order: 4 },
    ],
  },
  {
    id: 5, name: 'Candidate Feedback', description: 'Voter feedback on candidate performance.',
    category: 'Feedback', status: 'Draft', linkedPhases: [5],
    createdBy: 'Admin', createdAt: '2026-07-01', updatedAt: '2026-07-10',
    questions: [
      { id: 'q1', type: 'rating',          question: 'Rate candidate visibility in your area',  required: true,  helpText: '', placeholder: '', options: [], order: 1 },
      { id: 'q2', type: 'single_choice',   question: 'Have you met the candidate personally?',  required: true,  helpText: '', placeholder: '', options: ['Yes', 'No', 'At events only'], order: 2 },
      { id: 'q3', type: 'multiple_choice', question: 'What do you expect from the candidate?',  required: false, helpText: '', placeholder: '', options: ['Better roads', 'Employment', 'Cleanliness', 'Water supply', 'Schools', 'Hospitals'], order: 3 },
    ],
  },
  {
    id: 6, name: 'Exit Poll Survey', description: 'Post-voting sentiment collection.',
    category: 'Exit Poll', status: 'Draft', linkedPhases: [6],
    createdBy: 'Admin', createdAt: '2026-07-15', updatedAt: '2026-07-15',
    questions: [
      { id: 'q1', type: 'yes_no',        question: 'Did you vote today?',              required: true,  helpText: '',                           placeholder: '', options: [], order: 1 },
      { id: 'q2', type: 'single_choice', question: 'Which party did you vote for?',    required: false, helpText: 'Optional — choice is private', placeholder: '', options: ['Party A', 'Party B', 'Party C', 'Independent', 'Prefer not to say'], order: 2 },
      { id: 'q3', type: 'rating',        question: 'Rate your voting experience',       required: false, helpText: '',                           placeholder: '', options: [], order: 3 },
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9) }
function fmt(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) }
function qtInfo(type) { return Q_TYPES.find(t => t.value === type) || Q_TYPES[0] }

// ─── Question Card (Builder) ──────────────────────────────────────────────────

function QuestionCard({ q, isActive, onActivate, onChange, onDelete, onDuplicate, dragHandlers, isDragOver }) {
  const ti = qtInfo(q.type)
  const QIcon = ti.icon
  const hasOpts = HAS_OPTIONS.includes(q.type)

  function set(key, val) { onChange({ ...q, [key]: val }) }
  function addOpt()       { set('options', [...(q.options || []), 'Option']) }
  function updOpt(i, v)   { const o = [...q.options]; o[i] = v; set('options', o) }
  function delOpt(i)      { const o = [...q.options]; o.splice(i, 1); set('options', o) }

  return (
    <div
      draggable
      onDragStart={dragHandlers.start}
      onDragOver={e => { e.preventDefault(); dragHandlers.over() }}
      onDrop={e => { e.preventDefault(); dragHandlers.drop() }}
      onDragEnd={dragHandlers.end}
      className={`rounded-2xl border transition-all cursor-pointer mb-3 overflow-hidden select-none
        ${isActive ? 'border-[#5B5CEB] shadow-md' : 'border-[#E8ECF4] hover:border-slate-300'}
        ${isDragOver ? 'border-[#5B5CEB] border-dashed opacity-70' : 'bg-white'}`}
    >
      {/* Header row */}
      <div className="flex items-start gap-3 px-4 py-3.5" onClick={() => onActivate(q.id)}>
        <div className="text-slate-300 hover:text-slate-400 cursor-grab mt-0.5 flex-shrink-0">
          <GripVertical size={16} />
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
          <span className="text-[11px] font-bold text-slate-400">Q{q.order}</span>
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold" style={{ background: '#EEF2FF', color: '#5B5CEB' }}>
            <QIcon size={9} />{ti.label}
          </span>
          {q.required && <span className="text-red-400 text-[11px] font-bold">*</span>}
        </div>
        <div className="flex-1 min-w-0">
          {isActive
            ? <input autoFocus value={q.question} onChange={e => set('question', e.target.value)} onClick={e => e.stopPropagation()} placeholder="Type question here…" className="w-full text-[14px] font-medium text-slate-800 bg-transparent outline-none border-b border-[#5B5CEB] pb-0.5" />
            : <p className="text-[14px] font-medium text-slate-800 truncate">{q.question || <span className="text-slate-400 italic font-normal">Untitled question</span>}</p>
          }
        </div>
        <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
          <button onClick={() => onDuplicate(q)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"><Copy size={13} /></button>
          <button onClick={() => onDelete(q.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={13} /></button>
        </div>
      </div>

      {/* Expanded settings */}
      {isActive && (
        <div className="border-t border-[#E8ECF4] px-4 py-4 space-y-4 bg-slate-50/50" onClick={e => e.stopPropagation()}>
          {/* Type + Required */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <select value={q.type} onChange={e => set('type', e.target.value)} className="appearance-none pl-3 pr-7 py-1.5 rounded-lg border border-[#E8ECF4] text-[12px] text-slate-600 outline-none cursor-pointer bg-white">
                {Q_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <div onClick={() => set('required', !q.required)} className="w-8 h-4 rounded-full relative transition-colors flex-shrink-0" style={{ background: q.required ? '#5B5CEB' : '#CBD5E1' }}>
                <div className="w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all" style={{ left: q.required ? 17 : 2 }} />
              </div>
              <span className="text-[12px] text-slate-500">Required</span>
            </label>
          </div>

          {/* Help text */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Help Text</label>
            <input value={q.helpText || ''} onChange={e => set('helpText', e.target.value)} placeholder="Optional hint shown below the question…" className="w-full px-3 py-2 rounded-lg border border-[#E8ECF4] text-[12px] text-slate-600 placeholder-slate-300 outline-none bg-white" onFocus={e => e.target.style.borderColor='#5B5CEB'} onBlur={e => e.target.style.borderColor='#E8ECF4'} />
          </div>

          {/* Placeholder for text inputs */}
          {['short_text','long_text','number','mobile','email'].includes(q.type) && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Placeholder</label>
              <input value={q.placeholder || ''} onChange={e => set('placeholder', e.target.value)} placeholder="Placeholder text in the input field…" className="w-full px-3 py-2 rounded-lg border border-[#E8ECF4] text-[12px] text-slate-600 placeholder-slate-300 outline-none bg-white" onFocus={e => e.target.style.borderColor='#5B5CEB'} onBlur={e => e.target.style.borderColor='#E8ECF4'} />
            </div>
          )}

          {/* Options */}
          {hasOpts && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Options</label>
              <div className="space-y-1.5">
                {(q.options || []).map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border border-slate-300 flex-shrink-0" />
                    <input value={opt} onChange={e => updOpt(i, e.target.value)} className="flex-1 px-2.5 py-1.5 rounded-lg border border-[#E8ECF4] text-[12px] text-slate-700 outline-none bg-white" onFocus={e => e.target.style.borderColor='#5B5CEB'} onBlur={e => e.target.style.borderColor='#E8ECF4'} />
                    <button onClick={() => delOpt(i)} className="text-slate-300 hover:text-red-400 transition-colors"><X size={12} /></button>
                  </div>
                ))}
                <button onClick={addOpt} className="flex items-center gap-1.5 text-[12px] font-medium mt-1" style={{ color: '#5B5CEB' }}><Plus size={12} /> Add option</button>
              </div>
            </div>
          )}

          {/* Rating preview */}
          {q.type === 'rating' && (
            <div className="flex items-center gap-1.5">
              {[1,2,3,4,5].map(n => <Star key={n} size={18} className="fill-amber-400 text-amber-400" />)}
              <span className="text-[11px] text-slate-400 ml-1">Rating 1–5</span>
            </div>
          )}

          {/* Yes/No preview */}
          {q.type === 'yes_no' && (
            <div className="flex gap-2">
              {['Yes','No'].map(o => <div key={o} className="px-4 py-1.5 rounded-lg border border-[#E8ECF4] text-[12px] text-slate-600 bg-white">{o}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Preview Modal ────────────────────────────────────────────────────────────

function PreviewModal({ formName, formDesc, questions, mode, onClose }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}>
      <div className="relative">
        <button onClick={onClose} className="absolute -top-9 right-0 text-white/70 hover:text-white flex items-center gap-1.5 text-[13px]">
          <X size={14} /> Close Preview
        </button>

        {mode === 'mobile' ? (
          // Phone shell
          <div className="relative" style={{ width: 320, height: 640 }}>
            <div className="absolute inset-0 rounded-[40px] border-[6px] border-slate-800 bg-white overflow-hidden" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
              {/* Status bar */}
              <div className="h-7 bg-slate-900 flex items-center justify-between px-5 flex-shrink-0">
                <span className="text-white text-[10px]">9:41</span>
                <div className="flex gap-1 items-center">
                  <div className="w-3 h-1.5 bg-white rounded-sm opacity-80" />
                  <div className="w-1.5 h-1.5 bg-white rounded-full opacity-80" />
                </div>
              </div>
              {/* App bar */}
              <div className="px-4 py-2.5 flex-shrink-0" style={{ background: '#5B5CEB' }}>
                <p className="text-white font-bold text-[13px] truncate">{formName || 'Survey'}</p>
                <p className="text-white/70 text-[10px]">{questions.length} questions</p>
              </div>
              {/* Content */}
              <div className="overflow-y-auto px-4 py-3 space-y-4" style={{ height: 'calc(100% - 100px)' }}>
                {questions.map((q, i) => (
                  <div key={q.id}>
                    <p className="text-slate-700 text-[12px] font-semibold mb-1">{i+1}. {q.question}{q.required && <span className="text-red-400 ml-0.5">*</span>}</p>
                    {q.helpText && <p className="text-slate-400 text-[10px] mb-1.5">{q.helpText}</p>}
                    {['short_text','number','mobile','email'].includes(q.type) && <div className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-400">{q.placeholder || 'Enter answer…'}</div>}
                    {q.type === 'long_text' && <div className="border border-slate-200 rounded-lg px-2.5 py-2 text-[11px] text-slate-400 h-12">{q.placeholder || 'Enter answer…'}</div>}
                    {q.type === 'yes_no' && <div className="flex gap-1.5">{['Yes','No'].map(o => <div key={o} className="flex-1 text-center py-1.5 rounded-lg border border-slate-200 text-[11px] text-slate-600">{o}</div>)}</div>}
                    {q.type === 'single_choice' && q.options.map((o,j) => <div key={j} className="flex items-center gap-1.5 mb-1"><div className="w-3 h-3 rounded-full border border-slate-300 flex-shrink-0" /><span className="text-[11px] text-slate-600">{o}</span></div>)}
                    {(q.type === 'multiple_choice' || q.type === 'checkbox') && q.options.map((o,j) => <div key={j} className="flex items-center gap-1.5 mb-1"><div className="w-3 h-3 rounded border border-slate-300 flex-shrink-0" /><span className="text-[11px] text-slate-600">{o}</span></div>)}
                    {q.type === 'dropdown' && <div className="border border-slate-200 rounded-lg px-2.5 py-1.5 flex items-center justify-between"><span className="text-[11px] text-slate-400">Select option</span><ChevronDown size={10} className="text-slate-400" /></div>}
                    {q.type === 'rating' && <div className="flex gap-1">{[1,2,3,4,5].map(n => <Star key={n} size={15} className="fill-amber-400 text-amber-400" />)}</div>}
                    {q.type === 'date' && <div className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-400">DD/MM/YYYY</div>}
                    {q.type === 'time' && <div className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-400">HH:MM</div>}
                  </div>
                ))}
                <button className="w-full py-2.5 rounded-xl text-white text-[12px] font-semibold" style={{ background: '#5B5CEB' }}>Submit Survey</button>
              </div>
            </div>
            {/* Notch */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-16 h-1 bg-slate-800 rounded-full z-10" />
          </div>
        ) : (
          // Desktop preview
          <div className="bg-white rounded-2xl overflow-hidden" style={{ width: 640, maxHeight: '85vh', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div className="px-6 py-4" style={{ background: '#5B5CEB' }}>
              <p className="text-white font-bold text-[17px]">{formName || 'Survey'}</p>
              {formDesc && <p className="text-white/70 text-[12px] mt-0.5">{formDesc}</p>}
            </div>
            <div className="overflow-y-auto px-8 py-6 space-y-6" style={{ maxHeight: 'calc(85vh - 72px)' }}>
              {questions.map((q, i) => (
                <div key={q.id}>
                  <p className="text-slate-800 font-semibold text-[14px] mb-2">{i+1}. {q.question}{q.required && <span className="text-red-400 ml-1">*</span>}</p>
                  {q.helpText && <p className="text-slate-400 text-[12px] mb-2">{q.helpText}</p>}
                  {['short_text','number','mobile','email'].includes(q.type) && <input readOnly className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] text-slate-400 outline-none" placeholder={q.placeholder || 'Your answer…'} />}
                  {q.type === 'long_text' && <textarea readOnly rows={3} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] text-slate-400 outline-none resize-none" placeholder={q.placeholder || 'Your answer…'} />}
                  {q.type === 'yes_no' && <div className="flex gap-3">{['Yes','No'].map(o => <div key={o} className="px-6 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-600 cursor-pointer hover:border-indigo-300 transition-colors">{o}</div>)}</div>}
                  {q.type === 'single_choice' && q.options.map((o,j) => <label key={j} className="flex items-center gap-2.5 mb-2.5 cursor-pointer"><div className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0" /><span className="text-[13px] text-slate-700">{o}</span></label>)}
                  {(q.type === 'multiple_choice' || q.type === 'checkbox') && q.options.map((o,j) => <label key={j} className="flex items-center gap-2.5 mb-2.5 cursor-pointer"><div className="w-4 h-4 rounded border-2 border-slate-300 flex-shrink-0" /><span className="text-[13px] text-slate-700">{o}</span></label>)}
                  {q.type === 'dropdown' && <div className="relative w-64"><select className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] text-slate-500 outline-none appearance-none"><option>Select an option</option>{q.options.map((o,j) => <option key={j}>{o}</option>)}</select><ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /></div>}
                  {q.type === 'rating' && <div className="flex gap-2">{[1,2,3,4,5].map(n => <Star key={n} size={24} className="fill-amber-400 text-amber-400 cursor-pointer" />)}</div>}
                  {q.type === 'date' && <input type="date" readOnly className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] outline-none" />}
                  {q.type === 'time' && <input type="time" readOnly className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] outline-none" />}
                </div>
              ))}
              <button className="w-full py-3 rounded-xl text-white font-semibold text-[14px]" style={{ background: 'linear-gradient(135deg,#5B5CEB,#818CF8)' }}>Submit Survey</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Survey Builder ───────────────────────────────────────────────────────────

function SurveyBuilder({ initForm, onBack, onSave }) {
  const [meta, setMeta]     = useState({ name: initForm?.name || '', description: initForm?.description || '', category: initForm?.category || '', status: initForm?.status || 'Draft' })
  const [questions, setQs]  = useState(initForm?.questions ? [...initForm.questions] : [])
  const [activeQId, setAQ]  = useState(null)
  const [preview, setPreview] = useState(null)
  const [dragId, setDragId]   = useState(null)
  const [dragOvId, setDragOv] = useState(null)

  function addQ() {
    const nq = { id: uid(), type: 'short_text', question: '', required: false, helpText: '', placeholder: '', options: [], order: questions.length + 1 }
    setQs(prev => [...prev, nq])
    setAQ(nq.id)
  }
  function updateQ(upd) { setQs(prev => prev.map(q => q.id === upd.id ? upd : q)) }
  function deleteQ(id)  { setQs(prev => prev.filter(q => q.id !== id).map((q,i) => ({ ...q, order: i+1 }))); if (activeQId === id) setAQ(null) }
  function dupQ(q)      { const d = { ...q, id: uid(), order: questions.length + 1 }; setQs(prev => [...prev, d]); setAQ(d.id) }

  function dnd(id) {
    return {
      start: () => setDragId(id),
      over:  () => setDragOv(id),
      drop:  () => {
        if (!dragId || dragId === id) return
        setQs(prev => {
          const a = [...prev], fi = a.findIndex(q => q.id === dragId), ti = a.findIndex(q => q.id === id)
          const [m] = a.splice(fi, 1); a.splice(ti, 0, m)
          return a.map((q, i) => ({ ...q, order: i+1 }))
        })
        setDragId(null); setDragOv(null)
      },
      end: () => { setDragId(null); setDragOv(null) },
    }
  }

  const linkedPhases = (initForm?.linkedPhases || []).map(id => LINKED_PHASES.find(p => p.id === id)).filter(Boolean)

  return (
    <div className="fixed bg-[#F5F7FB] z-30 flex flex-col" style={{ inset: 0, left: 256, top: 64 }}>
      {/* Builder top bar */}
      <div className="bg-white border-b border-[#E8ECF4] px-5 py-3 flex items-center justify-between flex-shrink-0" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-[13px] transition-colors"><ArrowLeft size={15} /> Back</button>
          <div className="w-px h-4 bg-slate-200" />
          <p className="text-slate-700 font-semibold text-[14px]">{meta.name || 'Untitled Survey'}</p>
          <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold" style={{ color: STATUS_CFG[meta.status]?.color, background: STATUS_CFG[meta.status]?.bg }}>{meta.status}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPreview('mobile')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8ECF4] text-slate-600 text-[12px] font-medium hover:bg-slate-50 transition-colors"><Smartphone size={13} /> Mobile</button>
          <button onClick={() => setPreview('desktop')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8ECF4] text-slate-600 text-[12px] font-medium hover:bg-slate-50 transition-colors"><Monitor size={13} /> Desktop</button>
          <button onClick={() => onSave({ ...(initForm || {}), ...meta, questions })} className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-white text-[13px] font-semibold hover:opacity-90 transition-opacity" style={{ background: 'linear-gradient(135deg,#5B5CEB,#818CF8)', boxShadow: '0 2px 8px rgba(91,92,235,0.3)' }}>Save Survey</button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* ── Left Panel ── */}
        <div className="bg-white border-r border-[#E8ECF4] flex flex-col overflow-y-auto flex-shrink-0" style={{ width: 280 }}>
          <div className="px-5 py-3.5 border-b border-[#E8ECF4]">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Survey Details</p>
          </div>
          <div className="px-5 py-5 space-y-4 flex-1">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Survey Name <span className="text-red-400 normal-case font-normal tracking-normal">*</span></label>
              <input value={meta.name} onChange={e => setMeta(m => ({ ...m, name: e.target.value }))} placeholder="Survey form name" className="w-full px-3 py-2 rounded-xl border border-[#E8ECF4] text-[13px] text-slate-700 placeholder-slate-400 outline-none" onFocus={e => e.target.style.borderColor='#5B5CEB'} onBlur={e => e.target.style.borderColor='#E8ECF4'} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
              <textarea value={meta.description} onChange={e => setMeta(m => ({ ...m, description: e.target.value }))} placeholder="Brief description…" rows={3} className="w-full px-3 py-2 rounded-xl border border-[#E8ECF4] text-[13px] text-slate-700 placeholder-slate-400 outline-none resize-none" onFocus={e => e.target.style.borderColor='#5B5CEB'} onBlur={e => e.target.style.borderColor='#E8ECF4'} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
              <div className="relative">
                <select value={meta.category} onChange={e => setMeta(m => ({ ...m, category: e.target.value }))} className="appearance-none w-full px-3 py-2 pr-8 rounded-xl border border-[#E8ECF4] text-[13px] text-slate-600 outline-none cursor-pointer bg-white">
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
              <div className="flex gap-1.5">
                {['Draft','Active','Archived'].map(s => {
                  const sc = STATUS_CFG[s]
                  return <button key={s} onClick={() => setMeta(m => ({ ...m, status: s }))} className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold border transition-all" style={meta.status === s ? { color: sc.color, background: sc.bg, borderColor: sc.color+'50' } : { color: '#94A3B8', background: '#F8FAFC', borderColor: '#E8ECF4' }}>{s}</button>
                })}
              </div>
            </div>

            {/* Stats */}
            <div className="py-3 border-t border-[#E8ECF4] space-y-2">
              <div className="flex items-center justify-between"><span className="text-slate-400 text-[12px]">Total Questions</span><span className="text-slate-700 font-bold text-[14px]">{questions.length}</span></div>
              <div className="flex items-center justify-between"><span className="text-slate-400 text-[12px]">Required</span><span className="text-slate-600 font-semibold text-[13px]">{questions.filter(q => q.required).length}</span></div>
            </div>

            {/* Linked phases (read-only) */}
            {linkedPhases.length > 0 && (
              <div className="border-t border-[#E8ECF4] pt-4">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Used In</label>
                <div className="space-y-1.5">
                  {linkedPhases.map(p => (
                    <div key={p.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                      <span className="text-slate-600 text-[12px]">{p.name}</span>
                    </div>
                  ))}
                </div>
                <p className="text-slate-400 text-[10px] mt-2 flex items-center gap-1"><Link2 size={9} /> Managed in Campaign Phases</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Center Panel: Question Builder ── */}
        <div className="flex-1 overflow-y-auto px-8 py-6" onClick={() => setAQ(null)}>
          <div className="max-w-2xl mx-auto">
            {/* Survey title preview */}
            <div className="mb-6 pb-5 border-b border-[#E8ECF4]">
              <h2 className="text-slate-800 font-bold text-xl">{meta.name || 'Untitled Survey'}</h2>
              {meta.description && <p className="text-slate-400 text-[13px] mt-1">{meta.description}</p>}
            </div>

            {questions.length === 0 && (
              <div className="text-center py-14 border-2 border-dashed border-[#C7D2FE] rounded-2xl bg-white">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: '#EEF2FF' }}>
                  <ClipboardList size={22} style={{ color: '#5B5CEB' }} />
                </div>
                <p className="text-slate-600 font-semibold">No questions yet</p>
                <p className="text-slate-400 text-[12px] mt-1 mb-5">Click below to start building your survey.</p>
                <button onClick={e => { e.stopPropagation(); addQ() }} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-[13px] font-semibold hover:opacity-90 transition-opacity" style={{ background: 'linear-gradient(135deg,#5B5CEB,#818CF8)' }}><Plus size={14} /> Add Question</button>
              </div>
            )}

            <div onClick={e => e.stopPropagation()}>
              {questions.map(q => (
                <QuestionCard
                  key={q.id} q={q}
                  isActive={activeQId === q.id}
                  onActivate={id => setAQ(prev => prev === id ? null : id)}
                  onChange={updateQ}
                  onDelete={deleteQ}
                  onDuplicate={dupQ}
                  dragHandlers={dnd(q.id)}
                  isDragOver={dragOvId === q.id && dragId !== q.id}
                />
              ))}
            </div>

            {questions.length > 0 && (
              <button onClick={e => { e.stopPropagation(); addQ() }} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-[#C7D2FE] text-[13px] font-semibold hover:bg-indigo-50/40 transition-colors mt-1" style={{ color: '#5B5CEB' }}>
                <Plus size={15} /> Add Question
              </button>
            )}
          </div>
        </div>
      </div>

      {preview && <PreviewModal formName={meta.name} formDesc={meta.description} questions={questions} mode={preview} onClose={() => setPreview(null)} />}
    </div>
  )
}

// ─── Main List View ───────────────────────────────────────────────────────────

export default function SurveyForms() {
  const [forms, setForms]       = useState(MOCK_FORMS)
  const [view, setView]         = useState('list')   // 'list' | 'builder'
  const [builderForm, setBForm] = useState(null)
  const [search, setSearch]     = useState('')
  const [filterStatus, setFSt]  = useState('')
  const [drawerForm, setDrawer] = useState(null)

  const counts = useMemo(() => ({
    total:    forms.length,
    active:   forms.filter(f => f.status === 'Active').length,
    draft:    forms.filter(f => f.status === 'Draft').length,
    archived: forms.filter(f => f.status === 'Archived').length,
  }), [forms])

  const filtered = useMemo(() => {
    let d = forms
    if (search) { const q = search.toLowerCase(); d = d.filter(f => f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q)) }
    if (filterStatus) d = d.filter(f => f.status === filterStatus)
    return d
  }, [forms, search, filterStatus])

  function openBuilder(form = null) { setBForm(form); setView('builder'); setDrawer(null) }

  function saveForm(saved) {
    if (saved.id) {
      setForms(prev => prev.map(f => f.id === saved.id ? { ...f, ...saved, updatedAt: new Date().toISOString().slice(0,10) } : f))
    } else {
      setForms(prev => [{ ...saved, id: Date.now(), createdAt: new Date().toISOString().slice(0,10), updatedAt: new Date().toISOString().slice(0,10), linkedPhases: [], createdBy: 'Admin' }, ...prev])
    }
    setView('list')
  }

  function dupForm(f) {
    const d = { ...f, id: Date.now(), name: f.name + ' (Copy)', status: 'Draft', linkedPhases: [], createdAt: new Date().toISOString().slice(0,10), updatedAt: new Date().toISOString().slice(0,10) }
    setForms(prev => [d, ...prev])
  }

  function archiveForm(id) { setForms(prev => prev.map(f => f.id === id ? { ...f, status: 'Archived' } : f)); if (drawerForm?.id === id) setDrawer(prev => ({ ...prev, status: 'Archived' })) }

  // ── Builder view ──
  if (view === 'builder') {
    return <SurveyBuilder initForm={builderForm} onBack={() => setView('list')} onSave={saveForm} />
  }

  // ── List view ──
  return (
    <div className="-m-6 flex flex-col bg-[#F5F7FB]" style={{ minHeight: 'calc(100vh - 64px)' }}>

      {/* Header */}
      <div className="bg-white border-b border-[#E8ECF4] px-6 py-4 flex-shrink-0" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-slate-800 font-bold text-xl">Survey Forms</h1>
            <p className="text-slate-400 text-[13px] mt-0.5">Create and manage reusable survey templates.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#E8ECF4] bg-white text-slate-600 text-[13px] font-medium hover:bg-slate-50 transition-colors"><Download size={14} /> Export</button>
            <button onClick={() => openBuilder()} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-[13px] font-semibold hover:opacity-90 transition-opacity" style={{ background: 'linear-gradient(135deg,#5B5CEB,#818CF8)', boxShadow: '0 2px 8px rgba(91,92,235,0.3)' }}><Plus size={14} /> Create Survey Form</button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Survey Forms',  value: counts.total,    color: '#5B5CEB', bg: '#EEF2FF', icon: Layers },
            { label: 'Active Templates',    value: counts.active,   color: '#10B981', bg: '#ECFDF5', icon: Activity },
            { label: 'Draft Templates',     value: counts.draft,    color: '#F59E0B', bg: '#FFFBEB', icon: FileText },
            { label: 'Archived Templates',  value: counts.archived, color: '#EF4444', bg: '#FEF2F2', icon: Archive },
          ].map(({ label, value, color, bg, icon: Icon }) => (
            <div key={label} className="bg-white rounded-2xl border border-[#E8ECF4] p-5 flex items-center gap-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}><Icon size={20} style={{ color }} /></div>
              <div>
                <p className="text-slate-800 font-bold text-2xl leading-none">{value}</p>
                <p className="text-slate-400 text-[12px] mt-1">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="flex items-center gap-3">
          <div className="relative" style={{ minWidth: 260 }}>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search survey forms…" className="w-full pl-9 pr-8 py-2 rounded-xl border border-[#E8ECF4] bg-white text-[13px] text-slate-700 placeholder-slate-400 outline-none" onFocus={e => e.target.style.borderColor='#5B5CEB'} onBlur={e => e.target.style.borderColor='#E8ECF4'} />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={13} /></button>}
          </div>
          <div className="relative">
            <select value={filterStatus} onChange={e => setFSt(e.target.value)} className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-[#E8ECF4] bg-white text-[13px] text-slate-600 outline-none cursor-pointer" style={{ minWidth: 140 }}>
              <option value="">All Status</option>
              {['Active','Draft','Archived'].map(s => <option key={s}>{s}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          {(search || filterStatus) && <button onClick={() => { setSearch(''); setFSt('') }} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] text-slate-500 border border-[#E8ECF4] bg-white hover:bg-slate-50 transition-colors"><X size={12} /> Clear</button>}
          <span className="ml-auto text-slate-400 text-[12px]">{filtered.length} form{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-[#E8ECF4] overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-[#E8ECF4]" style={{ background: '#F8FAFC' }}>
                {['Survey Form', 'Description', 'Questions', 'Linked Phases', 'Status', 'Last Updated', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-slate-500 font-semibold text-[11px] uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={7} className="text-center py-14 text-slate-400 text-[13px]">No survey forms found.</td></tr>
                : filtered.map(f => {
                  const sc = STATUS_CFG[f.status] || STATUS_CFG.Draft
                  const lp = (f.linkedPhases || []).map(id => LINKED_PHASES.find(p => p.id === id)).filter(Boolean)
                  return (
                    <tr key={f.id} onClick={() => setDrawer(f)} className="border-b border-slate-50 hover:bg-slate-50/60 cursor-pointer transition-colors group">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#EEF2FF' }}><ClipboardList size={14} style={{ color: '#5B5CEB' }} /></div>
                          <span className="text-slate-800 font-semibold text-[13px] whitespace-nowrap">{f.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 max-w-[180px]"><span className="text-slate-500 text-[12px] block truncate">{f.description}</span></td>
                      <td className="px-4 py-3.5"><span className="text-slate-700 font-semibold">{f.questions.length}</span><span className="text-slate-400 text-[11px] ml-1">Q</span></td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 flex-wrap">
                          {lp.slice(0, 2).map(p => <span key={p.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ background: p.color+'18', color: p.color }}><div className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />{p.name}</span>)}
                          {lp.length > 2 && <span className="text-slate-400 text-[11px]">+{lp.length - 2}</span>}
                          {lp.length === 0 && <span className="text-slate-300 text-[12px]">—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3.5"><span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ color: sc.color, background: sc.bg }}>{f.status}</span></td>
                      <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">{fmt(f.updatedAt)}</td>
                      <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setDrawer(f)} title="View"      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"><Eye size={14} /></button>
                          <button onClick={() => openBuilder(f)} title="Edit"    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"><Edit2 size={14} /></button>
                          <button onClick={() => dupForm(f)} title="Duplicate"   className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"><Copy size={14} /></button>
                          {f.status !== 'Archived' && <button onClick={() => archiveForm(f.id)} title="Archive" className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-colors"><Archive size={14} /></button>}
                        </div>
                      </td>
                    </tr>
                  )
                })
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Drawer ── */}
      {drawerForm && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" style={{ backdropFilter: 'blur(1px)' }} onClick={() => setDrawer(null)} />
          <div className="fixed right-0 top-16 bottom-0 bg-white border-l border-[#E8ECF4] z-50 flex flex-col" style={{ width: 420, boxShadow: '-4px 0 24px rgba(0,0,0,0.10)' }}>
            {/* Drawer header */}
            <div className="px-5 py-4 border-b border-[#E8ECF4] flex-shrink-0">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#EEF2FF' }}><ClipboardList size={16} style={{ color: '#5B5CEB' }} /></div>
                  <div>
                    <p className="text-slate-800 font-bold text-[15px]">{drawerForm.name}</p>
                    <p className="text-slate-400 text-[12px] mt-0.5">{drawerForm.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                  <button onClick={() => { openBuilder(drawerForm); setDrawer(null) }} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"><Edit2 size={14} /></button>
                  <button onClick={() => setDrawer(null)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"><X size={14} /></button>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ color: STATUS_CFG[drawerForm.status]?.color, background: STATUS_CFG[drawerForm.status]?.bg }}>{drawerForm.status}</span>
                <span className="text-slate-400 text-[12px]">{drawerForm.category}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Metrics */}
              <div className="px-5 py-4 grid grid-cols-2 gap-3 border-b border-[#E8ECF4]">
                {[
                  { label: 'Total Questions', value: drawerForm.questions.length, color: '#5B5CEB', bg: '#EEF2FF' },
                  { label: 'Required',        value: drawerForm.questions.filter(q => q.required).length, color: '#10B981', bg: '#ECFDF5' },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} className="rounded-xl border border-[#E8ECF4] p-3">
                    <p className="text-slate-800 font-bold text-xl leading-none" style={{ color }}>{value}</p>
                    <p className="text-slate-400 text-[12px] mt-1">{label}</p>
                  </div>
                ))}
              </div>

              {/* Question types summary */}
              <div className="px-5 py-4 border-b border-[#E8ECF4]">
                <p className="text-slate-600 font-semibold text-[13px] mb-3">Question Types</p>
                <div className="flex flex-wrap gap-1.5">
                  {[...new Set(drawerForm.questions.map(q => q.type))].map(type => {
                    const ti = qtInfo(type); const TI = ti.icon
                    return (
                      <span key={type} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border border-[#E8ECF4] text-slate-600 bg-slate-50">
                        <TI size={10} style={{ color: '#5B5CEB' }} />{ti.label}
                      </span>
                    )
                  })}
                </div>
              </div>

              {/* Questions list */}
              <div className="px-5 py-4 border-b border-[#E8ECF4]">
                <p className="text-slate-600 font-semibold text-[13px] mb-3">Questions ({drawerForm.questions.length})</p>
                <div className="space-y-2">
                  {drawerForm.questions.map(q => {
                    const ti = qtInfo(q.type); const QI = ti.icon
                    return (
                      <div key={q.id} className="flex items-start gap-2.5 p-2.5 rounded-xl border border-[#E8ECF4] bg-slate-50/50">
                        <span className="text-slate-400 text-[11px] font-bold mt-0.5 flex-shrink-0">Q{q.order}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-700 text-[12px] font-medium">{q.question}</p>
                          <span className="flex items-center gap-1 mt-1 text-[10px] font-medium" style={{ color: '#5B5CEB' }}><QI size={9} />{ti.label}{q.required && <span className="text-red-400 ml-1">Required</span>}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Linked phases (read-only) */}
              <div className="px-5 py-4 border-b border-[#E8ECF4]">
                <p className="text-slate-600 font-semibold text-[13px] mb-3">Linked Campaign Phases</p>
                {drawerForm.linkedPhases.length === 0
                  ? <p className="text-slate-400 text-[12px]">Not linked to any phase yet.</p>
                  : (
                    <div className="space-y-1.5">
                      {drawerForm.linkedPhases.map(id => {
                        const p = LINKED_PHASES.find(x => x.id === id); if (!p) return null
                        return (
                          <div key={id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-[#E8ECF4]">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
                            <span className="text-slate-700 text-[13px]">{p.name}</span>
                          </div>
                        )
                      })}
                    </div>
                  )
                }
                <p className="text-slate-400 text-[10px] mt-2 flex items-center gap-1"><Link2 size={9} /> Link phases from Campaign Phases module</p>
              </div>

              {/* Meta */}
              <div className="px-5 py-4">
                {[['Created By', drawerForm.createdBy], ['Created Date', fmt(drawerForm.createdAt)], ['Last Updated', fmt(drawerForm.updatedAt)]].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                    <span className="text-slate-400 text-[12px]">{k}</span>
                    <span className="text-slate-700 text-[12px] font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-[#E8ECF4] flex-shrink-0 flex gap-2">
              <button onClick={() => { openBuilder(drawerForm); setDrawer(null) }} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#E8ECF4] text-slate-600 text-[13px] font-medium hover:bg-slate-50 transition-colors"><Edit2 size={14} /> Edit Form</button>
              <button onClick={() => dupForm(drawerForm)} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8ECF4] text-slate-600 text-[13px] font-medium hover:bg-slate-50 transition-colors"><Copy size={14} /></button>
              {drawerForm.status !== 'Archived' && <button onClick={() => archiveForm(drawerForm.id)} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-amber-100 text-amber-500 text-[13px] font-medium hover:bg-amber-50 transition-colors"><Archive size={14} /></button>}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
