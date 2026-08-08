import { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { theme } from '../../src/theme'
import { useStore } from '../../src/store/useStore'

function MenuItem({ icon, label, onPress, danger = false, rightText }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, { backgroundColor: danger ? theme.errorLight : theme.primaryLight }]}>
        <Ionicons name={icon} size={18} color={danger ? theme.error : theme.primary} />
      </View>
      <Text style={[styles.menuLabel, danger && { color: theme.error }]}>{label}</Text>
      {rightText ? (
        <Text style={styles.menuRight}>{rightText}</Text>
      ) : (
        <Ionicons name="chevron-forward" size={16} color={theme.border} />
      )}
    </TouchableOpacity>
  )
}

export default function ProfileScreen() {
  const insets  = useSafeAreaInsets()
  const { agent, logout, responses } = useStore()

  const pending = Object.values(responses).filter(r => !r.synced).length
  const total   = Object.values(responses).filter(r => r.submittedAt).length

  const confirmLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ])
  }

  const initials = (agent?.name || 'A').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient colors={['#5B3FD4', '#7B63DC']} style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.agentName}>{agent?.name || '—'}</Text>
        <Text style={styles.agentSub}>{agent?.mobile || '—'}</Text>
        <View style={styles.boothBadge}>
          <Ionicons name="location" size={12} color={theme.primary} />
          <Text style={styles.boothText}>Booth {agent?.boothNo || '—'}</Text>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Surveys Done', value: String(total),   color: theme.success },
            { label: 'Pending Sync', value: String(pending), color: theme.warning },
            { label: 'Phase',        value: agent?.phase || '—', color: theme.primary },
          ].map(({ label, value, color }) => (
            <View key={label} style={styles.statCard}>
              <Text style={[styles.statValue, { color }]}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Agent Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Agent Information</Text>
          {[
            { label: 'Full Name',       value: agent?.name     || '—' },
            { label: 'Mobile',          value: agent?.mobile   || '—' },
            { label: 'Booth Number',    value: `Booth ${agent?.boothNo || '—'}` },
            { label: 'Polling Station', value: agent?.station  || '—' },
            { label: 'Phase',           value: agent?.phase    || '—' },
            { label: 'Status',          value: agent?.status   || '—' },
          ].map(({ label, value }) => (
            <View key={label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{label}</Text>
              <Text style={styles.infoValue}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.menuCard}>
            <MenuItem icon="lock-closed-outline" label="Change PIN"     onPress={() => Alert.alert('Coming Soon', 'Contact your supervisor to change your PIN.')} />
            <MenuItem icon="help-circle-outline"  label="Help & Support" onPress={() => Alert.alert('Help', 'Contact your supervisor for assistance.')} />
            <MenuItem icon="information-circle-outline" label="About CAST" rightText="v1.0.0" onPress={() => {}} />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.menuCard}>
            <MenuItem icon="log-out-outline" label="Logout" onPress={confirmLogout} danger />
          </View>
        </View>

        <View style={{ height: 32 }} />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 24, paddingBottom: 32, alignItems: 'center' },
  avatarWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText:  { fontSize: 28, fontWeight: '800', color: '#fff' },
  agentName:   { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  agentSub:    { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 10 },
  boothBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  boothText:   { fontSize: 12, fontWeight: '700', color: theme.primary },

  body: { padding: 20 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: theme.white, borderRadius: theme.radius.lg, padding: 14, alignItems: 'center', gap: 4, ...theme.shadowSm },
  statValue:{ fontSize: 20, fontWeight: '800' },
  statLabel:{ fontSize: 11, color: theme.textSub },

  section:      { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: theme.textSub, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },

  infoRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.white, paddingHorizontal: 14 },
  infoLabel:{ fontSize: 13, color: theme.textSub },
  infoValue:{ fontSize: 13, fontWeight: '600', color: theme.text, textAlign: 'right', flex: 1, marginLeft: 16 },

  menuCard: { backgroundColor: theme.white, borderRadius: theme.radius.lg, overflow: 'hidden', ...theme.shadowSm },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel:{ flex: 1, fontSize: 14, fontWeight: '600', color: theme.text },
  menuRight:{ fontSize: 13, color: theme.textMuted },
})
