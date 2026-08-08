import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'

const AGENT_KEY    = '@cast/agent'
const PENDING_KEY  = '@cast/pending_responses'

export const useStore = create((set, get) => ({
  // ── Auth ──────────────────────────────────────────────────────────────
  agent:           null,
  isAuthenticated: false,
  hydrated:        false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(AGENT_KEY)
      if (raw) {
        set({ agent: JSON.parse(raw), isAuthenticated: true })
      }
    } catch (_) {}
    set({ hydrated: true })
  },

  login: async (agentData) => {
    await AsyncStorage.setItem(AGENT_KEY, JSON.stringify(agentData))
    set({ agent: agentData, isAuthenticated: true })
  },

  logout: async () => {
    await AsyncStorage.multiRemove([AGENT_KEY])
    set({ agent: null, isAuthenticated: false })
  },

  // ── Survey / Phase ────────────────────────────────────────────────────
  activeSurvey:  null,
  activePhase:   null,
  voters:        [],
  responses:     {},   // voterId → { answers, status, submittedAt }

  setActiveSurvey: (survey) => set({ activeSurvey: survey }),
  setActivePhase:  (phase)  => set({ activePhase: phase }),
  setVoters:       (voters) => set({ voters }),

  // ── Offline Responses ─────────────────────────────────────────────────
  pendingResponses: [],

  loadPending: async () => {
    try {
      const raw = await AsyncStorage.getItem(PENDING_KEY)
      const pending = raw ? JSON.parse(raw) : []
      const responses = {}
      pending.forEach(r => { responses[r.voterId] = r })
      set({ pendingResponses: pending, responses })
    } catch (_) {}
  },

  saveResponse: async (response) => {
    const { pendingResponses, responses } = get()
    const existing = pendingResponses.filter(r => r.voterId !== response.voterId)
    const updated  = [...existing, response]
    await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(updated))
    set({
      pendingResponses: updated,
      responses: { ...responses, [response.voterId]: response },
    })
  },

  markSynced: async (voterId) => {
    const { pendingResponses } = get()
    const updated = pendingResponses.map(r =>
      r.voterId === voterId ? { ...r, synced: true } : r
    )
    await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(updated))
    set({ pendingResponses: updated })
  },

  getResponseStatus: (voterId) => {
    const { responses } = get()
    const r = responses[voterId]
    if (!r) return 'not_started'
    if (r.submittedAt) return 'completed'
    return 'in_progress'
  },
}))
