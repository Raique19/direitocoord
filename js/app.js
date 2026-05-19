import { supabase } from './supabase.js'

/* =========================
   PAGINAÇÃO
========================= */

let paginaAtual = 1
const itensPorPagina = 10
let totalRegistros = 0

/* =========================
   ELEMENTOS
========================= */

const modal = document.getElementById('modal')

const openModal =
  document.getElementById('open-modal')

const closeModal =
  document.getElementById('close-modal')

const form =
  document.getElementById('atendimento-form')

const container =
  document.getElementById('atendimentos-container')

const dadosGerais =
  document.getElementById('dados-gerais')

const paginaInfo =
  document.getElementById('pagina-info')

const btnAnterior =
  document.getElementById('pagina-anterior')

const btnProxima =
  document.getElementById('proxima-pagina')

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

/* =========================
   BUSCA
========================= */

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
   HELPERS
========================= */

function formatarData(dataISO) {

  const data = new Date(dataISO)

  return (
    data.toLocaleDateString('pt-BR') +
    ' • ' +
    data.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  )
}

function prioridadeClass(prioridade) {

  switch (prioridade) {

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

  paginaAtual = 1

  carregarAtendimentos()
})

/* =========================
   TIMELINE
========================= */

async function criarEventoTimeline(
  atendimentoId,
  evento
) {

  await supabase
    .from('timeline_atendimentos')
    .insert([
      {
        atendimento_id: atendimentoId,
        evento,
        usuario: 'Coordenação'
      }
    ])
}

/* =========================
   COMENTÁRIOS
========================= */

async function carregarComentarios(id) {

  const comentariosContainer =
    document.getElementById(
      'comentarios-container'
    )

  const { data } = await supabase
    .from('comentarios_atendimento')
    .select('*')
    .eq('atendimento_id', id)
    .order('criado_em', {
      ascending: false
    })

  comentariosContainer.innerHTML = ''

  data.forEach(comentario => {

    comentariosContainer.innerHTML += `

      <div class="bg-slate-100 rounded-2xl p-4">

        <p>
          ${comentario.comentario}
        </p>

        <p class="text-sm text-slate-500 mt-2">
          ${comentario.usuario}
          •
          ${formatarData(comentario.criado_em)}
        </p>

      </div>
    `
  })
}

/* =========================
   CARREGAR ATENDIMENTOS
========================= */

async function carregarAtendimentos() {

  let query = supabase
    .from('atendimentos')
    .select('*', { count: 'exact' })
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

  const inicio =
    (paginaAtual - 1) * itensPorPagina

  const fim =
    inicio + itensPorPagina - 1

  const {
    data,
    error,
    count
  } = await query.range(inicio, fim)

  totalRegistros = count

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
      </div>
    `

    return
  }

  data.forEach(atendimento => {

    const statusClass =
      atendimento.status === 'Resolvido'
        ? 'status-resolvido'
        : 'status-pendente'

    const prioridadeCSS =
      prioridadeClass(
        atendimento.prioridade
      )

    const card =
      document.createElement('div')

    card.className = 'atendimento-card'

    card.innerHTML = `

      <div class="flex justify-between items-center">

        <div>

          <h3 class="mb-1">
            ${atendimento.nome_aluno}
          </h3>

          <p class="text-sm">
            ${atendimento.curso}
            •
            ${atendimento.tipo_problema}
          </p>

          <p class="${prioridadeCSS}">
            ${atendimento.prioridade}
          </p>

        </div>

        <div class="flex gap-2">

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
                  class="btn-success resolver-btn"
                  data-id="${atendimento.id}"
                >
                  Resolver
                </button>
              `
              : ''
          }

          <button
            class="btn-delete excluir-btn"
            data-id="${atendimento.id}"
          >
            Excluir
          </button>

        </div>

      </div>
    `

    container.appendChild(card)
  })

  adicionarEventosDetalhes(data)

  adicionarEventosResolver()

  adicionarEventosExcluir()

  atualizarKPIs(data)

  const totalPaginas =
    Math.ceil(
      totalRegistros / itensPorPagina
    )

  paginaInfo.textContent =
    `Página ${paginaAtual} de ${totalPaginas}`

  btnAnterior.disabled =
    paginaAtual === 1

  btnProxima.disabled =
    paginaAtual === totalPaginas
}

/* =========================
   DETALHES
========================= */

function adicionarEventosDetalhes(data) {

  const botoes =
    document.querySelectorAll('.detalhes-btn')

  botoes.forEach(botao => {

    botao.addEventListener(
      'click',
      async () => {

        const id = botao.dataset.id

        const atendimento =
          data.find(
            item => item.id === id
          )

        const { data: timeline } =
          await supabase
            .from(
              'timeline_atendimentos'
            )
            .select('*')
            .eq(
              'atendimento_id',
              id
            )
            .order('criado_em', {
              ascending: false
            })

        const timelineHTML =
          timeline.map(item => `

            <div class="border-l-2 border-slate-300 pl-4 py-2">

              <p class="font-semibold">
                ${item.evento}
              </p>

              <p class="text-sm text-slate-500">
                ${item.usuario}
                •
                ${formatarData(
                  item.criado_em
                )}
              </p>

            </div>

          `).join('')

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

      <p class="${prioridadeClass(atendimento.prioridade)}">
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

  <!-- TIMELINE -->

  <div class="mt-8">

    <h3 class="font-bold mb-4">
      Timeline
    </h3>

    ${
      timelineHTML || `
        <p class="text-slate-400">
          Nenhum evento registrado.
        </p>
      `
    }

  </div>

  <!-- COMENTÁRIOS -->

  <div class="mt-8">

    <h3 class="font-bold mb-3">
      Comentários Internos
    </h3>

    <textarea
      id="novo-comentario"
      class="input mb-3"
      placeholder="Adicionar comentário..."
    ></textarea>

    <button
      id="salvar-comentario"
      class="btn-primary"
    >
      Salvar comentário
    </button>

    <div
      id="comentarios-container"
      class="mt-4 space-y-3"
    ></div>

  </div>

  <div class="mt-6 text-sm text-slate-500">

    Criado em:
    ${formatarData(atendimento.created_at)}

  </div>
`

        detalhesModal
          .classList
          .remove('hidden')

        carregarComentarios(id)

        document
          .getElementById(
            'salvar-comentario'
          )
          .addEventListener(
            'click',
            async () => {

              const texto =
                document
                  .getElementById(
                    'novo-comentario'
                  ).value

              if (!texto) return

              await supabase
                .from(
                  'comentarios_atendimento'
                )
                .insert([
                  {
                    atendimento_id: id,
                    comentario: texto,
                    usuario: 'Coordenação'
                  }
                ])

              await criarEventoTimeline(
                id,
                'Comentário interno adicionado'
              )

              carregarComentarios(id)

              document
                .getElementById(
                  'novo-comentario'
                ).value = ''
            })
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

    botao.addEventListener(
      'click',
      async () => {

        const id = botao.dataset.id

        const resolucao = prompt(
          'Digite a resolução:'
        )

        if (!resolucao) return

        const { error } =
          await supabase
            .from('atendimentos')
            .update({
              status: 'Resolvido',
              descricao_resolucao:
                resolucao
            })
            .eq('id', id)

        if (error) {

          alert('Erro.')

          return
        }

        await criarEventoTimeline(
          id,
          'Atendimento resolvido'
        )

        carregarAtendimentos()
      })
  })
}

/* =========================
   EXCLUIR
========================= */

function adicionarEventosExcluir() {

  const botoes =
    document.querySelectorAll('.excluir-btn')

  botoes.forEach(botao => {

    botao.addEventListener(
      'click',
      async () => {

        const confirmar = confirm(
          'Deseja excluir?'
        )

        if (!confirmar) return

        const id =
          botao.dataset.id

        await supabase
          .from('atendimentos')
          .delete()
          .eq('id', id)

        carregarAtendimentos()
      })
  })
}

/* =========================
   KPIs
========================= */

function atualizarKPIs(data) {

  document.getElementById(
    'kpi-total'
  ).textContent = totalRegistros

  document.getElementById(
    'kpi-pendentes'
  ).textContent =
    data.filter(
      item =>
        item.status === 'Pendente'
    ).length

  document.getElementById(
    'kpi-resolvidos'
  ).textContent =
    data.filter(
      item =>
        item.status === 'Resolvido'
    ).length

  document.getElementById(
    'kpi-urgentes'
  ).textContent =
    data.filter(
      item =>
        item.prioridade ===
        'Urgente'
    ).length
}

/* =========================
   SALVAR
========================= */

form.addEventListener(
  'submit',
  async (e) => {

    e.preventDefault()

    const novoAtendimento = {

      nome_aluno:
        document.getElementById(
          'nome_aluno'
        ).value,

      ra:
        document.getElementById(
          'ra'
        ).value,

      cpf:
        document.getElementById(
          'cpf'
        ).value,

      curso:
        document.getElementById(
          'curso'
        ).value,

      responsavel:
        document.getElementById(
          'responsavel'
        ).value,

      prioridade:
        document.getElementById(
          'prioridade'
        ).value,

      status:
        document.getElementById(
          'status'
        ).value,

      tipo_problema: [
        document.getElementById(
          'tipo_problema'
        ).value
      ],

      descricao_pendencia:
        document.getElementById(
          'descricao'
        ).value
    }

    const { data, error } =
      await supabase
        .from('atendimentos')
        .insert([novoAtendimento])
        .select()

    if (error) {

      alert('Erro.')

      return
    }

    await criarEventoTimeline(
      data[0].id,
      'Atendimento criado'
    )

    form.reset()

    modal.classList.add('hidden')

    carregarAtendimentos()
  })

/* =========================
   FILTROS
========================= */

btnPendentes.addEventListener(
  'click',
  () => {

    filtroAtual =
      'pendentes'

    paginaAtual = 1

    carregarAtendimentos()
})

btnResolvidos.addEventListener(
  'click',
  () => {

    filtroAtual =
      'resolvidos'

    paginaAtual = 1

    carregarAtendimentos()
})

btnHistorico.addEventListener(
  'click',
  () => {

    filtroAtual = 'todos'

    paginaAtual = 1

    dadosGerais
      .classList
      .add('hidden')

    container.parentElement
      .classList
      .remove('hidden')

    carregarAtendimentos()
})

/* =========================
   PAGINAÇÃO
========================= */

btnAnterior.addEventListener(
  'click',
  () => {

    if (paginaAtual > 1) {

      paginaAtual--

      carregarAtendimentos()
    }
})

btnProxima.addEventListener(
  'click',
  () => {

    const totalPaginas =
      Math.ceil(
        totalRegistros /
        itensPorPagina
      )

    if (
      paginaAtual <
      totalPaginas
    ) {

      paginaAtual++

      carregarAtendimentos()
    }
})

/* =========================
   INICIAR
========================= */

carregarAtendimentos()
