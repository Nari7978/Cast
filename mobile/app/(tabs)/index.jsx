import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { theme } from '../../src/theme'
import { useStore } from '../../src/store/useStore'
import { fetchActiveSurveyData, fetchVotersForBooths, fetchBoothResponses, invalidateSurveyCache, reconcileResponses, getBoothNos } from '../../src/services/sync'

function KPICard({ label, value, color, bg, icon }) {
  return (
    <View style={[styles.kpiCard, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  )
}

function DemoCard({ label, value, color }) {
  return (
    <View style={styles.demoCard}>
      <View style={[styles.demoDot, { backgroundColor: color }]} />
      <Text style={styles.demoLabel}>{label}</Text>
      <Text style={[styles.demoValue, { color }]}>{value}</Text>
    </View>
  )
}

export default function HomeScreen() {
  const insets  = useSafeAreaInsets()
  const router  = useRouter()
  const { agent, activeSurvey, activePhase, voters, setActiveSurvey, setActivePhase, setVoters, responses, dataLoadedAt, activePoll } = useStore()

  const hasData = dataLoadedAt > 0 || voters.length > 0
  const [loading,    setLoading]    = useState(!hasData)
  const [refreshing, setRefreshing] = useState(false)
  const [loadError,  setLoadError]  = useState(false)

  const load = useCallback(async (force = false) => {
    setLoadError(false)
    try {
      if (force) invalidateSurveyCache()
      const boothNos = getBoothNos(agent)
      const primaryBooth = boothNos[0]
      const [{ activeSurvey: s, activePhase: p }, v] = await Promise.all([
        fetchActiveSurveyData(primaryBooth),
        boothNos.length ? fetchVotersForBooths(boothNos) : Promise.resolve(null),
        reconcileResponses(),
      ])
      setActiveSurvey(s)
      setActivePhase(p)
      if (v) setVoters(v)
      if (boothNos.length) {
        fetchBoothResponses(boothNos, s?.id)
          .then(useStore.getState().mergeServerResponses)
          .catch(() => {})
      }
    } catch (_) {
      setLoadError(true)
    }
    setLoading(false)
    setRefreshing(false)
  }, [agent?.boothNo])

  useEffect(() => {
    // If we have stale data show it immediately, refresh silently in background
    if (hasData) load(false)
    else load(false)
  }, [])

  const total     = voters.length
  const completed = voters.filter(v => responses[v.id]?.submittedAt).length
  const pending   = total - completed
  const pct       = total ? Math.round((completed / total) * 100) : 0

  const vGender = v => v.GENDER || v.gender || ''
  const isMale   = g => { const t = g.trim(); const u = t.toUpperCase(); return u === 'MALE' || u === 'M' || t === 'पुरुष' }
  const isFemale = g => { const t = g.trim(); const u = t.toUpperCase(); return u === 'FEMALE' || u === 'F' || t === 'महिला' }
  const isOther  = g => { const t = g.trim(); const u = t.toUpperCase(); return u === 'OTHER' || u === 'O' || t === 'तृतीय लिंग' }
  const maleCount   = voters.filter(v => isMale(vGender(v))).length
  const femaleCount = voters.filter(v => isFemale(vGender(v))).length
  const otherCount  = voters.filter(v => isOther(vGender(v))).length

  const todayStr  = new Date().toDateString()
  const todayDone = Object.values(responses).filter(r => r.submittedAt && new Date(r.submittedAt).toDateString() === todayStr).length
  const lastSurveyTime = Object.values(responses)
    .filter(r => r.submittedAt)
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0]?.submittedAt

  function fmtTime(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    )
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true) }} tintColor={theme.primary} />}
      overScrollMode="never"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <LinearGradient colors={['#5B3FD4', '#7B63DC']} style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerGreeting}>Good {getGreeting()}, 👋</Text>
            <Text style={styles.headerName}>{agent?.name || 'Agent'}</Text>
          </View>
          <View style={styles.boothBadge}>
            <Ionicons name="location" size={12} color={theme.primary} />
            <Text style={styles.boothBadgeText}>Booth {agent?.boothNo || '—'}</Text>
          </View>
        </View>

        {/* Active Survey Card */}
        {activeSurvey ? (
          <View style={styles.surveyCard}>
            <View style={styles.surveyCardRow}>
              <View style={styles.activeDot} />
              <Text style={styles.surveyCardLabel}>ACTIVE SURVEY</Text>
            </View>
            <Text style={styles.surveyCardName}>{activeSurvey.name || activeSurvey.title || 'Door-to-Door Survey'}</Text>
            <View style={styles.surveyCardMeta}>
              <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.7)" />
              <Text style={styles.surveyCardMetaText}>
                Booth {agent?.boothNo}
                {agent?.station ? ` · ${agent.station}` : ''}
                {activePhase?.name ? ` · ${activePhase.name}` : ''}
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.surveyCard, { alignItems: 'center', paddingVertical: 20 }]}>
            <Ionicons name="clipboard-outline" size={28} color="rgba(255,255,255,0.5)" />
            <Text style={{ color: 'rgba(255,255,255,0.6)', marginTop: 8, fontSize: 13 }}>No active survey assigned</Text>
          </View>
        )}
      </LinearGradient>

      <View style={styles.body}>
        {/* Error banner */}
        {loadError && (
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FEE2E2', borderRadius: 12, padding: 14, marginBottom: 16 }}
            onPress={() => load(true)}
          >
            <Ionicons name="wifi-outline" size={18} color="#B91C1C" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#B91C1C' }}>Could not load data</Text>
              <Text style={{ fontSize: 11, color: '#B91C1C', marginTop: 2 }}>Tap to retry</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* KPI Row */}
        <Text style={styles.sectionTitle}>Survey Progress</Text>
        <View style={styles.kpiRow}>
          <KPICard label="Total"     value={total}     color="#5B3FD4" bg="#EDE9FF" icon="people" />
          <KPICard label="Completed" value={completed} color="#10B981" bg="#ECFDF5" icon="checkmark-circle" />
          <KPICard label="Pending"   value={pending}   color="#F59E0B" bg="#FFFBEB" icon="time" />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Completion</Text>
            <Text style={[styles.progressPct, { color: theme.primary }]}>{pct}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
        </View>

        {/* Booth Demographics */}
        <Text style={styles.sectionTitle}>Booth Demographics</Text>
        <View style={styles.demoRow}>
          <DemoCard label="Male"   value={maleCount}   color="#3B82F6" />
          <DemoCard label="Female" value={femaleCount} color="#EC4899" />
          <DemoCard label="Other"  value={otherCount}  color="#10B981" />
        </View>

        {/* Work Summary */}
        <Text style={styles.sectionTitle}>Work Summary</Text>
        <View style={styles.summaryCard}>
          {[
            { label: 'Completed Today',   value: String(todayDone),      icon: 'today-outline' },
            { label: 'Last Survey Time',  value: fmtTime(lastSurveyTime), icon: 'time-outline' },
            { label: 'Pending Sync',
              value: String(Object.values(responses).filter(r => !r.synced).length),
              icon: 'cloud-upload-outline' },
          ].map(({ label, value, icon }) => (
            <View key={label} style={styles.summaryRow}>
              <View style={styles.summaryLeft}>
                <Ionicons name={icon} size={16} color={theme.textSub} />
                <Text style={styles.summaryLabel}>{label}</Text>
              </View>
              <Text style={styles.summaryValue}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Voting Day Poll Banner */}
        {activePoll && (
          <TouchableOpacity
            style={styles.pollBanner}
            onPress={() => router.push('/poll')}
            activeOpacity={0.85}
          >
            <View style={styles.pollBannerLeft}>
              <View style={styles.pollLiveDot} />
              <View>
                <Text style={styles.pollBannerTag}>VOTING DAY POLL · LIVE</Text>
                <Text style={styles.pollBannerTitle} numberOfLines={1}>{activePoll.question || activePoll.title}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        )}


        <View style={{ height: 24 }} />
      </View>
    </ScrollView>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Morning'
  if (h < 17) return 'Afternoon'
  return 'Evening'
}

const styles = StyleSheet.create({
  header:    { paddingHorizontal: 20, paddingBottom: 28 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  headerGreeting: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  headerName:     { color: '#fff', fontSize: 20, fontWeight: '700', marginTop: 2 },
  boothBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fff', borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  boothBadgeText: { color: theme.primary, fontSize: 12, fontWeight: '700' },

  surveyCard: {
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: theme.radius.xl,
    padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  surveyCardRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  activeDot:         { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ADE80' },
  surveyCardLabel:   { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  surveyCardName:    { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  surveyCardMeta:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  surveyCardMetaText:{ color: 'rgba(255,255,255,0.65)', fontSize: 12 },

  body: { padding: 20, marginTop: -12 },

  sectionTitle: { fontSize: 13, fontWeight: '700', color: theme.textSub, marginBottom: 12, marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.5 },

  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  kpiCard: { flex: 1, borderRadius: theme.radius.lg, padding: 14, alignItems: 'center', gap: 6 },
  kpiValue:{ fontSize: 22, fontWeight: '800' },
  kpiLabel:{ fontSize: 11, color: theme.textSub, fontWeight: '500' },

  progressCard: { backgroundColor: theme.white, borderRadius: theme.radius.lg, padding: 16, marginBottom: 20, ...theme.shadowSm },
  progressHeader:{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel: { fontSize: 13, color: theme.textSub, fontWeight: '600' },
  progressPct:   { fontSize: 15, fontWeight: '800' },
  progressTrack: { height: 8, backgroundColor: theme.background, borderRadius: 4, overflow: 'hidden' },
  progressFill:  { height: '100%', backgroundColor: theme.primary, borderRadius: 4 },

  demoRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  demoCard: {
    flex: 1, backgroundColor: theme.white, borderRadius: theme.radius.lg,
    padding: 14, alignItems: 'center', gap: 6, ...theme.shadowSm,
  },
  demoDot:   { width: 8, height: 8, borderRadius: 4 },
  demoLabel: { fontSize: 11, color: theme.textSub },
  demoValue: { fontSize: 20, fontWeight: '800' },

  summaryCard: { backgroundColor: theme.white, borderRadius: theme.radius.lg, padding: 4, marginBottom: 24, ...theme.shadowSm },
  summaryRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: theme.border },
  summaryLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryLabel:{ color: theme.textSub, fontSize: 13 },
  summaryValue:{ color: theme.text, fontSize: 13, fontWeight: '700' },

  pollBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#E11D48', borderRadius: theme.radius.xl,
    padding: 16, marginBottom: 16, ...theme.shadow,
  },
  pollBannerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  pollLiveDot:     { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff', opacity: 0.9 },
  pollBannerTag:   { color: 'rgba(255,255,255,0.75)', fontSize: 9, fontWeight: '700', letterSpacing: 1.2, marginBottom: 2 },
  pollBannerTitle: { color: '#fff', fontSize: 14, fontWeight: '700', flex: 1 },

  ctaBtn:      { borderRadius: theme.radius.xl, overflow: 'hidden', ...theme.shadow },
  ctaGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18 },
  ctaBtnText:  { color: '#fff', fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },
})
