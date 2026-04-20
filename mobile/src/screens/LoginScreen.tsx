import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import { api, saveCredentials } from '../api'

interface Props { onLogin: () => void }

export default function LoginScreen({ onLogin }: Props) {
  const [url,      setUrl]      = useState('http://localhost:8080')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)

  const login = async () => {
    if (!email || !password) { Alert.alert('Error', 'Fill all fields'); return }
    setLoading(true)
    try {
      const data: any = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      if (!data?.token) throw new Error('No token')
      await saveCredentials(url, data.token)
      onLogin()
    } catch(e: any) {
      Alert.alert('Login failed', e.message ?? 'Check credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.container}>
      <View style={s.card}>
        <View style={s.logo}><Text style={s.logoText}>R</Text></View>
        <Text style={s.title}>RustPress Admin</Text>
        <Text style={s.sub}>Sign in to manage your CMS</Text>

        <Text style={s.label}>Server URL</Text>
        <TextInput style={s.input} value={url} onChangeText={setUrl}
          autoCapitalize="none" keyboardType="url" placeholder="http://localhost:8080"
          placeholderTextColor="#444455" />

        <Text style={s.label}>Email</Text>
        <TextInput style={s.input} value={email} onChangeText={setEmail}
          autoCapitalize="none" keyboardType="email-address" placeholder="admin@example.com"
          placeholderTextColor="#444455" />

        <Text style={s.label}>Password</Text>
        <TextInput style={s.input} value={password} onChangeText={setPassword}
          secureTextEntry placeholder="••••••••" placeholderTextColor="#444455" />

        <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={login} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Sign In</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#0e0e1a', borderRadius: 24, padding: 28, borderWidth: 1, borderColor: '#2a2a3a' },
  logo: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#7c6aff', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoText: { color: '#fff', fontSize: 24, fontWeight: '900' },
  title: { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 4 },
  sub:   { color: '#555566', fontSize: 14, marginBottom: 24 },
  label: { color: '#888899', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  input: { backgroundColor: '#1a1a2e', borderRadius: 12, borderWidth: 1, borderColor: '#2a2a3a', color: '#fff', paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, marginBottom: 16 },
  btn: { backgroundColor: '#7c6aff', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
})
