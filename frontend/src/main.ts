import { createApp } from 'vue'
import { isAxiosError } from 'axios'

import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import PheidiPreset from './theme/pheidiPreset'

import 'primeicons/primeicons.css'
import './styles/index.css'
import './styles/base.css'

import App from './App.vue'
import router from './router'
import api from './services/api'
import pinia from './stores'
import { useAuthStore } from './stores/auth'

const app = createApp(App)

const bootstrap = async () => {
  app.use(pinia)

  const authStore = useAuthStore(pinia)

  await authStore.validateSession()

  app.use(router)

  api.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      if (isAxiosError(error) && error.response?.status === 401 && authStore.isAuthenticated) {
        authStore.logout()
        await router.replace('/login')
      }

      return Promise.reject(error)
    },
  )

  app.use(PrimeVue, {
    theme: {
      preset: PheidiPreset,
      options: {
        darkModeSelector: false,
      },
    },
  })

  app.use(ConfirmationService)

  app.mount('#app')
}

void bootstrap()