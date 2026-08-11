import { useEffect, useRef } from 'react'
import { AppState } from 'react-native'
import { Slot, useRouter, useSegments } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useStore } from '../src/store/useStore'
import {
  startSyncListener, stopSyncListener,
  startRealtimeSync, stopRealtimeSync,
  fetchVotersForBooth, fetchActiveSurveyData, fetchActivePoll,
  syncPending, syncPendingPolls,
} from '../src/services/sync'

function AuthGuard() {
  const router   = useRouter()
  const segments = useSegments()
  const { isAuthenticated, hydrated, hydrate, agent } = useStore()
  const appState = useRef(AppState.currentState)

  useEffect(() => { hydrate() }, [])

  // ── Navigation guard ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hydrated) return
    const inAuthGroup = segments[0] === 'login'
    if (!isAuthenticated && !inAuthGroup) router.replace('/login')
    else if (isAuthenticated && inAuthGroup)  router.replace('/(tabs)')
  }, [isAuthenticated, hydrated, segments])

  // ── Fix 1: Load data reactively on agent.boothNo, not just isAuthenticated ──
  // This means even if agent arrives a tick after isAuthenticated, fetches still run.
  useEffect(() => {
    if (!isAuthenticated || !agent?.boothNo) return
    const { setVoters, setActiveSurvey, setActivePhase, setActivePoll, loadPending, loadPendingPolls } = useStore.getState()
    loadPending()
    loadPendingPolls()
    startSyncListener()
    fetchVotersForBooth(agent.boothNo).then(setVoters).catch(() => {})
    fetchActiveSurveyData(agent.boothNo)
      .then(res => { setActiveSurvey(res.activeSurvey); setActivePhase(res.activePhase) })
      .catch(() => {})
    fetchActivePoll(agent.boothNo).then(setActivePoll).catch(() => {})
    startRealtimeSync(agent.boothNo)
  }, [isAuthenticated, agent?.boothNo])

  // ── Logout cleanup ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) {
      stopSyncListener()
      stopRealtimeSync()
    }
  }, [isAuthenticated])

  // ── Fix 3: Reconnect realtime when app comes to foreground ───────────────────
  useEffect(() => {
    if (!isAuthenticated) return
    const sub = AppState.addEventListener('change', nextState => {
      const wasBackground = appState.current === 'background' || appState.current === 'inactive'
      appState.current = nextState
      if (nextState === 'active' && wasBackground) {
        const { agent, setVoters, setActiveSurvey, setActivePhase, setActivePoll } = useStore.getState()
        if (!agent?.boothNo) return
        // Reconnect realtime (startRealtimeSync will tear down the old channel first)
        startRealtimeSync(agent.boothNo)
        // Refresh data that may have changed while backgrounded
        fetchActiveSurveyData(agent.boothNo)
          .then(res => { setActiveSurvey(res.activeSurvey); setActivePhase(res.activePhase) })
          .catch(() => {})
        fetchActivePoll(agent.boothNo).then(setActivePoll).catch(() => {})
        fetchVotersForBooth(agent.boothNo).then(setVoters).catch(() => {})
        // Flush any offline queues
        syncPending()
        syncPendingPolls()
      }
    })
    return () => sub.remove()
  }, [isAuthenticated])

  return <Slot />
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AuthGuard />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
