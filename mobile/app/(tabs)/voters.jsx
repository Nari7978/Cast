import { useState, useMemo, useCallback, memo, useEffect } from 'react'
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, Pressable, ActivityIndicator, RefreshControl,
  Modal, ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { theme } from '../../src/theme'
import { useStore } from '../../src/store/useStore'
import { fetchVotersForBooth } from '../../src/services/sync'

// Keys to hide from the detail popup (internal/system fields)
const HIDDEN_KEYS = new Set(['id', 'boothNo', 'boothno', 'inserted_at', 'updatedAt'])

// Friendly label map for known CSV keys
const FIELD_LABELS = {
  SNO:            'S.No',
  VOTER_ID:       'Voter ID',
  VOTER_NAME:     'Voter Name',
  FATHER_NAME:    "Father's Name",
  AGE:            'Age',
  GENDER:         'Gender',
  HOUSE_NO:       'House No',
  POLLING_STATION:'Polling Station',
  BOOTH_NO:       'Booth No',
  MOBILE:         'Mobile',
  EPIC_NO:        'EPIC No',
}

function friendlyLabel(key) {
  return FIELD_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// Voter field helpers
const vName    = v => v.VOTER_NAME || v.name       || v.voterName  || v.voter_name  || ''
const vId      = v => v.VOTER_ID   || v.EPIC_NO    || v.epicNo     || v.voterId     || v.voter_id    || ''
const vAge     = v => v.AGE        || v.age        || ''
const vGender  = v => v.GENDER     || v.gender     || ''
const vHouseNo = v => v.HOUSE_NO   || v.HOUSENO    || v.houseNo    || v.house_no    || ''

const GENDER_COLOR = { Male: '#3B82F6', MALE: '#3B82F6', M: '#3B82F6', Female: '#EC4899', FEMALE: '#EC4899', F: '#EC4899', पुरुष: '#3B82F6', महिला: '#EC4899' }

// ── Voter detail popup ─────────────────────────────────────────────────────────
function VoterDetailModal({ voter, onClose }) {
  const insets = useSafeAreaInsets()
  if (!voter) return null

  const name     = vName(voter)
  const gender   = vGender(voter)
  const gColor   = GENDER_COLOR[gender] || theme.primary
  const initials = name ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?'

  // Collect all fields from voter object, skip hidden/internal ones
  const fields = Object.entries(voter).filter(([k, v]) =>
    !HIDDEN_KEYS.has(k) && !HIDDEN_KEYS.has(k.toLowerCase()) && v !== '' && v !== null && v !== undefined
  )

  // Sort: known CSV keys first in order, then rest alphabetically
  const ORDER = Object.keys(FIELD_LABELS)
  fields.sort(([a], [b]) => {
    const ai = ORDER.indexOf(a), bi = ORDER.indexOf(b)
    if (ai !== -1 && bi !== -1) return ai - bi
    if (ai !== -1) return -1
    if (bi !== -1) return 1
    return a.localeCompare(b)
  })

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose} />
      <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
        {/* Handle */}
        <View style={styles.sheetHandle} />

        {/* Header */}
        <View style={styles.sheetHeader}>
          <View style={[styles.sheetAvatar, { backgroundColor: gColor + '20' }]}>
            <Text style={[styles.sheetAvatarText, { color: gColor }]}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sheetName} numberOfLines={2}>{name || '—'}</Text>
            <Text style={styles.sheetId}>{vId(voter) || '—'}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={theme.textSub} />
          </TouchableOpacity>
        </View>

        {/* All fields */}
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          <View style={styles.fieldList}>
            {fields.map(([key, val]) => (
              <View key={key} style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>{friendlyLabel(key)}</Text>
                <Text style={styles.fieldValue}>{String(val)}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  )
}

// ── Voter card ─────────────────────────────────────────────────────────────────
const VoterCard = memo(function VoterCard({ voter, onPress }) {
  const name     = vName(voter)
  const initials = name ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?'
  const gender   = vGender(voter)
  const gColor   = GENDER_COLOR[gender] || theme.primary

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.avatar, { backgroundColor: gColor + '18' }]}>
        <Text style={[styles.avatarText, { color: gColor }]}>{initials}</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.voterName} numberOfLines={1}>{name || '—'}</Text>
        <View style={styles.cardMeta}>
          <MetaChip icon="card-outline"   text={vId(voter) || '—'} />
          <MetaChip icon="person-outline" text={[vAge(voter), vGender(voter)].filter(Boolean).join(' · ') || '—'} />
          <MetaChip icon="home-outline"   text={vHouseNo(voter) || '—'} />
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.border} />
    </TouchableOpacity>
  )
})

function MetaChip({ icon, text }) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon} size={11} color={theme.textMuted} />
      <Text style={styles.chipText}>{text}</Text>
    </View>
  )
}

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function VotersScreen() {
  const insets = useSafeAreaInsets()
  const agent  = useStore(s => s.agent)

  const [voters,      setVoters]      = useState([])
  const [loading,     setLoading]     = useState(true)
  const [refreshing,  setRefreshing]  = useState(false)
  const [search,      setSearch]      = useState('')
  const [selected,    setSelected]    = useState(null)

  const load = useCallback(async () => {
    if (!agent?.boothNo) { setLoading(false); return }
    try {
      const data = await fetchVotersForBooth(agent.boothNo)
      setVoters(data)
    } catch (_) {}
    setLoading(false)
    setRefreshing(false)
  }, [agent?.boothNo])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    if (!search) return voters
    const q = search.toLowerCase()
    return voters.filter(v =>
      vName(v).toLowerCase().includes(q)
      || vId(v).toLowerCase().includes(q)
      || vHouseNo(v).toLowerCase().includes(q)
      || (v.MOBILE || v.mobile || '').includes(q)
    )
  }, [voters, search])

  const renderItem = useCallback(({ item }) => (
    <VoterCard voter={item} onPress={() => setSelected(item)} />
  ), [])

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
        <Text style={styles.headerTitle}>Voter Directory</Text>
        <Text style={styles.headerSub}>{voters.length} voters in your booth</Text>

        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={16} color={theme.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, voter ID, house no..."
            placeholderTextColor={theme.textMuted}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {!!search && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={theme.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor={theme.primary} />}
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

      <VoterDetailModal voter={selected} onClose={() => setSelected(null)} />
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

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: theme.white, borderRadius: theme.radius.lg,
    padding: 14, marginBottom: 10, ...theme.shadowSm,
    borderWidth: 1, borderColor: theme.border,
  },
  avatar:     { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '700', color: theme.primary },
  cardInfo:   { flex: 1 },
  voterName:  { fontSize: 14, fontWeight: '700', color: theme.text, marginBottom: 4 },
  cardMeta:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip:       { flexDirection: 'row', alignItems: 'center', gap: 3 },
  chipText:   { fontSize: 11, color: theme.textSub },

  empty:     { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: theme.textSub, fontWeight: '600' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: theme.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '80%', paddingTop: 12, paddingHorizontal: 20,
    ...theme.shadow,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border, alignSelf: 'center', marginBottom: 16 },

  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  sheetAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  sheetAvatarText: { fontSize: 18, fontWeight: '800' },
  sheetName:   { fontSize: 16, fontWeight: '800', color: theme.text },
  sheetId:     { fontSize: 12, color: theme.textSub, marginTop: 2 },
  closeBtn:    { padding: 6, backgroundColor: theme.background, borderRadius: 999 },

  fieldList: { gap: 1, borderRadius: theme.radius.lg, overflow: 'hidden', marginBottom: 16 },
  fieldRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: theme.background, paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: theme.border,
  },
  fieldLabel: { fontSize: 12, color: theme.textSub, fontWeight: '600', flex: 1 },
  fieldValue: { fontSize: 13, color: theme.text, fontWeight: '600', flex: 2, textAlign: 'right' },
})
