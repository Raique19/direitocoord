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
   CARREGAR ATENDIMENTOS
========================= */

async function carregarAtendimentos() {

  const { data, error } = await supabase
    .from('atendimentos')
    .select('*')
    .order('created_at', {
      ascending: false
    })

  if (error) {
    console.error(error)
    return
  }

  container.innerHTML = ''

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

  adicionarEventosResolver()

  atualizarKPIs(data)
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
