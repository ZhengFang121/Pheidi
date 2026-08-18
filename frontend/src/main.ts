import { createApp } from 'vue'

import PrimeVue from 'primevue/config'
import PheidiPreset from './theme/pheidiPreset'

import 'primeicons/primeicons.css'
import './styles/index.css'
import './styles/base.css'

import App from './App.vue'
import router from './router'
import pinia from './stores'

const app = createApp(App)

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