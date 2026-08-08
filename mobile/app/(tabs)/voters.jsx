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
  completed:   { label: 'Completed',   color: theme.success,  bg: theme.successLight },
  in_progress: { label: 'In Progress', color: theme.warning,  bg: theme.warningLight },
  not_started: { label: 'Not Started', color: theme.textMuted, bg: '#F1F5F9' },
}

function VoterCard({ voter, status, onPress }) {
  const cfg     = STATUS_CFG[status] || STATUS_CFG.not_started
  const initials = (voter.name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.avatar, { backgroundColor: theme.primaryLight }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.cardInfo}>
        <View style={styles.cardTopRow}>
          <Text style={styles.voterName}>{voter.name || '—'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>
        <View style={styles.cardMeta}>
          <MetaChip icon="card-outline"   text={voter.voterId  || voter.voter_id || '—'} />
          <MetaChip icon="person-outline" text={`${voter.age || '—'} · ${voter.gender || '—'}`} />
          <MetaChip icon="home-outline"   text={voter.houseNo  || voter.house_no  || '—'} />
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.border} />
    </TouchableOpacity>
  )
}

function MetaChip({ icon, text }) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon} size={11} color={theme.textMuted} />
      <Text style={styles.chipText}>{text}</Text>
    </View>
  )
}

const FILTERS = ['All', 'Not Started', 'In Progress', 'Completed']

export default function VotersScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { voters, getResponseStatus } = useStore()

  const [search,      setSearch]      = useState('')
  const [activeFilter, setActiveFilter] = useState('All')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return voters.filter(v => {
      const status   = getResponseStatus(v.id)
      const matchQ   = !q || (v.name || '').toLowerCase().includes(q)
        || (v.voterId || v.voter_id || '').toLowerCase().includes(q)
        || (v.houseNo || v.house_no || '').toLowerCase().includes(q)
        || (v.mobile  || '').includes(q)
      const matchF =
        activeFilter === 'All'         ? true :
        activeFilter === 'Completed'   ? status === 'completed'   :
        activeFilter === 'In Progress' ? status === 'in_progress' :
        activeFilter === 'Not Started' ? status === 'not_started' : true
      return matchQ && matchF
    })
  }, [voters, search, activeFilter, getResponseStatus])

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Voter Directory</Text>
        <Text style={styles.headerSub}>{voters.length} voters in your booth</Text>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={16} color={theme.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, voter ID, house no..."
            placeholderTextColor={theme.textMuted}
          />
          {!!search && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={theme.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Filter tabs */}
        <View style={styles.filterRow}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, activeFilter === f && styles.filterTabActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={theme.border} />
            <Text style={styles.emptyText}>No voters found</Text>
          </View>
        }
        renderItem={({ item }) => (
          <VoterCard
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
  headerTitle: { fontSize: 22, fontWeight: '800', color: theme.text },
  headerSub:   { fontSize: 13, color: theme.textSub, marginTop: 2, marginBottom: 14 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.background, borderRadius: theme.radius.lg,
    borderWidth: 1, borderColor: theme.border,
    paddingHorizontal: 14, height: 44, marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: theme.text },

  filterRow: { flexDirection: 'row', gap: 8 },
  filterTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: theme.background },
  filterTabActive: { backgroundColor: theme.primaryLight },
  filterText:      { fontSize: 12, fontWeight: '600', color: theme.textSub },
  filterTextActive:{ color: theme.primary },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: theme.white, borderRadius: theme.radius.lg,
    padding: 14, marginBottom: 10, ...theme.shadowSm,
    borderWidth: 1, borderColor: theme.border,
  },
  avatar:     { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '700', color: theme.primary },
  cardInfo:   { flex: 1 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  voterName:  { fontSize: 14, fontWeight: '700', color: theme.text, flex: 1 },
  statusBadge:{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusText: { fontSize: 10, fontWeight: '700' },
  cardMeta:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip:       { flexDirection: 'row', alignItems: 'center', gap: 3 },
  chipText:   { fontSize: 11, color: theme.textSub },

  empty:     { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: theme.textSub, fontWeight: '600' },
})
