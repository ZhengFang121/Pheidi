import { createApp } from 'vue'
import { createPinia } from 'pinia'

import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'

import router from './router'

import 'primeicons/primeicons.css'
import './style.css'

import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(PrimeVue, {
  theme: {
    preset: Aura,
  },
})

app.use(router)
app.use(pinia)

app.mount('#app')