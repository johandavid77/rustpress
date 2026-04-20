import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native'
import { api } from '../api'

interface Stats { posts: number; orders: number; revenue: number; users: number; products: number }

export default function DashboardScreen() {
  const [stats,      setStats]      = useState<Stats | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [uptime,     setUptime]     = useState<number>(100)

  const load = async () => {
    try {
      const [dash, up]: any[] = await Promise.all([
        api('/analytics/dashboard').catch(() => null),
        api('/uptime').catch(() => null),
      ])
      const d = dash?.data ?? dash
      if (d) setStats({ posts: d.posts ?? 0, orders: d.orders ?? 0, revenue: d.revenue ?? 0, users: d.users ?? 0, products: d.products ?? 0 })
      if (up?.uptime_pct !== undefined) setUptime(up.uptime_pct)
    } catch(_) {}
  }

  useEffect(() => { load() }, [])

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false) }

  const Card = ({ label, value, color }: { label: string; value: string; color: string }) => (
    <View style={[s.card, { borderColor: color + '40' }]}>
      <Text style={[s.cardValue, { color }]}>{value}</Text>
      <Text style={s.cardLabel}>{label}</Text>
    </View>
  )

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c6aff" />}>
      <Text style={s.title}>Dashboard</Text>

      {/* Uptime badge */}
      <View style={[s.uptime, { backgroundColor: uptime >= 99 ? '#16a34a20' : '#d9770620' }]}>
        <View style={[s.dot, { backgroundColor: uptime >= 99 ? '#4ade80' : '#fb923c' }]} />
        <Text style={[s.uptimeText, { color: uptime >= 99 ? '#4ade80' : '#fb923c' }]}>
          {uptime.toFixed(2)}% uptime
        </Text>
      </View>

      {stats ? (
        <View style={s.grid}>
          <Card label="Posts"    value={String(stats.posts)}                  color="#7c6aff" />
          <Card label="Orders"   value={String(stats.orders)}                 color="#06b6d4" />
          <Card label="Revenue"  value={'$' + stats.revenue.toFixed(0)}       color="#4ade80" />
          <Card label="Users"    value={String(stats.users)}                  color="#f472b6" />
          <Card label="Products" value={String(stats.products)}               color="#fb923c" />
          <Card label="Uptime"   value={uptime.toFixed(1) + '%'}              color="#a78bfa" />
        </View>
      ) : (
        <Text style={s.loading}>Loading stats...</Text>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', padding: 20 },
  title: { color: '#fff', fontSize: 26, fontWeight: '900', marginBottom: 16 },
  uptime: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, marginBottom: 20 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  uptimeText: { fontSize: 13, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { backgroundColor: '#0e0e1a', borderRadius: 16, borderWidth: 1, padding: 16, width: '47%' },
  cardValue: { fontSize: 24, fontWeight: '900', marginBottom: 4 },
  cardLabel: { color: '#555566', fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  loading: { color: '#555566', textAlign: 'center', marginTop: 40 },
})
