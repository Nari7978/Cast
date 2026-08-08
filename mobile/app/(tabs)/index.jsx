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
import { fetchActiveSurveyData, fetchVotersForBooth, invalidateSurveyCache } from '../../src/services/sync'

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
  const { agent, activeSurvey, activePhase, voters, setActiveSurvey, setActivePhase, setVoters, responses, dataLoadedAt } = useStore()

  const hasData = dataLoadedAt > 0 || voters.length > 0
  const [loading,    setLoading]    = useState(!hasData)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (force = false) => {
    try {
      if (force) invalidateSurveyCache()
      const { activeSurvey: s, activePhase: p } = await fetchActiveSurveyData(agent?.boothNo)
      setActiveSurvey(s)
      setActivePhase(p)
      if (agent?.boothNo) {
        const v = await fetchVotersForBooth(agent.boothNo)
        setVoters(v)
      }
    } catch (_) {}
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

  const maleCount   = voters.filter(v => v.gender === 'Male'   || v.gender === 'M').length
  const femaleCount = voters.filter(v => v.gender === 'Female' || v.gender === 'F').length
  const otherCount  = total - maleCount - femaleCount

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
              <Text style={styles.surveyCardMetaText}>Booth {agent?.boothNo} · {activePhase?.name || 'Active Phase'}</Text>
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

        {/* CTA */}
        {activeSurvey && (
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => router.push('/survey/voters')}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#5B3FD4', '#7B63DC']} style={styles.ctaGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Ionicons name="play-circle" size={22} color="#fff" />
              <Text style={styles.ctaBtnText}>Continue Current Survey</Text>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
            </LinearGradient>
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

  ctaBtn:      { borderRadius: theme.radius.xl, overflow: 'hidden', ...theme.shadow },
  ctaGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18 },
  ctaBtnText:  { color: '#fff', fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },
})
