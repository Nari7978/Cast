import { useEffect } from 'react'
import { Slot, useRouter, useSegments } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useStore } from '../src/store/useStore'
import { startSyncListener, startRealtimeSync, stopRealtimeSync, fetchVotersForBooth, fetchActiveSurveyData, fetchActivePoll } from '../src/services/sync'

function AuthGuard() {
  const router   = useRouter()
  const segments = useSegments()
  const { isAuthenticated, hydrated, hydrate } = useStore()

  useEffect(() => { hydrate() }, [])

  useEffect(() => {
    if (!hydrated) return
    const inAuthGroup = segments[0] === 'login'
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login')
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)')
    }
  }, [isAuthenticated, hydrated, segments])

  useEffect(() => {
    if (isAuthenticated) {
      startSyncListener()
      const { agent, setVoters, setActiveSurvey, setActivePhase, setActivePoll, loadPending } = useStore.getState()
      loadPending()
      if (agent?.boothNo) {
        fetchVotersForBooth(agent.boothNo).then(setVoters).catch(() => {})
        fetchActiveSurveyData(agent.boothNo)
          .then(res => { setActiveSurvey(res.activeSurvey); setActivePhase(res.activePhase) })
          .catch(() => {})
        fetchActivePoll(agent.boothNo).then(setActivePoll).catch(() => {})
        startRealtimeSync(agent.boothNo)
      }
    } else {
      stopRealtimeSync()
    }
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
