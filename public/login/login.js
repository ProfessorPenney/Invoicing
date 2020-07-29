// const loginForm = document.querySelector('form')
// const emailInput = document.querySelector('#email')
// const passwordInput = document.querySelector('#password')
// const messages = document.querySelector('#messages')

messages.textContent = sessionStorage.getItem('msg')
sessionStorage.removeItem('msg')

// loginForm.addEventListener('submit', e => {
//    e.preventDefault()
//    const email = emailInput.value
//    const password = passwordInput.value

//    fetch()
// })
