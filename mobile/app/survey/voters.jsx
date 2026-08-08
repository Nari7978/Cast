import { useState, useMemo } from 'react'
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, Pressable,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { theme } from '../../src/theme'
import { useStore } from '../../src/store/useStore'

const STATUS_CFG = {
  completed:   { label: 'Done',        color: theme.success,  bg: theme.successLight, icon: 'checkmark-circle' },
  in_progress: { label: 'In Progress', color: theme.warning,  bg: theme.warningLight, icon: 'time' },
  not_started: { label: 'Pending',     color: theme.textMuted, bg: '#F1F5F9',          icon: 'ellipse-outline' },
}

const FILTERS = ['All', 'Pending', 'In Progress', 'Done']

function VoterRow({ voter, status, onPress }) {
  const cfg     = STATUS_CFG[status] || STATUS_CFG.not_started
  const initials = (voter.name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.rowAvatar, { backgroundColor: status === 'completed' ? theme.successLight : theme.primaryLight }]}>
        <Text style={[styles.rowAvatarText, { color: status === 'completed' ? theme.success : theme.primary }]}>{initials}</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>{voter.name || '—'}</Text>
        <View style={styles.rowMeta}>
          <Text style={styles.rowMetaText}>{voter.voterId || voter.voter_id || '—'}</Text>
          <Text style={styles.rowMetaDot}>·</Text>
          <Text style={styles.rowMetaText}>{voter.age || '—'} yrs</Text>
          <Text style={styles.rowMetaDot}>·</Text>
          <Text style={styles.rowMetaText}>{voter.houseNo || voter.house_no || '—'}</Text>
        </View>
      </View>
      <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
        <Ionicons name={cfg.icon} size={12} color={cfg.color} />
        <Text style={[styles.statusPillText, { color: cfg.color }]}>{cfg.label}</Text>
      </View>
    </TouchableOpacity>
  )
}

export default function SurveyVotersScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { voters, activeSurvey, activePhase, agent, getResponseStatus } = useStore()

  const [search,       setSearch]       = useState('')
  const [activeFilter, setActiveFilter] = useState('All')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return voters.filter(v => {
      const status = getResponseStatus(v.id)
      const matchQ = !q
        || (v.name || '').toLowerCase().includes(q)
        || (v.voterId || v.voter_id || '').toLowerCase().includes(q)
        || (v.houseNo || v.house_no || '').toLowerCase().includes(q)
        || (v.mobile || '').includes(q)
      const matchF =
        activeFilter === 'All'         ? true :
        activeFilter === 'Done'        ? status === 'completed'   :
        activeFilter === 'In Progress' ? status === 'in_progress' :
        activeFilter === 'Pending'     ? status === 'not_started' : true
      return matchQ && matchF
    })
  }, [voters, search, activeFilter, getResponseStatus])

  const counts = useMemo(() => ({
    total:       voters.length,
    completed:   voters.filter(v => getResponseStatus(v.id) === 'completed').length,
    in_progress: voters.filter(v => getResponseStatus(v.id) === 'in_progress').length,
    not_started: voters.filter(v => getResponseStatus(v.id) === 'not_started').length,
  }), [voters, getResponseStatus])

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
            <Text style={styles.boothText}>Booth {agent?.boothNo} · {activePhase?.name || 'Active Phase'}</Text>
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
        contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={theme.border} />
            <Text style={styles.emptyText}>No voters found</Text>
          </View>
        }
        renderItem={({ item }) => (
          <VoterRow
            voter={item}
            status={getResponseStatus(item.id)}
            onPress={() => router.push(`/survey/${item.id}`)}
          />
        )}
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
  rowAvatar:     { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  rowAvatarText: { fontSize: 14, fontWeight: '800' },
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
