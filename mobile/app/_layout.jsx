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
  fetchVotersForBooths, fetchActiveSurveyData, fetchActivePoll,
  fetchBoothResponses, fetchBoothNames, syncPending, syncPendingPolls, getBoothNos,
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
    const boothNos = getBoothNos(agent)
    const primaryBooth = boothNos[0]
    const { setVoters, setActiveSurvey, setActivePhase, setActivePoll, loadPending, loadPendingPolls } = useStore.getState()
    loadPending()
    loadPendingPolls()
    startSyncListener()
    // Fetch and store booth names for all assigned booths
    if (boothNos.length > 1 && !agent.boothNames?.length) {
      fetchBoothNames(boothNos).then(nameMap => {
        const boothNames = boothNos.map(bn => nameMap[bn] || '')
        const updated = { ...agent, boothNames }
        useStore.setState({ agent: updated })
        import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) => {
          AsyncStorage.setItem('@cast/agent', JSON.stringify(updated)).catch(() => {})
        })
      }).catch(() => {})
    }
    fetchVotersForBooths(boothNos).then(setVoters).catch(() => {})
    fetchActiveSurveyData(primaryBooth)
      .then(res => {
        setActiveSurvey(res.activeSurvey)
        setActivePhase(res.activePhase)
        return fetchBoothResponses(boothNos, res.activeSurvey?.id)
      })
      .then(serverResponses => useStore.getState().mergeServerResponses(serverResponses))
      .catch(() => {})
    fetchActivePoll(primaryBooth).then(setActivePoll).catch(() => {})
    startRealtimeSync(boothNos)
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
        const boothNos = getBoothNos(agent)
        const primaryBooth = boothNos[0]
        startRealtimeSync(boothNos)
        fetchActiveSurveyData(primaryBooth)
          .then(res => {
            setActiveSurvey(res.activeSurvey)
            setActivePhase(res.activePhase)
            return fetchBoothResponses(boothNos, res.activeSurvey?.id)
          })
          .then(serverResponses => useStore.getState().mergeServerResponses(serverResponses))
          .catch(() => {})
        fetchActivePoll(primaryBooth).then(setActivePoll).catch(() => {})
        fetchVotersForBooths(boothNos).then(setVoters).catch(() => {})
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
