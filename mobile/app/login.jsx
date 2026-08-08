import { useState, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  Pressable,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { theme } from '../src/theme'
import { loginWithPIN } from '../src/services/auth'
import { useStore } from '../src/store/useStore'

export default function LoginScreen() {
  const insets = useSafeAreaInsets()
  const { login } = useStore()
  const [mobile, setMobile] = useState('')
  const [pin,    setPin]    = useState('')
  const [showPin, setShowPin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const pinRef = useRef(null)

  const handleLogin = async () => {
    setError('')
    if (!mobile.trim() || mobile.trim().length !== 10) {
      setError('Enter a valid 10-digit mobile number')
      return
    }
    if (!pin.trim() || pin.trim().length !== 4) {
      setError('Enter your 4-digit PIN')
      return
    }
    setLoading(true)
    try {
      const agent = await loginWithPIN(mobile, pin)
      await login(agent)
    } catch (e) {
      setError(e.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={['#5B3FD4', '#7B63DC', '#9B84E8']} style={styles.hero}>
        <View style={[styles.heroContent, { paddingTop: insets.top + 40 }]}>
          <View style={styles.logoWrap}>
            <Ionicons name="stats-chart" size={32} color="#fff" />
          </View>
          <Text style={styles.appName}>CAST</Text>
          <Text style={styles.appSub}>Election Survey Agent</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.card} contentContainerStyle={{ padding: 28 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Agent Login</Text>
        <Text style={styles.sub}>Enter your credentials to continue</Text>

        {/* Mobile */}
        <Text style={styles.label}>Mobile Number</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="call-outline" size={18} color={theme.textMuted} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={mobile}
            onChangeText={t => { setMobile(t.replace(/\D/g, '').slice(0, 10)); setError('') }}
            placeholder="10-digit mobile number"
            placeholderTextColor={theme.textMuted}
            keyboardType="number-pad"
            returnKeyType="next"
            onSubmitEditing={() => pinRef.current?.focus()}
          />
        </View>

        {/* PIN */}
        <Text style={[styles.label, { marginTop: 18 }]}>4-Digit PIN</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="lock-closed-outline" size={18} color={theme.textMuted} style={styles.inputIcon} />
          <TextInput
            ref={pinRef}
            style={[styles.input, { flex: 1, letterSpacing: showPin ? 0 : 8, fontWeight: '700' }]}
            value={pin}
            onChangeText={t => { setPin(t.replace(/\D/g, '').slice(0, 4)); setError('') }}
            placeholder="••••"
            placeholderTextColor={theme.textMuted}
            keyboardType="number-pad"
            secureTextEntry={!showPin}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />
          <Pressable onPress={() => setShowPin(v => !v)} style={styles.eyeBtn}>
            <Ionicons name={showPin ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.textMuted} />
          </Pressable>
        </View>

        {/* Error */}
        {!!error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={15} color={theme.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.loginBtn, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.loginBtnText}>Login</Text>
          }
        </TouchableOpacity>

        <Text style={styles.help}>
          Contact your supervisor if you've forgotten your PIN.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  hero: { paddingBottom: 40 },
  heroContent: { alignItems: 'center', paddingBottom: 20 },
  logoWrap: {
    width: 68, height: 68, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  appName: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: 3 },
  appSub:  { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },

  card: {
    flex: 1, backgroundColor: theme.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    marginTop: -24,
  },
  heading: { fontSize: 22, fontWeight: '700', color: theme.text, marginBottom: 4 },
  sub:     { fontSize: 13, color: theme.textSub, marginBottom: 28 },

  label: { fontSize: 12, fontWeight: '600', color: theme.textSub, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.background, borderRadius: theme.radius.lg,
    borderWidth: 1.5, borderColor: theme.border,
    paddingHorizontal: 14, height: 52,
  },
  inputIcon: { marginRight: 10 },
  input:  { flex: 1, fontSize: 15, color: theme.text },
  eyeBtn: { padding: 4 },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: theme.errorLight, borderRadius: theme.radius.md,
    padding: 12, marginTop: 12,
  },
  errorText: { fontSize: 12, color: theme.error, flex: 1 },

  loginBtn: {
    backgroundColor: theme.primary, borderRadius: theme.radius.lg,
    height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 28,
    ...theme.shadow,
  },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  help: { textAlign: 'center', color: theme.textMuted, fontSize: 12, marginTop: 20 },
})
