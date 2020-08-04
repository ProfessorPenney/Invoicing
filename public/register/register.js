const registerForm = document.querySelector('form')
const messageOutput = document.querySelector('#messages')
const nameInput = document.querySelector('#name')
const emailInput = document.querySelector('#email')
const passwordInput = document.querySelector('#password')
const password2Input = document.querySelector('#password2')

registerForm.addEventListener('submit', e => {
   e.preventDefault()
   const name = nameInput.value
   const email = emailInput.value
   const password = passwordInput.value
   const password2 = password2Input.value
   let errors = []

   // Check required fields
   if (!name || !email || !password || !password2) {
      errors.push('Please fill in all fields')
   }

   // Check passwords match
   if (password !== password2) {
      errors.push('Passwords do not match')
   }

   // Check pass length
   if (password.length < 6) {
      errors.push('Password should be at least 6 characters')
   }

   if (errors.length > 0) {
      messageOutput.textContent = ''
      errors.forEach(error => {
         messageOutput.innerHTML += `${error} <br>`
      })
   } else {
      fetch('/users/register', {
         method: 'POST',
         body: JSON.stringify({
            name,
            email,
            password
         }),
         headers: { 'Content-type': 'application/json' }
      }).then(() => {
         // res => res.json())
         // .then(data => {
         //    if (data.error) {
         //       messageOutput.textContent = data.error
         //    } else {
         window.location.href = '/login'
         sessionStorage.setItem('msg', 'Please log in')
         //    }
         // }
      })
   }
})
