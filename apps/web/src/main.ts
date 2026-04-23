import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import ConfirmationService from 'primevue/confirmationservice'
import Vue3Toastify from 'vue3-toastify'
import { TOAST_CONFIG } from '@buildery/ui-kit/configs'

import 'primeicons/primeicons.css'
import 'vue3-toastify/dist/index.css'
import '@/app/styles/buildery-tokens.scss'
import './style.css'

import App from './App.vue'
import { router } from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: false,
      cssLayer: false,
    },
  },
})
app.use(ConfirmationService)
app.use(Vue3Toastify, TOAST_CONFIG)

app.mount('#app')
