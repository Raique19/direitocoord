import { supabase } from './supabase.js'
      <p>${atendimento.tipo_problema}</p>

      <p>${atendimento.status}</p>
    `

    container.appendChild(card)
  })

  atualizarKPIs(data)
}

function atualizarKPIs(data) {

  document.getElementById('kpi-total').textContent = data.length

  document.getElementById('kpi-pendentes').textContent =
    data.filter(item => item.status === 'Pendente').length

  document.getElementById('kpi-resolvidos').textContent =
    data.filter(item => item.status === 'Resolvido').length

  document.getElementById('kpi-urgentes').textContent =
    data.filter(item => item.prioridade === 'Urgente').length
}

form.addEventListener('submit', async (e) => {
  e.preventDefault()

  const novoAtendimento = {
    nome_aluno: document.getElementById('nome_aluno').value,
    ra: document.getElementById('ra').value,
    cpf: document.getElementById('cpf').value,
    curso: document.getElementById('curso').value,
    responsavel: document.getElementById('responsavel').value,
    prioridade: document.getElementById('prioridade').value,
    status: document.getElementById('status').value,
    tipo_problema: [document.getElementById('tipo_problema').value],
    descricao_pendencia: document.getElementById('descricao').value
  }

  const { error } = await supabase
    .from('atendimentos')
    .insert([novoAtendimento])

  if (error) {
    console.error(error)
    return
  }

  form.reset()
  modal.classList.add('hidden')

  carregarAtendimentos()
})

carregarAtendimentos()