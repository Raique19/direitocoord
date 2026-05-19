import { supabase } from './supabase.js'

/* =========================
   ELEMENTOS
========================= */

const modal = document.getElementById('modal')
const openModal = document.getElementById('open-modal')
const closeModal = document.getElementById('close-modal')

const form = document.getElementById('atendimento-form')

const container =
  document.getElementById('atendimentos-container')

/* =========================
   FILTROS
========================= */

const btnPendentes =
  document.getElementById('btn-pendentes')

const btnResolvidos =
  document.getElementById('btn-resolvidos')

const btnHistorico =
  document.getElementById('btn-historico')

const btnDados =
  document.getElementById('btn-dados')

let filtroAtual = 'todos'

let termoBusca = ''

const buscaInput =
  document.getElementById('busca-input')

/* =========================
   MODAL DETALHES
========================= */

const detalhesModal =
  document.getElementById('detalhes-modal')

const detalhesContent =
  document.getElementById('detalhes-content')

const closeDetalhes =
  document.getElementById('close-detalhes')

closeDetalhes.addEventListener('click', () => {

  detalhesModal.classList.add('hidden')
})

/* =========================
   MODAL
========================= */

openModal.addEventListener('click', () => {
  modal.classList.remove('hidden')
})

closeModal.addEventListener('click', () => {
  modal.classList.add('hidden')
})

/* =========================
   FORMATAR DATA
========================= */

function formatarData(dataISO) {

  const data = new Date(dataISO)

  return data.toLocaleDateString('pt-BR') +
    ' • ' +
    data.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
}

/* =========================
   MÁSCARA CPF
========================= */

function mascararCPF(cpf) {

  if (!cpf) return '-'

  return `***.${cpf.slice(3,6)}.***`
}

/* =========================
   CLASSE PRIORIDADE
========================= */

function prioridadeClass(prioridade) {

  switch(prioridade) {

    case 'Baixa':
      return 'prioridade-baixa'

    case 'Média':
      return 'prioridade-media'

    case 'Alta':
      return 'prioridade-alta'

    case 'Urgente':
      return 'prioridade-urgente'

    default:
      return ''
  }
}

/* =========================
   BUSCA
========================= */

buscaInput.addEventListener('input', (e) => {

  termoBusca = e.target.value

  carregarAtendimentos()
})

/* =========================
   CARREGAR ATENDIMENTOS
========================= */

async function carregarAtendimentos() {

  let query = supabase
    .from('atendimentos')
    .select('*')
    .order('created_at', {
      ascending: false
    })

  if (filtroAtual === 'pendentes') {

    query = query.eq('status', 'Pendente')

  }

  if (filtroAtual === 'resolvidos') {

    query = query.eq('status', 'Resolvido')

  }

  if (termoBusca.trim() !== '') {

  query = query.or(`
    nome_aluno.ilike.%${termoBusca}%,
    ra.ilike.%${termoBusca}%,
    cpf.ilike.%${termoBusca}%
  `)
}

const { data, error } = await query

  if (error) {
    console.error(error)
    return
  }

  container.innerHTML = ''

  if (data.length === 0) {

    container.innerHTML = `
      <div class="bg-white rounded-3xl p-10 text-center">
        <h3 class="text-2xl font-bold mb-2">
          Nenhum atendimento encontrado
        </h3>

        <p class="text-slate-500">
          Não existem registros nesta categoria.
        </p>
      </div>
    `

    atualizarKPIs(data)

    return
  }

  data.forEach(atendimento => {

    const statusClass =
      atendimento.status === 'Resolvido'
        ? 'status-resolvido'
        : 'status-pendente'

    const prioridadeCSS =
      prioridadeClass(atendimento.prioridade)

    const card = document.createElement('div')

    card.className = 'atendimento-card'

    card.innerHTML = `

      <div class="flex justify-between items-start">

        <div>

          <h3>
            ${atendimento.nome_aluno}
          </h3>

          <p>
            ${atendimento.curso}
            •
            ${atendimento.tipo_problema}
          </p>

          <p>
            Responsável:
            <strong>
              ${atendimento.responsavel}
            </strong>
          </p>

          <p class="${prioridadeCSS}">
            Prioridade:
            ${atendimento.prioridade}
          </p>

          <p>
            CPF:
            ${mascararCPF(atendimento.cpf)}
          </p>

          <p>
            ${formatarData(atendimento.created_at)}
          </p>

        </div>

        <span class="${statusClass}">
          ${atendimento.status}
        </span>

      </div>

      <div class="flex gap-3 mt-6">

        <button
          class="btn-primary detalhes-btn"
          data-id="${atendimento.id}"
        >
          Detalhes
        </button>

        ${
          atendimento.status === 'Pendente'
            ? `
              <button
                class="btn-danger resolver-btn"
                data-id="${atendimento.id}"
              >
                Resolver
              </button>
            `
            : ''
        }

      </div>

    `

    container.appendChild(card)
  })

  adicionarEventosResolver(data)

  atualizarKPIs(data)
}

/* =========================
   DETALHES
========================= */

function adicionarEventosDetalhes(data) {

  const botoes =
    document.querySelectorAll('.detalhes-btn')

  botoes.forEach(botao => {

    botao.addEventListener('click', () => {

      const id = botao.dataset.id

      const atendimento =
        data.find(item => item.id === id)

      if (!atendimento) return

      detalhesContent.innerHTML = `

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div>

            <h3 class="text-sm text-slate-500 mb-1">
              Nome do aluno
            </h3>

            <p class="font-semibold text-lg">
              ${atendimento.nome_aluno}
            </p>

          </div>

          <div>

            <h3 class="text-sm text-slate-500 mb-1">
              RA
            </h3>

            <p class="font-semibold">
              ${atendimento.ra || '-'}
            </p>

          </div>

          <div>

            <h3 class="text-sm text-slate-500 mb-1">
              CPF
            </h3>

            <p class="font-semibold">
              ${atendimento.cpf || '-'}
            </p>

          </div>

          <div>

            <h3 class="text-sm text-slate-500 mb-1">
              Curso
            </h3>

            <p class="font-semibold">
              ${atendimento.curso}
            </p>

          </div>

          <div>

            <h3 class="text-sm text-slate-500 mb-1">
              Responsável
            </h3>

            <p class="font-semibold">
              ${atendimento.responsavel}
            </p>

          </div>

          <div>

            <h3 class="text-sm text-slate-500 mb-1">
              Prioridade
            </h3>

            <p class="font-semibold">
              ${atendimento.prioridade}
            </p>

          </div>

          <div>

            <h3 class="text-sm text-slate-500 mb-1">
              Status
            </h3>

            <p class="font-semibold">
              ${atendimento.status}
            </p>

          </div>

          <div>

            <h3 class="text-sm text-slate-500 mb-1">
              Categoria
            </h3>

            <p class="font-semibold">
              ${atendimento.tipo_problema}
            </p>

          </div>

        </div>

        <div class="mt-8">

          <h3 class="text-sm text-slate-500 mb-2">
            Descrição / Pendência
          </h3>

          <div class="bg-slate-100 rounded-2xl p-5">
            ${atendimento.descricao_pendencia || '-'}
          </div>

        </div>

        ${
          atendimento.descricao_resolucao
            ? `
              <div class="mt-6">

                <h3 class="text-sm text-slate-500 mb-2">
                  Resolução
                </h3>

                <div class="bg-green-50 rounded-2xl p-5">
                  ${atendimento.descricao_resolucao}
                </div>

              </div>
            `
            : ''
        }

        <div class="mt-6 text-sm text-slate-500">

          Criado em:
          ${formatarData(atendimento.created_at)}

        </div>

      `

      detalhesModal.classList.remove('hidden')
    })
  })
}

/* =========================
   RESOLVER
========================= */

function adicionarEventosResolver() {

  const botoes =
    document.querySelectorAll('.resolver-btn')

  botoes.forEach(botao => {

    botao.addEventListener('click', async () => {

      const id = botao.dataset.id

      const resolucao = prompt(
        'Digite a resolução do atendimento:'
      )

      if (!resolucao) return

      const { error } = await supabase
        .from('atendimentos')
        .update({
          status: 'Resolvido',
          descricao_resolucao: resolucao
        })
        .eq('id', id)

      if (error) {
        console.error(error)
        alert('Erro ao resolver atendimento.')
        return
      }

      alert('Atendimento resolvido.')

       /* =========================
   EVENTOS FILTROS
========================= */

btnPendentes.addEventListener('click', () => {

  filtroAtual = 'pendentes'

  carregarAtendimentos()
})

btnResolvidos.addEventListener('click', () => {

  filtroAtual = 'resolvidos'

  carregarAtendimentos()
})

btnHistorico.addEventListener('click', () => {

  filtroAtual = 'todos'

  carregarAtendimentos()
})
      carregarAtendimentos()
    })
  })
}

/* =========================
   KPIs
========================= */

function atualizarKPIs(data) {

  document.getElementById('kpi-total').textContent =
    data.length

  document.getElementById('kpi-pendentes').textContent =
    data.filter(item =>
      item.status === 'Pendente'
    ).length

  document.getElementById('kpi-resolvidos').textContent =
    data.filter(item =>
      item.status === 'Resolvido'
    ).length

  document.getElementById('kpi-urgentes').textContent =
    data.filter(item =>
      item.prioridade === 'Urgente'
    ).length
}

/* =========================
   SALVAR
========================= */

form.addEventListener('submit', async (e) => {

  e.preventDefault()

  const novoAtendimento = {

    nome_aluno:
      document.getElementById('nome_aluno').value,

    ra:
      document.getElementById('ra').value,

    cpf:
      document.getElementById('cpf').value,

    curso:
      document.getElementById('curso').value,

    responsavel:
      document.getElementById('responsavel').value,

    prioridade:
      document.getElementById('prioridade').value,

    status:
      document.getElementById('status').value,

    tipo_problema: [
      document.getElementById('tipo_problema').value
    ],

    descricao_pendencia:
      document.getElementById('descricao').value
  }

  const { error } = await supabase
    .from('atendimentos')
    .insert([novoAtendimento])

  if (error) {
    console.error(error)
    alert('Erro ao salvar atendimento.')
    return
  }

  alert('Atendimento salvo com sucesso.')

  form.reset()

  modal.classList.add('hidden')

  carregarAtendimentos()
})

/* =========================
   INICIAR
========================= */

carregarAtendimentos()
