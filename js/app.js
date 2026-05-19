import { supabase } from './supabase.js'

const modal = document.getElementById('modal')
const openModal = document.getElementById('open-modal')
const closeModal = document.getElementById('close-modal')

const form = document.getElementById('atendimento-form')

const container = document.getElementById('atendimentos-container')

/* MODAL */

openModal.addEventListener('click', () => {
  modal.classList.remove('hidden')
})

closeModal.addEventListener('click', () => {
  modal.classList.add('hidden')
})

/* CARREGAR ATENDIMENTOS */

async function carregarAtendimentos() {

  const { data, error } = await supabase
    .from('atendimentos')
    .select('*')
    .order('created_at', { ascending: false })

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

    const card = document.createElement('div')

    card.className = 'atendimento-card'

    card.innerHTML = `
      <div class="flex justify-between items-start">

        <div>

          <h3>${atendimento.nome_aluno}</h3>

          <p>
            ${atendimento.curso} •
            ${atendimento.tipo_problema}
          </p>

          <p>
            Responsável:
            ${atendimento.responsavel}
          </p>

          <p>
            Prioridade:
            ${atendimento.prioridade}
          </p>

        </div>

        <span class="${statusClass}">
          ${atendimento.status}
        </span>

      </div>
    `

    container.appendChild(card)
  })

  atualizarKPIs(data)
}

/* KPI */

function atualizarKPIs(data) {

  document.getElementById('kpi-total').textContent =
    data.length

  document.getElementById('kpi-pendentes').textContent =
    data.filter(item => item.status === 'Pendente').length

  document.getElementById('kpi-resolvidos').textContent =
    data.filter(item => item.status === 'Resolvido').length

  document.getElementById('kpi-urgentes').textContent =
    data.filter(item => item.prioridade === 'Urgente').length
}

/* SALVAR */

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

/* INICIAR */

carregarAtendimentos()
