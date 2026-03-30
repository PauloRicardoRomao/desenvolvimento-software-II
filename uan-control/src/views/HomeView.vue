<script setup>
  import { computed } from 'vue'
  import { useAuthStore } from '../stores/authStore'

  const authStore = useAuthStore()

  const userEmail = computed(() => authStore.user?.email || 'Nenhum usuário logado')
  const statusUsuario = computed(() => (authStore.user ? 'Logado' : 'Deslogado'))
</script>

<template>
  <section class="home">
    <div class="card hero">
      <h1>
        <i class="fa-solid fa-utensils"></i>
        Sistema de Gestão UAN
      </h1>

      <p class="muted hero-text">
        Plataforma para controle de estoque, validade, temperatura e desperdício em Unidades de
        Alimentação e Nutrição.
      </p>

      <p class="hero-status">
        <strong>Status:</strong>
        {{ statusUsuario }}
        <span class="status-user">({{ userEmail }})</span>
      </p>
    </div>

    <div class="grid home-grid">
      <div class="card feature">
        <i class="fa-solid fa-box"></i>
        <h3>Controle de Estoque</h3>
        <p class="muted">Cadastre produtos, categorias e acompanhe a quantidade disponível.</p>
      </div>

      <div class="card feature">
        <i class="fa-solid fa-calendar-xmark"></i>
        <h3>Controle de Validade</h3>
        <p class="muted">Identifique produtos próximos do vencimento e evite desperdícios.</p>
      </div>

      <div class="card feature">
        <i class="fa-solid fa-temperature-half"></i>
        <h3>Monitoramento de Temperatura</h3>
        <p class="muted">Registre temperaturas de freezers, geladeiras e alimentos.</p>
      </div>

      <div class="card feature">
        <i class="fa-solid fa-chart-pie"></i>
        <h3>Controle de Desperdício</h3>
        <p class="muted">Acompanhe o índice de desperdício semanal da unidade.</p>
      </div>
    </div>
  </section>
</template>
