<script setup>
  import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
  import { collection, addDoc, onSnapshot, query, where, Timestamp } from 'firebase/firestore'
  import { auth, db } from '../firebase/config'

  const mostrarModalMensagem = ref(false)
  const mensagemModal = ref('')
  const tipoModal = ref('')

  // Forms
  const nomeCategoria = ref('')
  const nomeProduto = ref('')
  const categoriaSelecionada = ref('')
  const unidadeCategoria = ref('')
  const quantidade = ref('')
  const unidade = ref('')
  const dataValidade = ref('')
  const estoqueMinimo = ref('')

  // Collections
  const categorias = ref([])
  const produtos = ref([])
  const temperaturas = ref([])
  const desperdicios = ref([])

  let unsubCategorias = null
  let unsubProdutos = null
  let unsubTemperaturas = null
  let unsubDesperdicios = null

  const getUserId = () => auth.currentUser?.uid || null

  const normalizarData = (valor) => {
    if (!valor) return null

    if (valor?.toDate) return valor.toDate()

    if (valor instanceof Date) return valor

    return new Date(`${valor}T00:00:00`)
  }

  const diferencaEmDias = (data) => {
    if (!data) return null
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const alvo = new Date(data)
    alvo.setHours(0, 0, 0, 0)

    const diffMs = alvo.getTime() - hoje.getTime()
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  }

  // CADASTROS

  const abrirModalMensagem = (mensagem, tipo = 'sucesso') => {
    mensagemModal.value = mensagem
    tipoModal.value = tipo
    mostrarModalMensagem.value = true
  }

  const fecharModalMensagem = () => {
    mostrarModalMensagem.value = false
    mensagemModal.value = ''
    tipoModal.value = ''
  }

  const salvarCategoria = async () => {
    const nomeFormatado = nomeCategoria.value.trim()
    const unidadeFormatada = unidadeCategoria.value.trim()

    if (!nomeFormatado || !unidadeFormatada) {
      abrirModalMensagem('Informe o nome da categoria e a unidade padrão.', 'erro')
      return
    }

    const categoriaJaExiste = categorias.value.some(
      (categoria) => categoria.nome?.trim().toLowerCase() === nomeFormatado.toLowerCase()
    )

    if (categoriaJaExiste) {
      abrirModalMensagem('Já existe uma categoria cadastrada com esse nome.', 'erro')
      return
    }

    try {
      await addDoc(collection(db, 'categorias'), {
        nome: nomeFormatado,
        unidadePadrao: unidadeFormatada,
        userId: getUserId(),
        createdAt: Timestamp.now(),
      })

      nomeCategoria.value = ''
      unidadeCategoria.value = ''

      abrirModalMensagem('Categoria cadastrada com sucesso.', 'sucesso')
    } catch (error) {
      console.error(error)
      abrirModalMensagem('Erro ao salvar categoria.', 'erro')
    }
  }

  const salvarProduto = async () => {
    if (
      !nomeProduto.value.trim() ||
      !categoriaSelecionada.value ||
      !quantidade.value ||
      !unidade.value.trim() ||
      !dataValidade.value ||
      !estoqueMinimo.value
    ) {
      abrirModalMensagem('Preencha todos os campos do produto.', 'erro')
      return
    }

    try {
      await addDoc(collection(db, 'produtos'), {
        nome: nomeProduto.value.trim(),
        categoriaId: categoriaSelecionada.value,
        quantidade: Number(quantidade.value),
        unidade: unidade.value.trim(),
        dataValidade: dataValidade.value,
        estoqueMinimo: Number(estoqueMinimo.value),
        userId: getUserId(),
        createdAt: Timestamp.now(),
      })

      nomeProduto.value = ''
      categoriaSelecionada.value = ''
      quantidade.value = ''
      unidade.value = ''
      dataValidade.value = ''
      estoqueMinimo.value = ''

      abrirModalMensagem('Produto cadastrado com sucesso.', 'sucesso')
    } catch (error) {
      console.error(error)
      abrirModalMensagem('Erro ao salvar produto.', 'erro')
    }
  }

  const atualizarUnidadePelaCategoria = () => {
    const categoria = categorias.value.find((item) => item.id === categoriaSelecionada.value)

    if (categoria?.unidadePadrao) {
      unidade.value = categoria.unidadePadrao
    } else {
      unidade.value = ''
    }
  }
  // LISTENERS

  const ouvirCategorias = () => {
    const q = query(collection(db, 'categorias'), where('userId', '==', getUserId()))

    unsubCategorias = onSnapshot(q, (snapshot) => {
      categorias.value = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    })
  }

  const ouvirProdutos = () => {
    const q = query(collection(db, 'produtos'), where('userId', '==', getUserId()))

    unsubProdutos = onSnapshot(q, (snapshot) => {
      produtos.value = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    })
  }

  const ouvirTemperaturas = () => {
    const q = query(collection(db, 'temperaturas'), where('userId', '==', getUserId()))

    unsubTemperaturas = onSnapshot(q, (snapshot) => {
      temperaturas.value = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    })
  }

  const ouvirDesperdicios = () => {
    const q = query(collection(db, 'desperdicios'), where('userId', '==', getUserId()))

    unsubDesperdicios = onSnapshot(q, (snapshot) => {
      desperdicios.value = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    })
  }

  // HELPERS

  const nomeCategoriaPorId = (categoriaId) => {
    const categoria = categorias.value.find((item) => item.id === categoriaId)
    return categoria?.nome || 'Sem categoria'
  }

  // MÉTRICAS DO DASHBOARD

  const produtosProximosVencimento = computed(() => {
    return produtos.value.filter((produto) => {
      const data = normalizarData(produto.dataValidade)
      const dias = diferencaEmDias(data)
      return dias !== null && dias >= 0 && dias <= 7
    })
  })

  const quantidadeTotalEstoque = computed(() => {
    return produtos.value.reduce((total, produto) => {
      return total + Number(produto.quantidade || 0)
    }, 0)
  })

  const itensBaixaQuantidade = computed(() => {
    return produtos.value.filter((produto) => {
      return Number(produto.quantidade || 0) <= Number(produto.estoqueMinimo || 0)
    })
  })

  const temperaturasForaPadrao = computed(() => {
    return temperaturas.value.filter((registro) => {
      const atual = Number(registro.temperatura)

      if (registro.tipo === 'freezer') {
        return atual > -18
      }

      if (registro.tipo === 'geladeira') {
        return atual > 5
      }

      if (registro.tipo === 'alimento_quente') {
        return atual < 60
      }

      if (registro.tipo === 'alimento_frio') {
        return atual > 10
      }

      return false
    })
  })

  const indiceDesperdicioSemana = computed(() => {
    const hoje = new Date()
    const seteDiasAtras = new Date()
    seteDiasAtras.setDate(hoje.getDate() - 7)

    const registrosSemana = desperdicios.value.filter((item) => {
      const data = normalizarData(item.data)
      return data && data >= seteDiasAtras && data <= hoje
    })

    const produzido = registrosSemana.reduce(
      (acc, item) => acc + Number(item.quantidadeProduzida || 0),
      0
    )

    const desperdicado = registrosSemana.reduce(
      (acc, item) => acc + Number(item.quantidadeDesperdicada || 0),
      0
    )

    if (!produzido) return 0

    return ((desperdicado / produzido) * 100).toFixed(2)
  })

  onMounted(() => {
    if (auth.currentUser) {
      ouvirCategorias()
      ouvirProdutos()
      ouvirTemperaturas()
      ouvirDesperdicios()
    }
  })

  onBeforeUnmount(() => {
    if (unsubCategorias) unsubCategorias()
    if (unsubProdutos) unsubProdutos()
    if (unsubTemperaturas) unsubTemperaturas()
    if (unsubDesperdicios) unsubDesperdicios()
  })
</script>

<template>
  <section class="dashboard">
    <div class="header">
      <h1>Dashboard UAN</h1>
      <p class="muted">Controle de estoque, validade, temperatura e desperdício.</p>
    </div>

    <div class="cards">
      <div class="card metric">
        <h3>Próximos do vencimento</h3>
        <strong>{{ produtosProximosVencimento.length }}</strong>
      </div>

      <div class="card metric">
        <h3>Quantidade em estoque</h3>
        <strong>{{ quantidadeTotalEstoque }}</strong>
      </div>

      <div class="card metric">
        <h3>Baixa quantidade</h3>
        <strong>{{ itensBaixaQuantidade.length }}</strong>
      </div>

      <div class="card metric">
        <h3>Temperaturas fora do padrão</h3>
        <strong>{{ temperaturasForaPadrao.length }}</strong>
      </div>

      <div class="card metric">
        <h3>Desperdício da semana</h3>
        <strong>{{ indiceDesperdicioSemana }}%</strong>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <h2>Cadastrar categoria</h2>
        <div class="form-column">
          <input v-model="nomeCategoria" type="text" placeholder="Nome da categoria" />

          <select v-model="unidadeCategoria">
            <option disabled value="">Selecione a unidade padrão</option>
            <option value="kg">kg</option>
            <option value="Un">Un</option>
            <option value="L">L</option>
          </select>

          <button @click="salvarCategoria">Salvar categoria</button>
        </div>
      </div>

      <div class="card">
        <h2>Cadastrar produto</h2>
        <div class="form-column">
          <input v-model="nomeProduto" type="text" placeholder="Nome do produto" />

          <select v-model="categoriaSelecionada" @change="atualizarUnidadePelaCategoria">
            <option disabled value="">Selecione uma categoria</option>
            <option v-for="categoria in categorias" :key="categoria.id" :value="categoria.id">
              {{ categoria.nome }}
            </option>
          </select>

          <input v-model="quantidade" type="number" min="0" placeholder="Quantidade" />

          <input v-model="unidade" type="text" placeholder="Unidade" readonly />

          <input v-model="estoqueMinimo" type="number" min="0" placeholder="Estoque mínimo" />

          <input v-model="dataValidade" type="date" />

          <button @click="salvarProduto">Salvar produto</button>
        </div>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <h2>Produtos próximos do vencimento</h2>
        <ul v-if="produtosProximosVencimento.length">
          <li v-for="produto in produtosProximosVencimento" :key="produto.id">
            {{ produto.nome }} — {{ produto.quantidade }} {{ produto.unidade }} — validade:
            {{ produto.dataValidade }}
          </li>
        </ul>
        <p v-else class="muted">Nenhum produto próximo do vencimento.</p>
      </div>

      <div class="card">
        <h2>Itens com baixa quantidade</h2>
        <ul v-if="itensBaixaQuantidade.length">
          <li v-for="produto in itensBaixaQuantidade" :key="produto.id">
            {{ produto.nome }} — estoque: {{ produto.quantidade }} {{ produto.unidade }} — mínimo:
            {{ produto.estoqueMinimo }}
          </li>
        </ul>
        <p v-else class="muted">Nenhum item com estoque baixo.</p>
      </div>
    </div>

    <div class="card">
      <h2>Produtos cadastrados</h2>
      <table v-if="produtos.length" class="table">
        <thead>
          <tr>
            <th>Produto</th>
            <th>Categoria</th>
            <th>Quantidade</th>
            <th>Unidade</th>
            <th>Validade</th>
            <th>Estoque mínimo</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="produto in produtos" :key="produto.id">
            <td>{{ produto.nome }}</td>
            <td>{{ nomeCategoriaPorId(produto.categoriaId) }}</td>
            <td>{{ produto.quantidade }}</td>
            <td>{{ produto.unidade }}</td>
            <td>{{ produto.dataValidade }}</td>
            <td>{{ produto.estoqueMinimo }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else class="muted">Ainda não há produtos cadastrados.</p>
    </div>

    <div class="card">
      <h2>Temperaturas fora do padrão</h2>
      <ul v-if="temperaturasForaPadrao.length">
        <li v-for="registro in temperaturasForaPadrao" :key="registro.id">
          {{ registro.local || registro.tipo }} — {{ registro.temperatura }}°C
        </li>
      </ul>
      <p v-else class="muted">Nenhum registro fora do padrão.</p>
    </div>

    <div v-if="mostrarModalMensagem" class="modal">
      <div class="modal-box" :class="tipoModal === 'erro' ? 'modal-erro' : 'modal-sucesso'">
        <h3>
          {{ tipoModal === 'erro' ? 'Atenção' : 'Sucesso' }}
        </h3>

        <p>{{ mensagemModal }}</p>

        <div class="modal-actions">
          <button @click="fecharModalMensagem">Fechar</button>
        </div>
      </div>
    </div>
  </section>
</template>
