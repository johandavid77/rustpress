import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native'
import { api } from '../api'

interface Order { id: string; status: string; total: number; created_at: string }

const STATUS_COLOR: Record<string, string> = {
  pending:   '#fb923c',
  completed: '#4ade80',
  cancelled: '#f87171',
  processing:'#60a5fa',
}

export default function OrdersScreen() {
  const [orders,     setOrders]     = useState<Order[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    try {
      const r: any = await api('/orders?limit=30')
      const list = Array.isArray(r?.data) ? r.data : Array.isArray(r) ? r : []
      setOrders(list)
    } catch(_) {}
  }

  useEffect(() => { load() }, [])

  return (
    <View style={s.container}>
      <Text style={s.title}>Orders</Text>
      <FlatList
        data={orders}
        keyExtractor={o => o.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false) }} tintColor="#7c6aff" />}
        renderItem={({ item }) => (
          <View style={s.row}>
            <View>
              <Text style={s.orderId}>#{item.id.slice(0,8).toUpperCase()}</Text>
              <Text style={s.orderDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
            <View style={s.rowRight}>
              <Text style={s.orderTotal}>${item.total?.toFixed(2) ?? '0.00'}</Text>
              <View style={[s.badge, { backgroundColor: (STATUS_COLOR[item.status] ?? '#aaa') + '20' }]}>
                <Text style={[s.badgeText, { color: STATUS_COLOR[item.status] ?? '#aaa' }]}>{item.status}</Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No orders yet</Text>}
      />
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', padding: 20 },
  title: { color: '#fff', fontSize: 26, fontWeight: '900', marginBottom: 16 },
  row: { backgroundColor: '#0e0e1a', borderRadius: 16, borderWidth: 1, borderColor: '#2a2a3a', padding: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { color: '#fff', fontSize: 14, fontWeight: '700' },
  orderDate: { color: '#555566', fontSize: 12, marginTop: 2 },
  rowRight: { alignItems: 'flex-end', gap: 6 },
  orderTotal: { color: '#4ade80', fontSize: 16, fontWeight: '900' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  empty: { color: '#555566', textAlign: 'center', marginTop: 40 },
})
