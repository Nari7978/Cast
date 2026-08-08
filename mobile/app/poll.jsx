import { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Animated,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { theme } from '../src/theme'
import { useStore } from '../src/store/useStore'
import { supabase } from '../src/supabase/config'

const OPTION_COLORS = [
  '#5B3FD4', '#E11D48', '#0EA5E9', '#10B981',
  '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4',
]

export default function PollScreen() {
  const insets  = useRouter()
  const router  = useRouter()
  const top     = useSafeAreaInsets().top
  const { agent, activePoll } = useStore()

  const [counts,    setCounts]    = useState({})
  const [submitting, setSubmitting] = useState(null) // option index being tapped
  const [loading,   setLoading]   = useState(true)
  const scaleAnims = useRef((activePoll?.options || []).map(() => new Animated.Value(1))).current

  // Load existing tally for this poll
  useEffect(() => {
    if (!activePoll) return
    fetchTally()
  }, [activePoll?.id])

  async function fetchTally() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('poll_responses')
        .select('option')
        .eq('pollId', activePoll.id)
      const tally = {}
      ;(data || []).forEach(r => { tally[r.option] = (tally[r.option] || 0) + 1 })
      setCounts(tally)
    } catch (_) {}
    setLoading(false)
  }

  async function handleTap(optionLabel, idx) {
    if (submitting !== null) return
    setSubmitting(idx)

    // Bounce animation
    Animated.sequence([
      Animated.timing(scaleAnims[idx], { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnims[idx],  { toValue: 1,    friction: 4,  useNativeDriver: true }),
    ]).start()

    try {
      await supabase.from('poll_responses').insert({
        pollId:     activePoll.id,
        option:     optionLabel,
        boothNo:    String(agent?.boothNo || ''),
        recordedAt: new Date().toISOString(),
      })
      setCounts(prev => ({ ...prev, [optionLabel]: (prev[optionLabel] || 0) + 1 }))
    } catch (_) {}
    setSubmitting(null)
  }

  if (!activePoll) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <Ionicons name="radio-outline" size={48} color={theme.textMuted} />
        <Text style={{ color: theme.textSub, marginTop: 12, fontSize: 15 }}>No active poll right now</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 24, padding: 12 }}>
          <Text style={{ color: theme.primary, fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const total = Object.values(counts).reduce((s, n) => s + n, 0)
  const options = activePoll.options || []

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: top + 14 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>VOTING DAY POLL · LIVE</Text>
          </View>
          <Text style={styles.headerTitle} numberOfLines={2}>{activePoll.question || activePoll.title}</Text>
        </View>
        <View style={styles.totalBadge}>
          <Text style={styles.totalNum}>{total}</Text>
          <Text style={styles.totalLabel}>votes</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
      >
        <Text style={styles.hint}>Tap an option to record a vote — each tap counts as one vote</Text>

        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
        ) : (
          options.map((opt, idx) => {
            const label = typeof opt === 'string' ? opt : opt.label
            const count = counts[label] || 0
            const pct   = total ? Math.round((count / total) * 100) : 0
            const color = OPTION_COLORS[idx % OPTION_COLORS.length]
            const isBusy = submitting === idx

            return (
              <Animated.View key={label} style={{ transform: [{ scale: scaleAnims[idx] }] }}>
                <TouchableOpacity
                  style={[styles.optionBtn, { borderColor: color }]}
                  onPress={() => handleTap(label, idx)}
                  activeOpacity={0.9}
                  disabled={submitting !== null}
                >
                  <View style={[styles.optionBar, { width: `${pct}%`, backgroundColor: color + '22' }]} />
                  <View style={styles.optionContent}>
                    <View style={[styles.optionDot, { backgroundColor: color }]} />
                    <Text style={styles.optionLabel}>{label}</Text>
                    <View style={styles.optionRight}>
                      {isBusy
                        ? <ActivityIndicator size="small" color={color} />
                        : <Text style={[styles.optionCount, { color }]}>{count}</Text>
                      }
                      <Text style={styles.optionPct}>{pct}%</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            )
          })
        )}

        {/* Total row */}
        {!loading && total > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalRowLabel}>Total Votes Recorded</Text>
            <Text style={styles.totalRowValue}>{total}</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#E11D48',
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  backBtn: { padding: 4, marginTop: 2 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
  liveText: { color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '800', lineHeight: 22 },

  totalBadge: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginTop: 2 },
  totalNum:   { color: '#fff', fontSize: 22, fontWeight: '900' },
  totalLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 9, fontWeight: '700', letterSpacing: 0.8, marginTop: 1 },

  body: { padding: 16 },

  hint: { color: theme.textMuted, fontSize: 12, textAlign: 'center', marginBottom: 20, lineHeight: 17 },

  optionBtn: {
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: theme.white,
    ...theme.shadowSm,
    minHeight: 72,
    justifyContent: 'center',
  },
  optionBar: {
    position: 'absolute', top: 0, left: 0, bottom: 0,
    borderRadius: 14,
  },
  optionContent: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 18, gap: 12,
  },
  optionDot:   { width: 12, height: 12, borderRadius: 6 },
  optionLabel: { flex: 1, fontSize: 16, fontWeight: '700', color: theme.text },
  optionRight: { alignItems: 'flex-end', gap: 2 },
  optionCount: { fontSize: 22, fontWeight: '900' },
  optionPct:   { fontSize: 11, color: theme.textMuted, fontWeight: '600' },

  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: theme.white, borderRadius: 14, padding: 16,
    marginTop: 4, ...theme.shadowSm,
  },
  totalRowLabel: { color: theme.textSub, fontSize: 13, fontWeight: '600' },
  totalRowValue: { color: theme.text,    fontSize: 20, fontWeight: '900' },
})
