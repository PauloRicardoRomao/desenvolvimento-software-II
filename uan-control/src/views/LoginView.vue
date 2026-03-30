<script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
  import { auth } from '../firebase/config'

  const router = useRouter()

  const email = ref('')
  const senha = ref('')
  const erro = ref('')

  const entrar = async () => {
    erro.value = ''
    try {
      await signInWithEmailAndPassword(auth, email.value, senha.value)
      router.push('/dashboard')
    } catch (e) {
      erro.value = 'Nao foi possivel entrar. Verifique email e senha.'
    }
  }

  const registrar = async () => {
    erro.value = ''
    try {
      await createUserWithEmailAndPassword(auth, email.value, senha.value)
      router.push('/dashboard')
    } catch (e) {
      erro.value = 'Nao foi possivel cadastrar. Verifique os dados.'
    }
  }
</script>

<template>
  <section class="card login-card">
    <h1><i class="fa-solid fa-right-to-bracket"></i> Login</h1>
    <p class="muted">Use email e senha para testar o Firebase Auth.</p>

    <label class="field">
      Email
      <input v-model="email" type="email" placeholder="aluno@email.com" />
    </label>

    <label class="field">
      Senha
      <input v-model="senha" type="password" placeholder="minimo 6 caracteres" />
    </label>

    <div class="actions">
      <button @click="entrar"><i class="fa-solid fa-arrow-right"></i> Entrar</button>
      <button class="secondary" @click="registrar">
        <i class="fa-solid fa-user-plus"></i> Criar conta
      </button>
    </div>

    <p v-if="erro" class="error"><i class="fa-solid fa-triangle-exclamation"></i> {{ erro }}</p>
  </section>
</template>
