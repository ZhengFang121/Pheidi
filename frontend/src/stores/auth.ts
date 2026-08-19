import { computed, ref } from 'vue'
import { isAxiosError } from 'axios'
import { defineStore } from 'pinia'

import api, { setApiAuthToken } from '@/services/api'

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

interface CurrentUserResponse {
  message: string
  user: AuthUser
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

const updateStoredUser = (updatedUser: AuthUser) => {
  const storage = localStorage.getItem(authTokenKey)
    ? localStorage
    : sessionStorage.getItem(authTokenKey)
      ? sessionStorage
      : null

  storage?.setItem(authUserKey, JSON.stringify(updatedUser))
}

export const useAuthStore = defineStore('auth', () => {
  const storedAuth = loadAuthStorage()

  const token = ref<string | null>(storedAuth.token)
  const user = ref<AuthUser | null>(storedAuth.user)

  setApiAuthToken(storedAuth.token)

  const isAuthenticated = computed(() => Boolean(token.value && user.value))
  const isAdmin = computed(() => user.value?.role === 'admin')

  const setAuth = ({ token: newToken, user: newUser, keepSignedIn }: SetAuthPayload) => {
    clearAuthStorage()

    const storage = keepSignedIn ? localStorage : sessionStorage

    storage.setItem(authTokenKey, newToken)
    storage.setItem(authUserKey, JSON.stringify(newUser))

    token.value = newToken
    user.value = newUser
    setApiAuthToken(newToken)
  }

  const logout = () => {
    clearAuthStorage()

    token.value = null
    user.value = null
    setApiAuthToken(null)
  }

  const validateSession = async () => {
    if (!token.value) return

    try {
      const response = await api.get<CurrentUserResponse>('/users/me')

      user.value = response.data.user
      updateStoredUser(response.data.user)
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === 401) {
        logout()
      }
    }
  }

  return {
    token,
    user,
    isAuthenticated,
    isAdmin,
    setAuth,
    logout,
    validateSession,
  }
})
