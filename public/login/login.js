const form = document.querySelector('.login form')
const emailInput = document.querySelector('#login form')
const passwordInput = document.querySelector('#login form')

messages.textContent = sessionStorage.getItem('msg')
sessionStorage.removeItem('msg')

// form.addEventListener('submit', e => {
//    e.preventDefault()
//    fetch('/users/login', {
//       method: 'POST',
//       body: new FormData(form)
//    })
//       .then(res => res.json())
//       .then(data => {
//          sessionStorage.setItem('id', data)
//          window.location = './invoice'
//       })
// })
