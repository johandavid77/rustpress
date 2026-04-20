import React, { useState, useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { StatusBar } from 'expo-status-bar'
import { getToken, clearCredentials } from './src/api'
import LoginScreen    from './src/screens/LoginScreen'
import DashboardScreen from './src/screens/DashboardScreen'
import PostsScreen    from './src/screens/PostsScreen'
import OrdersScreen   from './src/screens/OrdersScreen'
import { TouchableOpacity, Text } from 'react-native'

const Tab = createBottomTabNavigator()

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    getToken().then(t => { setLoggedIn(!!t); setChecking(false) })
  }, [])

  if (checking) return null
  if (!loggedIn) return <LoginScreen onLogin={() => setLoggedIn(true)} />

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            const icons: Record<string, string> = {
              Dashboard: focused ? 'grid' : 'grid-outline',
              Posts:     focused ? 'document-text' : 'document-text-outline',
              Orders:    focused ? 'bag' : 'bag-outline',
            }
            return <Ionicons name={(icons[route.name] ?? 'ellipse') as any} size={size} color={color} />
          },
          tabBarActiveTintColor:   '#7c6aff',
          tabBarInactiveTintColor: '#555566',
          tabBarStyle:  { backgroundColor: '#0e0e1a', borderTopColor: '#2a2a3a' },
          headerStyle:  { backgroundColor: '#0e0e1a', borderBottomColor: '#2a2a3a' },
          headerTintColor: '#fff',
          headerRight: () => (
            <TouchableOpacity onPress={() => { clearCredentials(); setLoggedIn(false) }} style={{ marginRight: 16 }}>
              <Text style={{ color: '#555566', fontSize: 13 }}>Logout</Text>
            </TouchableOpacity>
          ),
        })}>
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Posts"     component={PostsScreen} />
        <Tab.Screen name="Orders"    component={OrdersScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  )
}
