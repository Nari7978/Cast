import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'

const AGENT_KEY       = '@cast/agent'
const PENDING_KEY     = '@cast/pending_responses'
const POLL_PENDING_KEY = '@cast/pending_poll_responses'

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
    await AsyncStorage.multiRemove([AGENT_KEY, PENDING_KEY, POLL_PENDING_KEY])
    set({ agent: null, isAuthenticated: false, responses: {}, pendingResponses: [], pendingPollResponses: [] })
  },

  // ── Survey / Phase ────────────────────────────────────────────────────
  activeSurvey:  null,
  activePhase:   null,
  voters:        [],
  responses:     {},   // voterId → { answers, status, submittedAt }
  dataLoadedAt:  0,    // timestamp of last successful voter fetch

  activePoll: null,

  setActiveSurvey: (survey) => {
    const { pendingResponses } = get()
    const surveyId = survey?.id
    const responses = {}
    pendingResponses
      .filter(r => !surveyId || r.surveyId === surveyId)
      .forEach(r => { responses[r.voterId] = r })
    set({ activeSurvey: survey, responses })
  },
  setActivePhase:  (phase)  => set({ activePhase: phase }),
  setVoters:       (voters) => set({ voters, dataLoadedAt: Date.now() }),
  setActivePoll:   (poll)   => set({ activePoll: poll }),

  // ── Offline Responses ─────────────────────────────────────────────────
  pendingResponses: [],

  loadPending: async () => {
    try {
      const raw = await AsyncStorage.getItem(PENDING_KEY)
      const pending = raw ? JSON.parse(raw) : []
      const { activeSurvey } = get()
      const surveyId = activeSurvey?.id
      const responses = {}
      pending
        .filter(r => !surveyId || r.surveyId === surveyId)
        .forEach(r => { responses[r.voterId] = r })
      set({ pendingResponses: pending, responses })
    } catch (_) {}
  },

  saveResponse: async (response) => {
    const { pendingResponses, responses, activeSurvey } = get()
    // Dedupe by voterId+surveyId so cross-survey responses for the same voter are preserved
    const existing = pendingResponses.filter(r => !(r.voterId === response.voterId && r.surveyId === response.surveyId))
    const updated  = [...existing, response]
    await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(updated))
    const isActiveSurvey = !activeSurvey?.id || response.surveyId === activeSurvey.id
    set({
      pendingResponses: updated,
      responses: isActiveSurvey ? { ...responses, [response.voterId]: response } : responses,
    })
  },

  markSynced: async (localId) => {
    const { pendingResponses, responses } = get()
    const updated = pendingResponses.map(r =>
      r.localId === localId ? { ...r, synced: true } : r
    )
    await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(updated))
    const synced = updated.find(r => r.localId === localId)
    set({
      pendingResponses: updated,
      responses: synced && responses[synced.voterId]
        ? { ...responses, [synced.voterId]: { ...responses[synced.voterId], synced: true } }
        : responses,
    })
  },

  // Remove responses that were deleted server-side
  removeResponses: async (localIds) => {
    const { pendingResponses, activeSurvey } = get()
    const idSet = new Set(localIds)
    const updated = pendingResponses.filter(r => !idSet.has(r.localId))
    await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(updated))
    const surveyId = activeSurvey?.id
    const newResponses = {}
    updated
      .filter(r => !surveyId || r.surveyId === surveyId)
      .forEach(r => { newResponses[r.voterId] = r })
    set({ pendingResponses: updated, responses: newResponses })
  },

  getResponseStatus: (voterId) => {
    const { responses } = get()
    const r = responses[voterId]
    if (!r) return 'not_started'
    if (r.submittedAt) return 'completed'
    return 'in_progress'
  },

  // Merge server responses from other agents in same booth without overwriting local ones
  mergeServerResponses: (serverResponses) => {
    const { responses, activeSurvey } = get()
    const surveyId = activeSurvey?.id
    const merged = { ...responses }
    serverResponses
      .filter(r => r.voterId && (!surveyId || r.surveyId === surveyId))
      .forEach(r => { if (!merged[r.voterId]) merged[r.voterId] = r })
    set({ responses: merged })
  },

  // ── Offline Poll Responses ────────────────────────────────────────────
  pendingPollResponses: [],

  loadPendingPolls: async () => {
    try {
      const raw = await AsyncStorage.getItem(POLL_PENDING_KEY)
      set({ pendingPollResponses: raw ? JSON.parse(raw) : [] })
    } catch (_) {}
  },

  savePollResponse: async (response) => {
    const { pendingPollResponses } = get()
    const updated = [...pendingPollResponses, response]
    await AsyncStorage.setItem(POLL_PENDING_KEY, JSON.stringify(updated))
    set({ pendingPollResponses: updated })
  },

  markPollSynced: async (localId) => {
    const { pendingPollResponses } = get()
    const updated = pendingPollResponses.map(r =>
      r.localId === localId ? { ...r, synced: true } : r
    )
    await AsyncStorage.setItem(POLL_PENDING_KEY, JSON.stringify(updated))
    set({ pendingPollResponses: updated })
  },
}))
