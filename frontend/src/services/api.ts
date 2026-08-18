import axios from 'axios'

let authToken: string | null = null

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.set('Authorization', `Bearer ${authToken}`)
  }

  return config
})

export const setApiAuthToken = (token: string | null) => {
  authToken = token
}

export default api