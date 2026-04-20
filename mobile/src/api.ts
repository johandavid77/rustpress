import * as SecureStore from 'expo-secure-store'

const BASE_URL_KEY = 'rustpress_base_url'
const TOKEN_KEY    = 'rustpress_token'

export async function getBaseUrl(): Promise<string> {
  return (await SecureStore.getItemAsync(BASE_URL_KEY)) ?? 'http://localhost:8080'
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY)
}

export async function saveCredentials(url: string, token: string) {
  await SecureStore.setItemAsync(BASE_URL_KEY, url)
  await SecureStore.setItemAsync(TOKEN_KEY, token)
}

export async function clearCredentials() {
  await SecureStore.deleteItemAsync(TOKEN_KEY)
}

export async function api(path: string, options?: RequestInit) {
  const base  = await getBaseUrl()
  const token = await getToken()
  const res = await fetch(`${base}/api/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  if (res.status === 204) return null
  return res.json()
}
