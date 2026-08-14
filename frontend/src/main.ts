import { createApp } from 'vue'
import { createPinia } from 'pinia'

import PrimeVue from 'primevue/config'
import PheidiPreset from './theme/pheidiPreset'

import 'primeicons/primeicons.css'
import './styles/index.css'
import './styles/base.css'

import App from './App.vue'
import router from './router'

const app = createApp(App)

const pinia = createPinia()

app.use(pinia)

app.use(router)

app.use(PrimeVue, {
  theme: {
    preset: PheidiPreset,
    options: {
      darkModeSelector: false,
    },
  },
})

app.mount('#app')
