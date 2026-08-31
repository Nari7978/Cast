import { useState, useMemo, useCallback, memo, useEffect } from 'react'
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, Pressable,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { theme } from '../../src/theme'
import { useStore } from '../../src/store/useStore'
import { fetchBoothResponses, getBoothNos } from '../../src/services/sync'

const STATUS_CFG = {
  completed:   { label: 'Done',        color: theme.success,  bg: theme.successLight, icon: 'checkmark-circle' },
  in_progress: { label: 'In Progress', color: theme.warning,  bg: theme.warningLight, icon: 'time' },
  not_started: { label: 'Pending',     color: theme.textMuted, bg: '#F1F5F9',          icon: 'ellipse-outline' },
}

const FILTERS = ['All', 'Pending', 'In Progress', 'Done']

// Field helpers — handles CSV-style (VOTER_NAME) and camelCase keys
const vName    = v => v.VOTER_NAME || v.ELECTOR_NAME || v.elector_name || v.name || v.voterName || v.voter_name || ''
const vId      = v => v.EPIC_NO    || v.VOTER_ID    || v.epicNo       || v.voterId   || v.voter_id   || ''
const vAge     = v => v.AGE        || v.age          || ''
const vHouseNo = v => v.HOUSE_NO   || v.HOUSENO      || v.houseNo     || v.house_no  || ''

const VoterRow = memo(function VoterRow({ voter, status, onPress }) {
  const cfg  = STATUS_CFG[status] || STATUS_CFG.not_started
  const name = vName(voter)

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName} numberOfLines={1}>{name || '—'}</Text>
        <View style={styles.rowMeta}>
          <Text style={styles.rowMetaText}>{vId(voter) || '—'}</Text>
          <Text style={styles.rowMetaDot}>·</Text>
          <Text style={styles.rowMetaText}>{vAge(voter) ? `${vAge(voter)} yrs` : '—'}</Text>
          <Text style={styles.rowMetaDot}>·</Text>
          <Text style={styles.rowMetaText}>{vHouseNo(voter) || '—'}</Text>
        </View>
      </View>
      <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
        <Ionicons name={cfg.icon} size={12} color={cfg.color} />
        <Text style={[styles.statusPillText, { color: cfg.color }]}>{cfg.label}</Text>
      </View>
    </TouchableOpacity>
  )
})

function getStatus(responses, voterId) {
  const r = responses[voterId]
  if (!r) return 'not_started'
  if (r.submittedAt) return 'completed'
  return 'in_progress'
}

export default function SurveyVotersScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const voters      = useStore(s => s.voters)
  const responses   = useStore(s => s.responses)
  const activeSurvey = useStore(s => s.activeSurvey)
  const activePhase  = useStore(s => s.activePhase)
  const agent        = useStore(s => s.agent)

  const [search,       setSearch]       = useState('')
  const [activeFilter, setActiveFilter] = useState('All')

  useEffect(() => {
    const boothNos = getBoothNos(agent)
    if (!boothNos.length) return
    const { mergeServerResponses } = useStore.getState()
    fetchBoothResponses(boothNos, activeSurvey?.id)
      .then(mergeServerResponses)
      .catch(() => {})
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return voters.filter(v => {
      const status = getStatus(responses, v.id)
      const matchQ = !q
        || vName(v).toLowerCase().includes(q)
        || vId(v).toLowerCase().includes(q)
        || vHouseNo(v).toLowerCase().includes(q)
        || (v.mobile || '').includes(q)
      const matchF =
        activeFilter === 'All'         ? true :
        activeFilter === 'Done'        ? status === 'completed'   :
        activeFilter === 'In Progress' ? status === 'in_progress' :
        activeFilter === 'Pending'     ? status === 'not_started' : true
      return matchQ && matchF
    })
  }, [voters, search, activeFilter, responses])

  const counts = useMemo(() => {
    const completed   = voters.filter(v => getStatus(responses, v.id) === 'completed').length
    const in_progress = voters.filter(v => getStatus(responses, v.id) === 'in_progress').length
    return { total: voters.length, completed, in_progress, not_started: voters.length - completed - in_progress }
  }, [voters, responses])

  const renderItem = useCallback(({ item }) => (
    <VoterRow
      voter={item}
      status={getStatus(responses, item.id)}
      onPress={() => router.push(`/survey/${item.id}`)}
    />
  ), [responses, router])

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={theme.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.surveyName}>{activeSurvey?.name || activeSurvey?.title || 'Survey'}</Text>
            <Text style={styles.boothText} numberOfLines={1}>
              {agent?.boothNos?.length > 1
                ? `Booths ${agent.boothNos.join(', ')}`
                : `Booth ${agent?.boothNo}${agent?.station ? ' · ' + agent.station : ''}`}
              {' · '}{activePhase?.name || 'Active Phase'}
            </Text>
          </View>
        </View>

        {/* Mini progress */}
        <View style={styles.miniProgress}>
          <View style={styles.miniProgressTrack}>
            <View style={[styles.miniProgressFill, { width: `${counts.total ? Math.round(counts.completed / counts.total * 100) : 0}%` }]} />
          </View>
          <Text style={styles.miniProgressText}>{counts.completed}/{counts.total}</Text>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={16} color={theme.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search voter, ID, house no..."
            placeholderTextColor={theme.textMuted}
          />
          {!!search && <Pressable onPress={() => setSearch('')}><Ionicons name="close-circle" size={16} color={theme.textMuted} /></Pressable>}
        </View>

        {/* Filters */}
        <View style={styles.filterRow}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f} style={[styles.filterTab, activeFilter === f && styles.filterTabActive]} onPress={() => setActiveFilter(f)}>
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews
        keyboardShouldPersistTaps="handled"
        overScrollMode="never"
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={theme.border} />
            <Text style={styles.emptyText}>No voters found</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  header: { backgroundColor: theme.white, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.border },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  backBtn:   { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: theme.background },
  surveyName:{ fontSize: 15, fontWeight: '700', color: theme.text },
  boothText: { fontSize: 12, color: theme.textSub },

  miniProgress:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  miniProgressTrack:{ flex: 1, height: 6, backgroundColor: theme.background, borderRadius: 3, overflow: 'hidden' },
  miniProgressFill: { height: '100%', backgroundColor: theme.primary, borderRadius: 3 },
  miniProgressText: { fontSize: 12, fontWeight: '700', color: theme.primary, minWidth: 40, textAlign: 'right' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: theme.background, borderRadius: theme.radius.lg,
    borderWidth: 1, borderColor: theme.border,
    paddingHorizontal: 12, height: 42, marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: theme.text },

  filterRow:       { flexDirection: 'row', gap: 8 },
  filterTab:       { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: theme.background },
  filterTabActive: { backgroundColor: theme.primaryLight },
  filterText:      { fontSize: 12, fontWeight: '600', color: theme.textSub },
  filterTextActive:{ color: theme.primary },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: theme.white, borderRadius: theme.radius.lg,
    padding: 14, marginBottom: 8, ...theme.shadowSm,
    borderWidth: 1, borderColor: theme.border,
  },
  rowInfo:       { flex: 1 },
  rowName:       { fontSize: 14, fontWeight: '700', color: theme.text, marginBottom: 4 },
  rowMeta:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowMetaText:   { fontSize: 11, color: theme.textSub },
  rowMetaDot:    { fontSize: 11, color: theme.border },
  statusPill:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  statusPillText:{ fontSize: 10, fontWeight: '700' },

  empty:     { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: theme.textSub, fontWeight: '600' },
})
