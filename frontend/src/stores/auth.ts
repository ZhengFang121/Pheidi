import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export interface AuthUser {
  id: string
  username: string
  email: string
  role: 'player' | 'admin'
}

interface SetAuthPayload {
  token: string
  user: AuthUser
  keepSignedIn: boolean
}

const authTokenKey = 'pheidi_auth_token'
const authUserKey = 'pheidi_auth_user'

const clearAuthStorage = () => {
  localStorage.removeItem(authTokenKey)
  localStorage.removeItem(authUserKey)
  sessionStorage.removeItem(authTokenKey)
  sessionStorage.removeItem(authUserKey)
}

const loadAuthStorage = () => {
  const storages = [localStorage, sessionStorage]

  for (const storage of storages) {
    const storedToken = storage.getItem(authTokenKey)
    const storedUser = storage.getItem(authUserKey)

    if (!storedToken || !storedUser) continue

    try {
      return {
        token: storedToken,
        user: JSON.parse(storedUser) as AuthUser,
      }
    } catch {
      clearAuthStorage()
      break
    }
  }

  return {
    token: null,
    user: null,
  }
}

export const useAuthStore = defineStore('auth', () => {
  const storedAuth = loadAuthStorage()

  const token = ref<string | null>(storedAuth.token)
  const user = ref<AuthUser | null>(storedAuth.user)

  const isAuthenticated = computed(() => Boolean(token.value && user.value))

  const setAuth = ({ token: newToken, user: newUser, keepSignedIn }: SetAuthPayload) => {
    clearAuthStorage()

    const storage = keepSignedIn ? localStorage : sessionStorage

    storage.setItem(authTokenKey, newToken)
    storage.setItem(authUserKey, JSON.stringify(newUser))

    token.value = newToken
    user.value = newUser
  }

  const logout = () => {
    clearAuthStorage()

    token.value = null
    user.value = null
  }

  return {
    token,
    user,
    isAuthenticated,
    setAuth,
    logout,
  }
})