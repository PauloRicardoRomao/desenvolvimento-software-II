import { defineStore } from 'pinia'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase/config'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    authIsReady: false,
  }),

  actions: {
    setUser(user) {
      this.user = user
    },

    setAuthReady() {
      this.authIsReady = true
    },

    async logout() {
      await signOut(auth)
      this.user = null
    },
  },
})
