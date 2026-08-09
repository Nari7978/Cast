import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { theme } from '../../src/theme'
import { useStore } from '../../src/store/useStore'
import { fetchActiveSurveyData, invalidateSurveyCache } from '../../src/services/sync'

const STATUS_CFG = {
  Active:    { color: theme.success,  bg: theme.successLight,  icon: 'play-circle',         label: 'Active'    },
  Upcoming:  { color: theme.info,     bg: theme.infoLight,     icon: 'time-outline',         label: 'Upcoming'  },
  Completed: { color: theme.textMuted, bg: '#F1F5F9',           icon: 'checkmark-circle',     label: 'Completed' },
}

function PhaseCard({ phase, survey, isActive, onPress }) {
  const cfg = STATUS_CFG[phase.status] || STATUS_CFG.Upcoming
  const pct = phase.booths ? Math.round(((phase.completedBooths || 0) / phase.booths) * 100) : 0

  return (
    <TouchableOpacity
      style={[styles.card, isActive && styles.cardActive, !isActive && styles.cardDisabled]}
      onPress={isActive ? onPress : undefined}
      activeOpacity={isActive ? 0.85 : 1}
    >
      {isActive && <View style={styles.activeAccent} />}
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon} size={20} color={cfg.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.phaseName, !isActive && { color: theme.textMuted }]}>{phase.name || 'Unnamed Phase'}</Text>
            <Text style={styles.surveyName}>{survey?.name || survey?.title || '—'}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      {isActive && (
        <>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressPct}>{pct}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
          <View style={styles.metaRow}>
            {[
              { icon: 'location-outline', text: `${phase.booths || 0} Booths` },
              { icon: 'people-outline',   text: `${phase.agentsAssigned || 0} Agents` },
              { icon: 'document-text-outline', text: `${phase.responses || 0} Responses` },
            ].map(({ icon, text }) => (
              <View key={text} style={styles.metaItem}>
                <Ionicons name={icon} size={12} color={theme.textSub} />
                <Text style={styles.metaText}>{text}</Text>
              </View>
            ))}
          </View>
          <View style={styles.ctaRow}>
            <Text style={styles.ctaText}>Tap to open voter list</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.primary} />
          </View>
        </>
      )}

      {!isActive && (
        <View style={styles.lockedRow}>
          <Ionicons name={phase.status === 'Completed' ? 'checkmark-circle-outline' : 'lock-closed-outline'} size={14} color={theme.textMuted} />
          <Text style={styles.lockedText}>
            {phase.status === 'Completed' ? 'Phase completed' : 'Phase not yet started'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

export default function TasksScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { agent, activeSurvey, activePhase, setActiveSurvey, setActivePhase } = useStore()
  const [phases,     setPhases]     = useState([])
  const [surveys,    setSurveys]    = useState([])
  const [loading,    setLoading]    = useState(!activeSurvey)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (force = false) => {
    try {
      if (force) invalidateSurveyCache()
      const res = await fetchActiveSurveyData(agent?.boothNo)
      setPhases(res.phases   || [])
      setSurveys(res.surveys || [])
      setActiveSurvey(res.activeSurvey)
      setActivePhase(res.activePhase)
    } catch (_) {}
    setLoading(false)
    setRefreshing(false)
  }, [agent?.boothNo])

  useEffect(() => { load(false) }, [])

  const getSurvey = (phase) => surveys.find(s => s.id === phase.surveyId) || activeSurvey

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Tasks</Text>
        <Text style={styles.headerSub}>Your survey assignments</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true) }} tintColor={theme.primary} />}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
      >
        {phases.length > 0 ? (
          phases.map(phase => (
            <PhaseCard
              key={phase.id}
              phase={phase}
              survey={getSurvey(phase)}
              isActive={phase.status === 'Active'}
              onPress={() => router.push('/survey/voters')}
            />
          ))
        ) : activeSurvey ? (
          <TouchableOpacity
            style={[styles.card, styles.cardActive]}
            onPress={() => router.push('/survey/voters')}
            activeOpacity={0.85}
          >
            <View style={styles.activeAccent} />
            <View style={styles.cardHeader}>
              <View style={styles.cardLeft}>
                <View style={[styles.iconWrap, { backgroundColor: theme.primaryLight }]}>
                  <Ionicons name="clipboard" size={20} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.phaseName}>{activeSurvey.name || activeSurvey.title || 'Active Survey'}</Text>
                  <Text style={styles.surveyName}>Survey in progress</Text>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: theme.successLight }]}>
                <Text style={[styles.statusText, { color: theme.success }]}>Active</Text>
              </View>
            </View>
            <View style={styles.ctaRow}>
              <Text style={styles.ctaText}>Tap to open voter list</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.primary} />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.empty}>
            <Ionicons name="clipboard-outline" size={48} color={theme.border} />
            <Text style={styles.emptyText}>No tasks assigned yet</Text>
            <Text style={styles.emptySub}>Contact your supervisor to get assigned to a survey.</Text>
          </View>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  header: { backgroundColor: theme.white, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: theme.border },
  headerTitle: { fontSize: 22, fontWeight: '800', color: theme.text },
  headerSub:   { fontSize: 13, color: theme.textSub, marginTop: 2 },

  card: {
    backgroundColor: theme.white, borderRadius: theme.radius.xl,
    padding: 16, marginBottom: 14, borderWidth: 1.5, borderColor: theme.border,
    overflow: 'hidden', ...theme.shadowSm,
  },
  cardActive:   { borderColor: theme.primary + '40' },
  cardDisabled: { opacity: 0.65 },
  activeAccent: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 3, backgroundColor: theme.primary,
  },

  cardHeader:  { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 },
  cardLeft:    { flexDirection: 'row', gap: 12, flex: 1 },
  iconWrap:    { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  phaseName:   { fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 2 },
  surveyName:  { fontSize: 12, color: theme.textSub },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText:  { fontSize: 11, fontWeight: '700' },

  progressRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel:{ fontSize: 12, color: theme.textSub },
  progressPct:  { fontSize: 12, fontWeight: '700', color: theme.primary },
  progressTrack:{ height: 6, backgroundColor: theme.background, borderRadius: 3, overflow: 'hidden', marginBottom: 14 },
  progressFill: { height: '100%', backgroundColor: theme.primary, borderRadius: 3 },

  metaRow:  { flexDirection: 'row', gap: 16, marginBottom: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: theme.textSub },

  ctaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: theme.border },
  ctaText:{ fontSize: 12, fontWeight: '600', color: theme.primary },

  lockedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 4 },
  lockedText:{ fontSize: 12, color: theme.textMuted },

  empty:     { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16, fontWeight: '700', color: theme.textSub },
  emptySub:  { fontSize: 13, color: theme.textMuted, textAlign: 'center' },
})
