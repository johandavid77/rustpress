import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Alert } from 'react-native'
import { api } from '../api'

interface Post { id: string; title: string; status: string; views: number; created_at: string }

export default function PostsScreen() {
  const [posts,      setPosts]      = useState<Post[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    try {
      const r: any = await api('/posts?limit=20')
      const list = Array.isArray(r?.data) ? r.data : Array.isArray(r) ? r : []
      setPosts(list)
    } catch(_) {}
  }

  useEffect(() => { load() }, [])

  const deletePost = (id: string, title: string) => {
    Alert.alert('Delete Post', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api(`/posts/${id}`, { method: 'DELETE' }); load() } catch(_) {}
      }},
    ])
  }

  return (
    <View style={s.container}>
      <Text style={s.title}>Posts</Text>
      <FlatList
        data={posts}
        keyExtractor={p => p.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false) }} tintColor="#7c6aff" />}
        renderItem={({ item }) => (
          <View style={s.row}>
            <View style={s.rowLeft}>
              <View style={[s.badge, { backgroundColor: item.status === 'published' ? '#16a34a30' : '#d9770630' }]}>
                <Text style={[s.badgeText, { color: item.status === 'published' ? '#4ade80' : '#fb923c' }]}>
                  {item.status}
                </Text>
              </View>
              <Text style={s.rowTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={s.rowMeta}>{item.views} views · {new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
            <TouchableOpacity onPress={() => deletePost(item.id, item.title)} style={s.deleteBtn}>
              <Text style={s.deleteText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No posts yet</Text>}
      />
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', padding: 20 },
  title: { color: '#fff', fontSize: 26, fontWeight: '900', marginBottom: 16 },
  row: { backgroundColor: '#0e0e1a', borderRadius: 16, borderWidth: 1, borderColor: '#2a2a3a', padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  rowLeft: { flex: 1 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 6 },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  rowTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  rowMeta: { color: '#555566', fontSize: 12 },
  deleteBtn: { padding: 8 },
  deleteText: { color: '#555566', fontSize: 16 },
  empty: { color: '#555566', textAlign: 'center', marginTop: 40 },
})
