<script setup>
  import { computed, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from './stores/authStore'

  const router = useRouter()
  const authStore = useAuthStore()

  const userEmail = computed(() => authStore.user?.email || 'Deslogado')
  const mostrarConfirmacao = ref(false)

  const sair = () => {
    mostrarConfirmacao.value = true
  }

  const confirmarSaida = async () => {
    mostrarConfirmacao.value = false
    await authStore.logout()
    await router.replace('/')
  }

  const cancelarSaida = () => {
    mostrarConfirmacao.value = false
  }
</script>

<template>
  <div class="layout">
    <header class="topbar">
      <h2><i class="fa-solid fa-fire"></i> UAN Control</h2>
      <span class="muted">Usuario: {{ userEmail }}</span>
    </header>

    <nav class="menu">
      <router-link to="/"><i class="fa-solid fa-house"></i> Inicio</router-link>

      <router-link v-if="!authStore.user" to="/login">
        <i class="fa-solid fa-right-to-bracket"></i> Login
      </router-link>

      <router-link v-if="authStore.user" to="/dashboard">
        <i class="fa-solid fa-chart-line"></i> Dashboard
      </router-link>

      <button v-if="authStore.user" class="linklike" @click="sair">
        <i class="fa-solid fa-right-from-bracket"></i> Sair
      </button>
    </nav>

    <router-view />

    <div v-if="mostrarConfirmacao" class="modal">
      <div class="modal-box">
        <h3>Confirmar saída</h3>
        <p>Deseja realmente sair do sistema?</p>

        <div class="modal-actions">
          <button @click="confirmarSaida">Sim, sair</button>
          <button class="secondary" @click="cancelarSaida">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>
