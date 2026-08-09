import { useState, useMemo } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Pressable, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import uuid from 'react-native-uuid'
import { theme } from '../../src/theme'
import { useStore } from '../../src/store/useStore'

const vName    = v => v.VOTER_NAME || v.ELECTOR_NAME || v.elector_name || v.name || v.voterName || v.voter_name || ''
const vId      = v => v.EPIC_NO    || v.VOTER_ID   || v.epicNo     || v.voterId    || v.voter_id   || ''
const vAge     = v => v.AGE        || v.age         || ''
const vGender  = v => v.GENDER     || v.SEX         || v.gender     || v.sex        || ''
const vHouseNo = v => v.HOUSE_NO   || v.HOUSENO     || v.houseNo    || v.house_no   || ''

// ── Question Renderer ────────────────────────────────────────────────────────

function SingleChoice({ question, value, onChange }) {
  return (
    <View style={styles.optionsWrap}>
      {(question.options || []).map(opt => {
        const selected = value === opt
        return (
          <TouchableOpacity
            key={opt}
            style={[styles.optionBtn, selected && styles.optionBtnSelected]}
            onPress={() => onChange(selected ? '' : opt)}
            activeOpacity={0.8}
          >
            <View style={[styles.optionCircle, selected && styles.optionCircleSelected]}>
              {selected && <View style={styles.optionDot} />}
            </View>
            <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{opt}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

function MultiChoice({ question, value = [], onChange }) {
  const toggle = (opt) => {
    const arr = Array.isArray(value) ? value : []
    onChange(arr.includes(opt) ? arr.filter(v => v !== opt) : [...arr, opt])
  }
  return (
    <View style={styles.optionsWrap}>
      {(question.options || []).map(opt => {
        const selected = Array.isArray(value) && value.includes(opt)
        return (
          <TouchableOpacity
            key={opt}
            style={[styles.optionBtn, selected && styles.optionBtnSelected]}
            onPress={() => toggle(opt)}
            activeOpacity={0.8}
          >
            <View style={[styles.optionCheck, selected && styles.optionCheckSelected]}>
              {selected && <Ionicons name="checkmark" size={12} color="#fff" />}
            </View>
            <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{opt}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

function DropdownChoice({ question, value, onChange }) {
  return (
    <View style={styles.optionsWrap}>
      {(question.options || []).map(opt => {
        const selected = value === opt
        return (
          <TouchableOpacity
            key={opt}
            style={[styles.dropdownOpt, selected && styles.dropdownOptSelected]}
            onPress={() => onChange(opt)}
            activeOpacity={0.8}
          >
            <Text style={[styles.dropdownOptText, selected && { color: theme.primary, fontWeight: '700' }]}>{opt}</Text>
            {selected && <Ionicons name="checkmark-circle" size={16} color={theme.primary} />}
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

function TextAnswer({ question, value, onChange, multiline }) {
  return (
    <TextInput
      style={[styles.textInput, multiline && { height: 100, textAlignVertical: 'top' }]}
      value={value || ''}
      onChangeText={onChange}
      placeholder={question.placeholder || (multiline ? 'Enter your response...' : 'Type here...')}
      placeholderTextColor={theme.textMuted}
      multiline={multiline}
    />
  )
}

function NumberAnswer({ question, value, onChange }) {
  return (
    <TextInput
      style={styles.textInput}
      value={value || ''}
      onChangeText={t => onChange(t.replace(/[^0-9]/g, ''))}
      placeholder="Enter number"
      placeholderTextColor={theme.textMuted}
      keyboardType="number-pad"
    />
  )
}

function YesNo({ value, onChange }) {
  return (
    <View style={styles.optionsWrap}>
      {['Yes', 'No'].map(opt => {
        const selected = value === opt
        return (
          <TouchableOpacity
            key={opt}
            style={[styles.optionBtn, selected && styles.optionBtnSelected]}
            onPress={() => onChange(selected ? '' : opt)}
            activeOpacity={0.8}
          >
            <View style={[styles.optionCircle, selected && styles.optionCircleSelected]}>
              {selected && <View style={styles.optionDot} />}
            </View>
            <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{opt}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

function RatingAnswer({ value, onChange }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <TouchableOpacity key={n} onPress={() => onChange(String(n))} activeOpacity={0.7}
          style={{ width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
            backgroundColor: Number(value) >= n ? theme.primary : theme.background,
            borderWidth: 1.5, borderColor: Number(value) >= n ? theme.primary : theme.border }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: Number(value) >= n ? '#fff' : theme.textSub }}>{n}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

function QuestionRenderer({ question, value, onChange }) {
  switch (question.type) {
    // Admin builder types
    case 'single_choice':   return <SingleChoice   question={question} value={value} onChange={onChange} />
    case 'multiple_choice': return <MultiChoice    question={question} value={value} onChange={onChange} />
    case 'checkbox':        return <MultiChoice    question={question} value={value} onChange={onChange} />
    case 'dropdown':        return <DropdownChoice question={question} value={value} onChange={onChange} />
    case 'yes_no':          return <YesNo          value={value} onChange={onChange} />
    case 'rating':          return <RatingAnswer   value={value} onChange={onChange} />
    case 'long_text':       return <TextAnswer     question={question} value={value} onChange={onChange} multiline />
    case 'number':          return <NumberAnswer   question={question} value={value} onChange={onChange} />
    case 'mobile':          return <NumberAnswer   question={question} value={value} onChange={onChange} />
    case 'short_text':
    case 'text':
    case 'email':
    case 'date':
    case 'time':            return <TextAnswer     question={question} value={value} onChange={onChange} />
    // Legacy types
    case 'single':          return <SingleChoice   question={question} value={value} onChange={onChange} />
    case 'multiple':        return <MultiChoice    question={question} value={value} onChange={onChange} />
    case 'long':            return <TextAnswer     question={question} value={value} onChange={onChange} multiline />
    default:                return <TextAnswer     question={question} value={value} onChange={onChange} />
  }
}

// ── Success Screen ───────────────────────────────────────────────────────────

function SuccessScreen({ onBack }) {
  return (
    <View style={styles.successWrap}>
      <View style={styles.successIcon}>
        <Ionicons name="checkmark-circle" size={64} color={theme.success} />
      </View>
      <Text style={styles.successTitle}>Survey Submitted!</Text>
      <Text style={styles.successSub}>Response saved. Will sync automatically when connected.</Text>
      <TouchableOpacity style={styles.backListBtn} onPress={onBack} activeOpacity={0.85}>
        <Text style={styles.backListBtnText}>Back to Voter List</Text>
      </TouchableOpacity>
    </View>
  )
}

// ── Main Survey Screen ───────────────────────────────────────────────────────

export default function SurveyScreen() {
  const { voterId }   = useLocalSearchParams()
  const insets        = useSafeAreaInsets()
  const router        = useRouter()
  const { voters, activeSurvey, saveResponse, responses } = useStore()

  const voter    = voters.find(v => v.id === voterId)
  const existing = responses[voterId]

  const questions = useMemo(() => {
    if (!activeSurvey?.questions?.length) {
      return [
        { id: 'q1', type: 'single',   label: 'Is the voter available?', options: ['Yes', 'No', 'Not Home'] },
        { id: 'q2', type: 'single',   label: 'Primary issue in the area?', options: ['Roads', 'Water', 'Electricity', 'Education', 'Healthcare', 'Other'] },
        { id: 'q3', type: 'multiple', label: 'Concerns (select all that apply):', options: ['Unemployment', 'Safety', 'Cleanliness', 'Public Transport', 'Housing'] },
        { id: 'q4', type: 'text',     label: 'Additional comments:' },
      ]
    }
    return activeSurvey.questions
  }, [activeSurvey])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers,      setAnswers]       = useState(existing?.answers || {})
  const [submitted,    setSubmitted]     = useState(!!existing?.submittedAt)

  const question  = questions[currentIndex]
  const progress  = ((currentIndex + 1) / questions.length) * 100
  const isLast    = currentIndex === questions.length - 1
  const answer    = answers[question?.id]

  const setAnswer = (val) => setAnswers(a => ({ ...a, [question.id]: val }))

  const handleSubmit = async () => {
    const response = {
      localId:     uuid.v4(),
      voterId,
      surveyId:    activeSurvey?.id,
      boothNo:     voter?.boothNo,
      answers:     { ...answers, [question.id]: answer },
      submittedAt: new Date().toISOString(),
      synced:      false,
    }
    await saveResponse(response)
    setSubmitted(true)
  }

  const goNext = () => {
    if (!isLast) setCurrentIndex(i => i + 1)
  }

  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex(i => i - 1)
  }

  if (!voter) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: theme.textSub }}>Voter not found</Text>
      </View>
    )
  }

  if (submitted) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.white, paddingTop: insets.top }}>
        <SuccessScreen onBack={() => router.back()} />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color={theme.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Survey</Text>
            <Text style={styles.qCounter}>{currentIndex + 1}/{questions.length}</Text>
          </View>

          {/* Progress */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          {/* Voter Card */}
          <View style={styles.voterCard}>
            <View style={styles.voterCardLeft}>
              <View style={styles.voterAvatar}>
                <Text style={styles.voterAvatarText}>
                  {(vName(voter) || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.voterName}>{vName(voter) || '—'}</Text>
                <View style={styles.voterMeta}>
                  <Text style={styles.voterMetaText}>{vId(voter) || '—'}</Text>
                  <Text style={styles.voterMetaDot}>·</Text>
                  <Text style={styles.voterMetaText}>{vAge(voter) ? `${vAge(voter)} yrs` : '—'} · {vGender(voter) || '—'}</Text>
                </View>
                <View style={styles.voterMeta}>
                  <Ionicons name="home-outline" size={11} color={theme.textMuted} />
                  <Text style={styles.voterMetaText}>{vHouseNo(voter) || '—'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Question */}
          <View style={styles.questionCard}>
            <View style={styles.questionBadge}>
              <Text style={styles.questionBadgeText}>Q{currentIndex + 1}</Text>
            </View>
            <Text style={styles.questionText}>{question?.label || question?.question || '—'}</Text>
            {question?.required && <Text style={styles.required}>* Required</Text>}

            <View style={{ marginTop: 16 }}>
              <QuestionRenderer question={question} value={answer} onChange={setAnswer} />
            </View>
          </View>
        </ScrollView>

        {/* Navigation */}
        <View style={[styles.navBar, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={[styles.navBtn, { backgroundColor: theme.background, opacity: currentIndex === 0 ? 0.4 : 1 }]}
            onPress={goPrev}
            disabled={currentIndex === 0}
          >
            <Ionicons name="chevron-back" size={18} color={theme.text} />
            <Text style={styles.navBtnText}>Previous</Text>
          </TouchableOpacity>

          {isLast ? (
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.85}>
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>Submit Survey</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.nextNavBtn} onPress={goNext} activeOpacity={0.85}>
              <Text style={styles.nextNavBtnText}>Next</Text>
              <Ionicons name="chevron-forward" size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  header: { backgroundColor: theme.white, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.border },
  headerTop:   { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: theme.background },
  headerTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: theme.text, textAlign: 'center' },
  qCounter:    { fontSize: 13, fontWeight: '700', color: theme.primary },
  progressTrack:{ height: 4, backgroundColor: theme.background, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: theme.primary, borderRadius: 2 },

  voterCard: {
    backgroundColor: theme.white, borderRadius: theme.radius.lg,
    padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.primaryLight,
    ...theme.shadowSm,
  },
  voterCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  voterAvatar:   { width: 46, height: 46, borderRadius: 23, backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center' },
  voterAvatarText:{ fontSize: 15, fontWeight: '800', color: theme.primary },
  voterName:   { fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 4 },
  voterMeta:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  voterMetaText:{ fontSize: 11, color: theme.textSub },
  voterMetaDot: { fontSize: 11, color: theme.border },

  questionCard: {
    backgroundColor: theme.white, borderRadius: theme.radius.xl,
    padding: 20, ...theme.shadowSm, borderWidth: 1, borderColor: theme.border,
  },
  questionBadge:    { alignSelf: 'flex-start', backgroundColor: theme.primaryLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 12 },
  questionBadgeText:{ fontSize: 11, fontWeight: '800', color: theme.primary },
  questionText:     { fontSize: 16, fontWeight: '700', color: theme.text, lineHeight: 24 },
  required:         { fontSize: 11, color: theme.error, marginTop: 4 },

  optionsWrap: { gap: 10 },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1.5, borderColor: theme.border,
    borderRadius: theme.radius.lg, padding: 14, backgroundColor: theme.background,
  },
  optionBtnSelected: { borderColor: theme.primary, backgroundColor: theme.primaryLight },
  optionCircle:    { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' },
  optionCircleSelected:{ borderColor: theme.primary },
  optionDot:       { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.primary },
  optionCheck:     { width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' },
  optionCheckSelected: { backgroundColor: theme.primary, borderColor: theme.primary },
  optionText:      { fontSize: 14, color: theme.textSub, flex: 1 },
  optionTextSelected:{ color: theme.primary, fontWeight: '600' },

  dropdownOpt: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: theme.border, borderRadius: theme.radius.md,
    padding: 14, backgroundColor: theme.background,
  },
  dropdownOptSelected: { borderColor: theme.primary, backgroundColor: theme.primaryLight },
  dropdownOptText:     { fontSize: 14, color: theme.textSub },

  textInput: {
    borderWidth: 1.5, borderColor: theme.border, borderRadius: theme.radius.lg,
    padding: 14, fontSize: 14, color: theme.text, backgroundColor: theme.background, minHeight: 52,
  },

  navBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: 12, padding: 16,
    backgroundColor: theme.white, borderTopWidth: 1, borderTopColor: theme.border,
  },
  navBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 50, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.border },
  navBtnText:   { fontSize: 14, fontWeight: '600', color: theme.text },
  nextNavBtn:   { flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 50, borderRadius: theme.radius.lg, backgroundColor: theme.primary },
  nextNavBtnText:{ fontSize: 14, fontWeight: '700', color: '#fff' },
  submitBtn:    { flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 50, borderRadius: theme.radius.lg, backgroundColor: theme.success },
  submitBtnText:{ fontSize: 14, fontWeight: '700', color: '#fff' },

  successWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  successIcon:  { marginBottom: 20 },
  successTitle: { fontSize: 24, fontWeight: '800', color: theme.text, marginBottom: 10 },
  successSub:   { fontSize: 14, color: theme.textSub, textAlign: 'center', marginBottom: 36, lineHeight: 22 },
  backListBtn:  { padding: 16, width: '100%', alignItems: 'center' },
  backListBtnText:{ color: theme.textSub, fontSize: 14, fontWeight: '600' },
})
