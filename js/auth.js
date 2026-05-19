import { supabase } from './supabase.js'

const form = document.getElementById('login-form')
const errorMessage = document.getElementById('error-message')

form.addEventListener('submit', async (e) => {
  e.preventDefault()

  const email = document.getElementById('email').value
  const password = document.getElementById('password').value

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    errorMessage.textContent = 'Email ou senha inválidos.'
    return
  }

  window.location.href = 'index.html'
})