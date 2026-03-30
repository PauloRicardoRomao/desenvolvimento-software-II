import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { onAuthStateChanged } from 'firebase/auth'
import App from './App.vue'
import router from './router'
import { auth } from './firebase/config'
import { useAuthStore } from './stores/authStore'
import './style.css'

// Pinia = nossa "memoria global" do app
const pinia = createPinia()
let app

onAuthStateChanged(auth, (user) => {
  const authStore = useAuthStore(pinia)

  authStore.setUser(user)
  authStore.setAuthReady()

  // Monta o app uma unica vez, depois do estado estar pronto
  if (!app) {
    app = createApp(App)
    app.use(pinia)
    app.use(router)
    app.mount('#app')
  }
})
