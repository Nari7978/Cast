import { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Animated, Image,
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
  const router  = useRouter()
  const top     = useSafeAreaInsets().top
  const { agent, activePoll, voters } = useStore()

  const [counts,     setCounts]     = useState({})
  const [submitting, setSubmitting] = useState(null)
  const [loading,    setLoading]    = useState(true)

  const optionCount  = activePoll?.options?.length || 0
  const scaleAnims   = useRef(Array.from({ length: optionCount }, () => new Animated.Value(1))).current
  const flashAnims   = useRef(Array.from({ length: optionCount }, () => new Animated.Value(0))).current
  const floatOpacity = useRef(Array.from({ length: optionCount }, () => new Animated.Value(0))).current
  const floatY       = useRef(Array.from({ length: optionCount }, () => new Animated.Value(0))).current
  const [flashColor, setFlashColor] = useState({}) // idx → 'success' | 'error'

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

  function playSuccess(idx) {
    setFlashColor(c => ({ ...c, [idx]: 'success' }))

    // Card scale pop
    Animated.sequence([
      Animated.timing(scaleAnims[idx], { toValue: 0.94, duration: 70, useNativeDriver: true }),
      Animated.spring(scaleAnims[idx], { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start()

    // Green flash overlay: in → hold → out
    Animated.sequence([
      Animated.timing(flashAnims[idx], { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(flashAnims[idx], { toValue: 0, duration: 550, useNativeDriver: true }),
    ]).start()

    // Floating "+1 ✓" rises up and fades
    floatOpacity[idx].setValue(1)
    floatY[idx].setValue(0)
    Animated.parallel([
      Animated.timing(floatY[idx],       { toValue: -52, duration: 700, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(180),
        Animated.timing(floatOpacity[idx], { toValue: 0, duration: 480, useNativeDriver: true }),
      ]),
    ]).start()
  }

  function playError(idx) {
    setFlashColor(c => ({ ...c, [idx]: 'error' }))

    // Quick shake
    Animated.sequence([
      Animated.timing(scaleAnims[idx], { toValue: 1.03, duration: 60, useNativeDriver: true }),
      Animated.timing(scaleAnims[idx], { toValue: 0.97, duration: 60, useNativeDriver: true }),
      Animated.spring(scaleAnims[idx], { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start()

    // Red flash
    Animated.sequence([
      Animated.timing(flashAnims[idx], { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(flashAnims[idx], { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start()
  }

  async function handleTap(optionLabel, idx) {
    if (submitting !== null) return
    setSubmitting(idx)

    try {
      await supabase.from('poll_responses').insert({
        pollId:     activePoll.id,
        option:     optionLabel,
        boothNo:    String(agent?.boothNo || ''),
        recordedAt: new Date().toISOString(),
      })
      setCounts(prev => ({ ...prev, [optionLabel]: (prev[optionLabel] || 0) + 1 }))
      playSuccess(idx)
    } catch (_) {
      playError(idx)
    }
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

  const total      = Object.values(counts).reduce((s, n) => s + n, 0)
  const boothTotal = voters?.length || 0
  const options    = activePoll.options || []

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
          <Text style={styles.totalNum}>{total}{boothTotal > 0 ? `/${boothTotal}` : ''}</Text>
          <Text style={styles.totalLabel}>responses</Text>
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
            const label   = typeof opt === 'string' ? opt : opt.label
            const imgUrl  = activePoll.optionImages?.[label]
            const count   = counts[label] || 0
            const color   = OPTION_COLORS[idx % OPTION_COLORS.length]
            const isBusy  = submitting === idx
            const isError = flashColor[idx] === 'error'

            return (
              <View key={label} style={styles.optionWrap}>
                {/* Floating +1 ✓ */}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.floatBadge,
                    {
                      opacity:   floatOpacity[idx],
                      transform: [{ translateY: floatY[idx] }],
                      borderColor: color,
                    },
                  ]}
                >
                  <Ionicons name="checkmark-circle" size={14} color={color} />
                  <Text style={[styles.floatText, { color }]}>+1 Recorded</Text>
                </Animated.View>

                <Animated.View style={{ transform: [{ scale: scaleAnims[idx] }] }}>
                  <TouchableOpacity
                    style={[styles.optionBtn, { borderColor: color, minHeight: imgUrl ? 100 : 72 }]}
                    onPress={() => handleTap(label, idx)}
                    activeOpacity={0.9}
                    disabled={submitting !== null}
                  >
                    {/* Flash overlay */}
                    <Animated.View
                      pointerEvents="none"
                      style={[
                        StyleSheet.absoluteFill,
                        {
                          borderRadius: 14,
                          backgroundColor: isError ? '#EF444430' : color + '28',
                          opacity: flashAnims[idx],
                        },
                      ]}
                    />

                    <View style={[styles.optionContent, imgUrl && { paddingVertical: 14 }]}>
                      {imgUrl ? (
                        <Image
                          source={{ uri: imgUrl }}
                          style={[styles.candidatePhoto, { borderColor: color }]}
                        />
                      ) : (
                        <View style={[styles.optionDot, { backgroundColor: color }]} />
                      )}
                      <Text style={[styles.optionLabel, imgUrl && styles.optionLabelLarge]}>{label}</Text>
                      {isBusy
                        ? <ActivityIndicator size="small" color={color} />
                        : <Text style={[styles.optionCount, { color }]}>{count}</Text>
                      }
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            )
          })
        )}

        {/* Coverage row */}
        {!loading && (
          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalRowLabel}>Poll Responses Received</Text>
              {boothTotal > 0 && (
                <Text style={styles.totalRowSub}>out of {boothTotal} booth members</Text>
              )}
            </View>
            <Text style={styles.totalRowValue}>{total}{boothTotal > 0 ? `/${boothTotal}` : ''}</Text>
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
  backBtn:     { padding: 4, marginTop: 2 },
  liveRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  liveDot:     { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
  liveText:    { color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '800', lineHeight: 22 },

  totalBadge: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginTop: 2 },
  totalNum:   { color: '#fff', fontSize: 22, fontWeight: '900' },
  totalLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 9, fontWeight: '700', letterSpacing: 0.8, marginTop: 1 },

  body: { padding: 16 },
  hint: { color: theme.textMuted, fontSize: 12, textAlign: 'center', marginBottom: 20, lineHeight: 17 },

  optionWrap: { marginBottom: 12 },

  floatBadge: {
    position: 'absolute',
    alignSelf: 'center',
    top: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 6,
  },
  floatText: { fontSize: 13, fontWeight: '800' },

  optionBtn: {
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: theme.white,
    ...theme.shadowSm,
    minHeight: 72,
    justifyContent: 'center',
  },
  optionContent: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 18, gap: 12,
  },
  optionDot:        { width: 12, height: 12, borderRadius: 6 },
  optionLabel:      { flex: 1, fontSize: 16, fontWeight: '700', color: theme.text },
  optionLabelLarge: { fontSize: 17, fontWeight: '800' },
  candidatePhoto:   { width: 68, height: 68, borderRadius: 34, borderWidth: 2.5, backgroundColor: '#F1F5F9' },
  optionCount:      { fontSize: 22, fontWeight: '900' },

  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: theme.white, borderRadius: 14, padding: 16,
    marginTop: 4, ...theme.shadowSm,
  },
  totalRowLabel: { color: theme.textSub, fontSize: 13, fontWeight: '600' },
  totalRowSub:   { color: theme.textMuted, fontSize: 11, marginTop: 2 },
  totalRowValue: { color: theme.text, fontSize: 20, fontWeight: '900' },
})
