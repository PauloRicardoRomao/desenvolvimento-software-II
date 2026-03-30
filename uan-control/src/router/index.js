// ARQUIVO: router/index.js
// Este arquivo configura o sistema de rotas da aplicação.

// createRouter  -> cria o gerenciador de rotas da aplicação.
// createWebHashHistory -> define o tipo de navegação utilizando "#" na URL.
import { createRouter, createWebHashHistory } from 'vue-router'

// A variável "auth" permite verificar se existe um usuário logado.
import { auth } from '../firebase/config'

// Importa os componentes que representam as telas da aplicação.
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'

// DEFINIÇÃO DAS ROTAS
const routes = [
  {
    path: '/',
    component: HomeView,
  },
  {
    path: '/login',
    component: LoginView,
  },
  {
    path: '/dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }, // Somente para usuários autenticados
  },
]

// CRIAÇÃO DO GERENCIADOR DE ROTAS
const router = createRouter({
  history: createWebHashHistory(),
  routes,
})
export default router

// CONTROLE DE ACESSO ÀS ROTAS (Navigation Guard)
router.beforeEach((to, from, next) => {
  // VERIFICAR SE A ROTA EXIGE AUTENTICAÇÃO
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  // VERIFICAR SE EXISTE USUÁRIO LOGADO
  const isAuthenticated = auth.currentUser

  // LÓGICA DE SEGURANÇA
  if (requiresAuth && !isAuthenticated) {
    // Cancela a navegação atual e redireciona o usuário para a página de login.
    next('/login')
  } else {
    // Continua para a rota solicitada.
    next()
  }
})
