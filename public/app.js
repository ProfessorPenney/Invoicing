const companyName = document.querySelector('#company')
const companyModal = document.querySelector('#company-modal')
const burger = document.querySelector('#burger')
const menuBlanket = document.querySelector('#menu-blanket')
const menu = document.querySelector('#menu')
const menuInfo = document.querySelector('#edit-company-info')
const companyCancelBtn = document.querySelector('#company-cancel')
const companyForm = document.querySelector('#company-form')
const companyNameInput = document.querySelector('#company-name')
const companyAddress1Input = document.querySelector('#company-address1')
const companyAddress2Input = document.querySelector('#company-address2')
const companyPhoneInput = document.querySelector('#company-phone')
const companyEmailInput = document.querySelector('#company-email')

const invoiceTable = document.querySelector('#invoice-list tbody')
const customerDataList = document.querySelector('#customer-list')
const streetInput = document.querySelector('#street')
const cityStateZipInput = document.querySelector('#city-state-zip')
const customerInput = document.querySelector('#customer')
const createInvoiceBtn = document.querySelector('#create-invoice-btn')
const dueInput = document.querySelector('#due')
const outstandingInvoices = document.querySelector('#outstanding-invoices')
const outstandingTotal = document.querySelector('#outstanding-total')
const ytdIncome = document.querySelector('#year-to-date-income')
const lastYtdIncome = document.querySelector('#last-year-income')

let invoiceList = null
let customerList = null

fetch('/api/companyinfo')
   .then(res => res.json())
   .then(data => {
      companyName.textContent = data.name
   })

fetch('/api/invoices')
   .then(res => res.json())
   .then(fillData)

fetch('/api/customers')
   .then(res => res.json())
   .then(fillcustomerDataList)

burger.addEventListener('click', () => {
   menuBlanket.style.display = 'block'
   menu.style.display = 'block'
})

menuBlanket.addEventListener('click', () => {
   menu.style.display = 'none'
   menuBlanket.style.display = 'none'
})

menuInfo.addEventListener('click', () => {
   menuBlanket.click()
   companyModal.classList.remove('display-none')
   fetch('/api/companyinfo')
      .then(res => res.json())
      .then(data => {
         companyNameInput.value = data.name
         companyAddress1Input.value = data.address.street
         companyAddress2Input.value = data.address.cityStateZip
         companyPhoneInput.value = data.phone
         companyEmailInput.value = data.email
      })
})

companyCancelBtn.addEventListener('click', () => {
   companyModal.classList.add('display-none')
})

companyForm.addEventListener('submit', e => {
   companyCancelBtn.click()
   e.preventDefault()
   fetch('api/companyinfo', {
      method: 'POST',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify({
         name: companyNameInput.value,
         address: {
            street: companyAddress1Input.value,
            cityStateZip: companyAddress2Input.value
         },
         phone: companyPhoneInput.value,
         email: companyEmailInput.value
      })
   })
      .then(res => res.json())
      .then(data => (companyName.textContent = data))
})

createInvoiceBtn.addEventListener('click', createInvoice)

function createInvoice(e) {
   e.preventDefault()
   fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify({
         customer: {
            name: customerInput.value,
            address: {
               street: streetInput.value,
               cityStateZip: cityStateZipInput.value
            }
         },
         daysUntilDue: dueInput.value
      })
   })
      .then(res => res.json())
      .then(data => {
         sessionStorage.setItem('id', data)
         window.location = './invoice'
      })
}

function fillcustomerDataList(customers) {
   customerList = customers
   customerDataList.innerHTML = ''
   customers.forEach(customer => {
      customerOption = document.createElement('option')
      customerOption.value = customer.name
      customerDataList.appendChild(customerOption)
   })
}

function custInput() {
   customerList.forEach(customer => {
      if (customerInput.value === customer.name) {
         streetInput.value = customer.address.street
         cityStateZipInput.value = customer.address.cityStateZip
      }
   })
}

// Populate invoice table
function fillData(invoiceList) {
   let outstandingTotalCount = 0
   let outstandingTotalAmount = 0
   let ytdIncomeAmount = 0
   let lastYtdIncomeAmount = 0

   const today = new Date()

   invoiceList.forEach(invoice => {
      if (invoice.owed > 0) {
         outstandingTotalCount++
         outstandingTotalAmount += invoice.owed
      }
      invoice.payment.forEach(pay => {
         if (pay.date.year == today.getFullYear()) {
            ytdIncomeAmount += pay.amount
         } else if (pay.date.year == today.getFullYear() - 1) {
            lastYtdIncomeAmount += pay.amount
         }
      })

      const invoiceRow = document.createElement('tr')

      const id = document.createElement('td')
      id.textContent = invoice.id
      invoiceRow.appendChild(id)

      const customer = document.createElement('td')
      customer.textContent = invoice.customer.name
      invoiceRow.appendChild(customer)

      const date = document.createElement('td')
      date.textContent = `${invoice.date.month}/${invoice.date.day}/${invoice.date.year}`
      invoiceRow.appendChild(date)

      const total = document.createElement('td')
      total.textContent = invoice.total.toFixed(2)
      total.classList.add('dolla-sign')
      invoiceRow.appendChild(total)

      const due = document.createElement('td')
      due.textContent = invoice.owed.toFixed(2)
      if (due.textContent > 0) {
         due.style.color = 'red'
      } else if (due.textContent < 0) {
         due.style.color = 'green'
      }
      invoiceRow.appendChild(due)

      const dueDate = document.createElement('td')
      dueDate.textContent = `${invoice.dueDate.month}/${invoice.dueDate.day}/${invoice.dueDate.year}`
      invoiceRow.appendChild(dueDate)

      invoiceRow.addEventListener('click', () => {
         sessionStorage.setItem('id', invoice.id)
         window.location = './invoice'
      })

      outstandingInvoices.textContent = outstandingTotalCount
      outstandingTotal.textContent = outstandingTotalAmount.toFixed(2)
      ytdIncome.textContent = ytdIncomeAmount.toFixed(2)
      lastYtdIncome.textContent = lastYtdIncomeAmount.toFixed(2)

      invoiceTable.appendChild(invoiceRow)
   })
}
