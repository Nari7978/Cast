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

// CSV column order and friendly labels
const CSV_FIELDS = [
  { key: 'SNO',              label: 'S.No'            },
  { key: 'VOTER_ID',         label: 'Voter ID'        },
  { key: 'VOTER_NAME',       label: 'Voter Name'      },
  { key: 'FATHER_NAME',      label: "Father's Name"   },
  { key: 'AGE',              label: 'Age'             },
  { key: 'GENDER',           label: 'Gender'          },
  { key: 'HOUSE_NO',         label: 'House No'        },
  { key: 'POLLING_STATION',  label: 'Polling Station' },
  { key: 'BOOTH_NO',         label: 'Booth No'        },
]
const KNOWN_KEYS  = new Set(CSV_FIELDS.map(f => f.key))
const HIDDEN_KEYS = new Set(['id', 'boothNo', 'boothno', 'inserted_at', 'updatedAt'])

// Voter field helpers
const vName    = v => v.VOTER_NAME || v.name    || ''
const vId      = v => v.VOTER_ID   || v.EPIC_NO || v.epicNo || ''
const vAge     = v => v.AGE        || v.age     || ''
const vGender  = v => v.GENDER     || v.gender  || ''
const vHouseNo = v => v.HOUSE_NO   || v.HOUSENO || v.houseNo || ''

const GENDER_COLOR = {
  Male: '#3B82F6', MALE: '#3B82F6', M: '#3B82F6',
  Female: '#EC4899', FEMALE: '#EC4899', F: '#EC4899',
  पुरुष: '#3B82F6', महिला: '#EC4899',
}

// ── Voter detail bottom sheet ───────────────────────────────────────────────────
function VoterDetailModal({ voter, response, onClose }) {
  const insets = useSafeAreaInsets()
  if (!voter) return null

  const name     = vName(voter)
  const gender   = vGender(voter)
  const gColor   = GENDER_COLOR[gender] || theme.primary
  const initials = name ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?'

  // Build ordered field list: known CSV keys first, then any extra keys
  const knownFields = CSV_FIELDS
    .map(f => ({ label: f.label, value: voter[f.key] }))
    .filter(f => f.value !== undefined && f.value !== null && f.value !== '')

  const extraFields = Object.entries(voter)
    .filter(([k, v]) => !KNOWN_KEYS.has(k) && !HIDDEN_KEYS.has(k) && !HIDDEN_KEYS.has(k.toLowerCase()) && v !== '' && v !== null && v !== undefined)
    .map(([k, v]) => ({ label: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), value: String(v) }))

  const allFields = [...knownFields, ...extraFields]

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        {/* Tap-to-close overlay */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        {/* Sheet */}
        <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 12 }]}>
          {/* Handle */}
          <View style={styles.sheetHandle} />

          {/* Voter header */}
          <View style={styles.sheetHeader}>
            <View style={[styles.sheetAvatar, { backgroundColor: gColor + '20' }]}>
              <Text style={[styles.sheetAvatarText, { color: gColor }]}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetName} numberOfLines={2}>{name || '—'}</Text>
              <Text style={styles.sheetId}>{vId(voter) || '—'}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={10}>
              <Ionicons name="close" size={18} color={theme.textSub} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {/* All voter fields */}
            <Text style={styles.sectionTitle}>Voter Details</Text>
            <View style={styles.fieldCard}>
              {allFields.map(({ label, value }, idx) => (
                <View key={label} style={[styles.fieldRow, idx === allFields.length - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={styles.fieldLabel}>{label}</Text>
                  <Text style={styles.fieldValue}>{String(value)}</Text>
                </View>
              ))}
            </View>

            {/* Survey participation */}
            {response && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Survey Participation</Text>
                <View style={styles.fieldCard}>
                  <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.fieldLabel}>Status</Text>
                    <View style={[styles.statusBadge, { backgroundColor: response.submittedAt ? '#ECFDF5' : '#FFFBEB' }]}>
                      <Text style={[styles.statusText, { color: response.submittedAt ? '#10B981' : '#F59E0B' }]}>
                        {response.submittedAt ? 'Submitted' : 'In Progress'}
                      </Text>
                    </View>
                  </View>
                  {response.submittedAt && (
                    <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
                      <Text style={styles.fieldLabel}>Submitted At</Text>
                      <Text style={styles.fieldValue}>
                        {new Date(response.submittedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  )}
                  {response.answers && Object.keys(response.answers).length > 0 && (
                    Object.entries(response.answers).map(([qId, ans], i) => (
                      <View key={qId} style={[styles.fieldRow, i === Object.keys(response.answers).length - 1 && { borderBottomWidth: 0 }]}>
                        <Text style={[styles.fieldLabel, { flex: 1.2 }]}>{qId}</Text>
                        <Text style={[styles.fieldValue, { flex: 1.8 }]}>
                          {Array.isArray(ans) ? ans.join(', ') : String(ans || '—')}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              </>
            )}

            {!response && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Survey Participation</Text>
                <View style={[styles.fieldCard, { alignItems: 'center', paddingVertical: 18 }]}>
                  <Ionicons name="document-outline" size={28} color={theme.border} />
                  <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 8 }}>No survey submitted yet</Text>
                </View>
              </>
            )}

            <View style={{ height: 16 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

// ── Voter card ─────────────────────────────────────────────────────────────────
const VoterCard = memo(function VoterCard({ voter, done, onPress }) {
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
      {done
        ? <Ionicons name="checkmark-circle" size={20} color="#10B981" />
        : <Ionicons name="chevron-forward"  size={16} color={theme.border} />
      }
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
  const insets    = useSafeAreaInsets()
  const agent     = useStore(s => s.agent)
  const responses = useStore(s => s.responses)

  const [voters,     setVoters]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search,     setSearch]     = useState('')
  const [selected,   setSelected]   = useState(null)

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
    <VoterCard
      voter={item}
      done={!!responses[item.id]?.submittedAt}
      onPress={() => setSelected(item)}
    />
  ), [responses])

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

      <VoterDetailModal
        voter={selected}
        response={selected ? responses[selected.id] : null}
        onClose={() => setSelected(null)}
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

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: theme.white, borderRadius: theme.radius.lg,
    padding: 14, marginBottom: 10, ...theme.shadowSm,
    borderWidth: 1, borderColor: theme.border,
  },
  avatar:     { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '700' },
  cardInfo:   { flex: 1 },
  voterName:  { fontSize: 14, fontWeight: '700', color: theme.text, marginBottom: 4 },
  cardMeta:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip:       { flexDirection: 'row', alignItems: 'center', gap: 3 },
  chipText:   { fontSize: 11, color: theme.textSub },

  empty:     { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: theme.textSub, fontWeight: '600' },

  // Bottom sheet
  modalSheet: {
    backgroundColor: theme.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12,
    maxHeight: '88%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 20,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: theme.border, alignSelf: 'center', marginBottom: 16,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  sheetAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  sheetAvatarText: { fontSize: 18, fontWeight: '800' },
  sheetName:   { fontSize: 16, fontWeight: '800', color: theme.text },
  sheetId:     { fontSize: 12, color: theme.textSub, marginTop: 2 },
  closeBtn:    { padding: 6, backgroundColor: theme.background, borderRadius: 999 },

  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: theme.textSub,
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8,
  },
  fieldCard: {
    backgroundColor: theme.background, borderRadius: theme.radius.lg,
    borderWidth: 1, borderColor: theme.border, overflow: 'hidden',
  },
  fieldRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: theme.border,
  },
  fieldLabel: { fontSize: 12, color: theme.textSub, fontWeight: '600', flex: 1 },
  fieldValue: { fontSize: 13, color: theme.text, fontWeight: '600', flex: 2, textAlign: 'right' },

  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  statusText:  { fontSize: 11, fontWeight: '700' },
})
