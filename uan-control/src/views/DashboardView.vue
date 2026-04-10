<script setup>
  import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
  import { onAuthStateChanged } from 'firebase/auth'
  import {
    collection,
    addDoc,
    onSnapshot,
    query,
    where,
    Timestamp,
    doc,
    updateDoc,
    orderBy,
  } from 'firebase/firestore'
  import { auth, db } from '../firebase/config'

  const mostrarModalMensagem = ref(false)
  const mensagemModal = ref('')
  const tipoModal = ref('')

  // Forms - Categoria
  const nomeCategoria = ref('')
  const unidadeCategoria = ref('')

  // Forms - Produto
  const nomeProduto = ref('')
  const categoriaSelecionada = ref('')
  const quantidade = ref('')
  const unidade = ref('')
  const dataValidade = ref('')
  const estoqueMinimo = ref('')
  const tempMinima = ref('')
  const tempMaxima = ref('')

  // Forms - Temperatura
  const localTemperatura = ref('')
  const tipoTemperatura = ref('')
  const temperaturaAtual = ref('')

  // Forms - Movimentação
  const produtoMovimentacaoId = ref('')
  const tipoMovimentacao = ref('')
  const quantidadeMovimentacao = ref('')
  const motivoMovimentacao = ref('')
  const usoTotal = ref(false)

  // Collections
  const categorias = ref([])
  const produtos = ref([])
  const temperaturas = ref([])
  const desperdicios = ref([])
  const movimentacoesEstoque = ref([])

  let unsubCategorias = null
  let unsubProdutos = null
  let unsubTemperaturas = null
  let unsubDesperdicios = null
  let unsubMovimentacoes = null
  let unsubAuth = null

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

  // MODAL
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

  // HELPERS
  const nomeCategoriaPorId = (categoriaId) => {
    const categoria = categorias.value.find((item) => item.id === categoriaId)
    return categoria?.nome || 'Sem categoria'
  }

  const formatarDataHora = (valor) => {
    const data = normalizarData(valor)
    if (!data || Number.isNaN(data.getTime())) return '-'
    return data.toLocaleString('pt-BR')
  }

  const limparFormularioProduto = () => {
    nomeProduto.value = ''
    categoriaSelecionada.value = ''
    quantidade.value = ''
    unidade.value = ''
    dataValidade.value = ''
    estoqueMinimo.value = ''
    tempMinima.value = ''
    tempMaxima.value = ''
  }

  const limparFormularioTemperatura = () => {
    localTemperatura.value = ''
    tipoTemperatura.value = ''
    temperaturaAtual.value = ''
  }

  const limparFormularioMovimentacao = () => {
    produtoMovimentacaoId.value = ''
    tipoMovimentacao.value = ''
    quantidadeMovimentacao.value = ''
    motivoMovimentacao.value = ''
    usoTotal.value = false
  }

  const atualizarUnidadePelaCategoria = () => {
    const categoria = categorias.value.find((item) => item.id === categoriaSelecionada.value)
    unidade.value = categoria?.unidadePadrao || ''
  }

  const produtoSelecionadoMovimentacao = computed(() => {
    return produtos.value.find((item) => item.id === produtoMovimentacaoId.value) || null
  })

  // CADASTROS
  const salvarCategoria = async () => {
    const nomeFormatado = nomeCategoria.value.trim()
    const unidadeFormatada = unidadeCategoria.value.trim()

    if (!nomeFormatado || !unidadeFormatada) {
      abrirModalMensagem('Informe o nome da categoria e a unidade padrão.', 'erro')
      return
    }

    if (!auth.currentUser) {
      abrirModalMensagem('Usuário não autenticado. Faça login novamente.', 'erro')
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
        userId: auth.currentUser.uid,
        createdAt: Timestamp.now(),
      })

      nomeCategoria.value = ''
      unidadeCategoria.value = ''

      abrirModalMensagem('Categoria cadastrada com sucesso.', 'sucesso')
    } catch (error) {
      console.error('Erro ao salvar categoria:', error)
      abrirModalMensagem('Erro ao salvar categoria.', 'erro')
    }
  }

  const salvarProduto = async () => {
    if (
      !nomeProduto.value.trim() ||
      !categoriaSelecionada.value ||
      quantidade.value === '' ||
      !unidade.value.trim() ||
      !dataValidade.value ||
      estoqueMinimo.value === '' ||
      tempMinima.value === '' ||
      tempMaxima.value === ''
    ) {
      abrirModalMensagem('Preencha todos os campos do produto.', 'erro')
      return
    }

    if (!auth.currentUser) {
      abrirModalMensagem('Usuário não autenticado. Faça login novamente.', 'erro')
      return
    }

    if (Number(tempMinima.value) > Number(tempMaxima.value)) {
      abrirModalMensagem('A temperatura mínima não pode ser maior que a máxima.', 'erro')
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
        tempMinima: Number(tempMinima.value),
        tempMaxima: Number(tempMaxima.value),
        userId: auth.currentUser.uid,
        createdAt: Timestamp.now(),
      })

      limparFormularioProduto()
      abrirModalMensagem('Produto cadastrado com sucesso.', 'sucesso')
    } catch (error) {
      console.error('Erro ao salvar produto:', error)
      abrirModalMensagem('Erro ao salvar produto.', 'erro')
    }
  }

  const salvarTemperatura = async () => {
    if (!localTemperatura.value.trim() || !tipoTemperatura.value || temperaturaAtual.value === '') {
      abrirModalMensagem('Preencha todos os campos da temperatura.', 'erro')
      return
    }

    if (!auth.currentUser) {
      abrirModalMensagem('Usuário não autenticado. Faça login novamente.', 'erro')
      return
    }

    try {
      await addDoc(collection(db, 'temperaturas'), {
        local: localTemperatura.value.trim(),
        tipo: tipoTemperatura.value,
        temperatura: Number(temperaturaAtual.value),
        userId: auth.currentUser.uid,
        createdAt: Timestamp.now(),
      })

      limparFormularioTemperatura()
      abrirModalMensagem('Temperatura registrada com sucesso.', 'sucesso')
    } catch (error) {
      console.error('Erro ao salvar temperatura:', error)
      abrirModalMensagem('Erro ao registrar temperatura.', 'erro')
    }
  }

  const registrarMovimentacao = async () => {
    if (!auth.currentUser) {
      abrirModalMensagem('Usuário não autenticado. Faça login novamente.', 'erro')
      return
    }

    if (
      !produtoMovimentacaoId.value ||
      !tipoMovimentacao.value ||
      (!usoTotal.value && quantidadeMovimentacao.value === '')
    ) {
      abrirModalMensagem('Preencha os campos da movimentação.', 'erro')
      return
    }

    const produto = produtos.value.find((item) => item.id === produtoMovimentacaoId.value)

    if (!produto) {
      abrirModalMensagem('Produto não encontrado.', 'erro')
      return
    }

    const quantidadeAtual = Number(produto.quantidade || 0)
    const quantidadeInformada = Number(quantidadeMovimentacao.value || 0)

    if (!usoTotal.value && quantidadeInformada <= 0) {
      abrirModalMensagem('Informe uma quantidade válida.', 'erro')
      return
    }

    let novaQuantidade = quantidadeAtual
    let quantidadeRegistrada = quantidadeInformada

    if (tipoMovimentacao.value === 'entrada') {
      if (usoTotal.value) {
        abrirModalMensagem('A opção "usado tudo" só pode ser usada em saídas.', 'erro')
        return
      }

      novaQuantidade = quantidadeAtual + quantidadeInformada
    }

    if (tipoMovimentacao.value === 'saida') {
      if (usoTotal.value) {
        quantidadeRegistrada = quantidadeAtual
        novaQuantidade = 0
      } else {
        if (quantidadeInformada > quantidadeAtual) {
          abrirModalMensagem('A quantidade usada não pode ser maior que o estoque atual.', 'erro')
          return
        }

        novaQuantidade = quantidadeAtual - quantidadeInformada
      }
    }

    try {
      await updateDoc(doc(db, 'produtos', produto.id), {
        quantidade: novaQuantidade,
      })

      await addDoc(collection(db, 'movimentacoes_estoque'), {
        produtoId: produto.id,
        produtoNome: produto.nome,
        tipo: tipoMovimentacao.value,
        quantidade: quantidadeRegistrada,
        unidade: produto.unidade,
        motivo: motivoMovimentacao.value.trim() || '',
        usoTotal: usoTotal.value,
        quantidadeAntes: quantidadeAtual,
        quantidadeDepois: novaQuantidade,
        userId: auth.currentUser.uid,
        createdAt: Timestamp.now(),
      })

      limparFormularioMovimentacao()
      abrirModalMensagem('Movimentação registrada com sucesso.', 'sucesso')
    } catch (error) {
      console.error('Erro ao registrar movimentação:', error)
      abrirModalMensagem('Erro ao registrar movimentação.', 'erro')
    }
  }

  // LISTENERS
  const ouvirCategorias = () => {
    const q = query(collection(db, 'categorias'), where('userId', '==', auth.currentUser.uid))

    if (unsubCategorias) unsubCategorias()

    unsubCategorias = onSnapshot(q, (snapshot) => {
      categorias.value = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }))
    })
  }

  const ouvirProdutos = () => {
    const q = query(collection(db, 'produtos'), where('userId', '==', auth.currentUser.uid))

    if (unsubProdutos) unsubProdutos()

    unsubProdutos = onSnapshot(q, (snapshot) => {
      produtos.value = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }))
    })
  }

  const ouvirTemperaturas = () => {
    const q = query(
      collection(db, 'temperaturas'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    )

    if (unsubTemperaturas) unsubTemperaturas()

    unsubTemperaturas = onSnapshot(q, (snapshot) => {
      temperaturas.value = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }))
    })
  }

  const ouvirDesperdicios = () => {
    const q = query(collection(db, 'desperdicios'), where('userId', '==', auth.currentUser.uid))

    if (unsubDesperdicios) unsubDesperdicios()

    unsubDesperdicios = onSnapshot(q, (snapshot) => {
      desperdicios.value = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }))
    })
  }

  const ouvirMovimentacoesEstoque = () => {
    const q = query(
      collection(db, 'movimentacoes_estoque'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    )

    if (unsubMovimentacoes) unsubMovimentacoes()

    unsubMovimentacoes = onSnapshot(q, (snapshot) => {
      movimentacoesEstoque.value = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }))
    })
  }

  // MÉTRICAS
  const produtosProximosVencimento = computed(() => {
    return produtos.value.filter((produto) => {
      const data = normalizarData(produto.dataValidade)
      const dias = diferencaEmDias(data)
      return dias !== null && dias >= 0 && dias <= 7
    })
  })

  const quantidadeTotalEstoque = computed(() => {
    return produtos.value.reduce((total, produto) => total + Number(produto.quantidade || 0), 0)
  })

  const itensBaixaQuantidade = computed(() => {
    return produtos.value.filter((produto) => {
      return Number(produto.quantidade || 0) <= Number(produto.estoqueMinimo || 0)
    })
  })

  const temperaturasForaPadrao = computed(() => {
    return temperaturas.value.filter((registro) => {
      const atual = Number(registro.temperatura)

      if (registro.tipo === 'freezer') return atual > -18
      if (registro.tipo === 'geladeira') return atual > 5
      if (registro.tipo === 'alimento_quente') return atual < 60
      if (registro.tipo === 'alimento_frio') return atual > 10

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
    unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) return

      ouvirCategorias()
      ouvirProdutos()
      ouvirTemperaturas()
      ouvirDesperdicios()
      ouvirMovimentacoesEstoque()
    })
  })

  onBeforeUnmount(() => {
    if (unsubCategorias) unsubCategorias()
    if (unsubProdutos) unsubProdutos()
    if (unsubTemperaturas) unsubTemperaturas()
    if (unsubDesperdicios) unsubDesperdicios()
    if (unsubMovimentacoes) unsubMovimentacoes()
    if (unsubAuth) unsubAuth()
  })
</script>

<template>
  <section class="dashboard">
    <div class="header">
      <h1>Dashboard UAN</h1>
      <p class="muted">Controle de estoque, validade, temperatura, movimentação e desperdício.</p>
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

          <label>Validade</label>
          <input v-model="dataValidade" type="date" />

          <input
            v-model="tempMinima"
            type="number"
            step="0.1"
            placeholder="Temperatura mínima de armazenamento (°C)"
          />

          <input
            v-model="tempMaxima"
            type="number"
            step="0.1"
            placeholder="Temperatura máxima de armazenamento (°C)"
          />

          <button @click="salvarProduto">Salvar produto</button>
        </div>
      </div>

      <div class="card">
        <h2>Registrar temperatura</h2>
        <div class="form-column">
          <input v-model="localTemperatura" type="text" placeholder="Local da medição" />

          <select v-model="tipoTemperatura">
            <option disabled value="">Selecione o tipo</option>
            <option value="freezer">Freezer</option>
            <option value="geladeira">Geladeira</option>
            <option value="alimento_quente">Alimento quente</option>
            <option value="alimento_frio">Alimento frio</option>
          </select>

          <input
            v-model="temperaturaAtual"
            type="number"
            step="0.1"
            placeholder="Temperatura atual (°C)"
          />

          <button @click="salvarTemperatura">Salvar temperatura</button>
        </div>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <h2>Registrar movimentação</h2>
        <div class="form-column">
          <select v-model="produtoMovimentacaoId">
            <option disabled value="">Selecione um produto</option>
            <option v-for="produto in produtos" :key="produto.id" :value="produto.id">
              {{ produto.nome }}
            </option>
          </select>

          <select v-model="tipoMovimentacao">
            <option disabled value="">Selecione o tipo</option>
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>

          <input
            v-model="quantidadeMovimentacao"
            type="number"
            min="0"
            step="0.1"
            placeholder="Quantidade"
            :disabled="usoTotal"
          />

          <input v-model="motivoMovimentacao" type="text" placeholder="Motivo da movimentação" />

          <label class="checkbox-inline">
            <input v-model="usoTotal" type="checkbox" />
            Foi usado tudo
          </label>

          <p v-if="produtoSelecionadoMovimentacao" class="muted">
            Estoque atual: {{ produtoSelecionadoMovimentacao.quantidade }}
            {{ produtoSelecionadoMovimentacao.unidade }}
          </p>

          <button @click="registrarMovimentacao">Registrar movimentação</button>
        </div>
      </div>

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
    </div>

    <div class="grid">
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

      <div class="card">
        <h2>Temperaturas fora do padrão</h2>
        <ul v-if="temperaturasForaPadrao.length">
          <li v-for="registro in temperaturasForaPadrao" :key="registro.id">
            {{ registro.local || registro.tipo }} — {{ registro.temperatura }}°C
          </li>
        </ul>
        <p v-else class="muted">Nenhum registro fora do padrão.</p>
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
            <th>Temp. mín.</th>
            <th>Temp. máx.</th>
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
            <td>{{ produto.tempMinima }}°C</td>
            <td>{{ produto.tempMaxima }}°C</td>
          </tr>
        </tbody>
      </table>
      <p v-else class="muted">Ainda não há produtos cadastrados.</p>
    </div>

    <div class="card">
      <h2>Últimos registros de temperatura</h2>
      <table v-if="temperaturas.length" class="table">
        <thead>
          <tr>
            <th>Local</th>
            <th>Tipo</th>
            <th>Temperatura</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="registro in temperaturas" :key="registro.id">
            <td>{{ registro.local }}</td>
            <td>{{ registro.tipo }}</td>
            <td>{{ registro.temperatura }}°C</td>
            <td>{{ formatarDataHora(registro.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else class="muted">Ainda não há temperaturas registradas.</p>
    </div>

    <div class="card">
      <h2>Histórico de movimentações</h2>
      <table v-if="movimentacoesEstoque.length" class="table">
        <thead>
          <tr>
            <th>Produto</th>
            <th>Tipo</th>
            <th>Quantidade</th>
            <th>Motivo</th>
            <th>Uso total</th>
            <th>Antes</th>
            <th>Depois</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="mov in movimentacoesEstoque" :key="mov.id">
            <td>{{ mov.produtoNome }}</td>
            <td>{{ mov.tipo }}</td>
            <td>{{ mov.quantidade }} {{ mov.unidade }}</td>
            <td>{{ mov.motivo || '-' }}</td>
            <td>{{ mov.usoTotal ? 'Sim' : 'Não' }}</td>
            <td>{{ mov.quantidadeAntes }}</td>
            <td>{{ mov.quantidadeDepois }}</td>
            <td>{{ formatarDataHora(mov.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else class="muted">Ainda não há movimentações registradas.</p>
    </div>

    <div v-if="mostrarModalMensagem" class="modal">
      <div class="modal-box" :class="tipoModal === 'erro' ? 'modal-erro' : 'modal-sucesso'">
        <h3>{{ tipoModal === 'erro' ? 'Atenção' : 'Sucesso' }}</h3>
        <p>{{ mensagemModal }}</p>

        <div class="modal-actions">
          <button @click="fecharModalMensagem">Fechar</button>
        </div>
      </div>
    </div>
  </section>
</template>
