const companyName = document.querySelector('#company')
const burger = document.querySelector('#burger')
const menuBlanket = document.querySelector('#menu-blanket')
const menu = document.querySelector('#menu')
const menuDeleteInvoice = document.querySelector('#delete-invoice')
const deleteInvoiceBtn = document.querySelector('#delete-invoice-btn')
const cancelDeleteInvoiceBtn = document.querySelector('#cancel-delete-btn')
const menuEditInvoice = document.querySelector('#edit-invoice')
const menuInfo = document.querySelector('#edit-company-info')
const menuCustomers = document.querySelector('#edit-customers')
const modalEditInvoice = document.querySelector('#edit-invoice-modal')
const cancelEditInvoiceBtn = document.querySelector('#cancel-edit-invoice')
const editCustomerInput = document.querySelector('#edit-customer')
const editAddressInput = document.querySelector('#edit-street')
const editAddress2Input = document.querySelector('#edit-city-state-zip')
const editDateInput = document.querySelector('#edit-date')
const editDueInput = document.querySelector('#edit-due')
const customerDataList = document.querySelector('#customer-list')
const editInvoiceForm = document.querySelector('form#edit-invoice')

const modalDeleteInvoice = document.querySelector('#delete-invoice-modal')

const invoiceNum = document.querySelector('#invoice-num')
const invoiceCust = document.querySelector('#customer')
const invoiceAddress = document.querySelector('#address')
const invoiceTotal = document.querySelector('#total')
const invoiceDate = document.querySelector('#date')
const invoiceDueDate = document.querySelector('#due')
const invoiceOwed = document.querySelector('#owed')
const invoiceTotalPayments = document.querySelector('#total-payments')
const itemList = document.querySelector('#line-item-list ul')
const addBtn = document.querySelector('#add-item-btn')
const downloadBtn = document.querySelector('#download')
const PaymentBtn = document.querySelector('#payment-btn')
const invoicePayments = document.querySelector('#payments-div')

const modal = document.querySelector('#modal-add')
const addModals = document.querySelectorAll('.add-modal')
const editModals = document.querySelectorAll('.edit-modal')
const cancelModal = document.querySelector('#cancel')
const modalAddAndQuit = document.querySelector('.modal-add-btn')
const modalAddAndMore = document.querySelector('.modal-add-more-btn')
const modalTemplateBtn = document.querySelector('.modal-add-template-btn')
const modalEditBtn = document.querySelector('.modal-edit-btn')
const modalTitle = document.querySelector('#title')
const modalQty = document.querySelector('#qty')
const modalPrice = document.querySelector('#price')
const modalDescrip = document.querySelector('#description')

const paymentModal = document.querySelector('#payment-modal')
const PaymentForm = document.querySelector('#payment-modal form')
const cancelPayment = document.querySelector('#cancel-payment')
const paymentAmount = document.querySelector('#payment-amount')
const paymentDate = document.querySelector('#payment-date')
const paymentNote = document.querySelector('#payment-note')

const invoiceId = sessionStorage.getItem('id')

let itemTemplates = []
let itemId = null
const today = new Date()

PaymentForm.addEventListener('submit', e => {
   addPayment(e)
   cancelPayment.click()
})

// Get invoice items and fill data
fetch(`/api/invoices/${invoiceId}`)
   .then(res => res.json())
   .then(invoice => {
      fillDetails(invoice)
      fillPayments(invoice)
      fillInvoiceItems(invoice)
   })

fetch('/api/companyinfo')
   .then(res => res.json())
   .then(data => (companyName.textContent = data.name))

// Button listeners
burger.addEventListener('click', () => {
   menuBlanket.style.display = 'block'
   menu.style.display = 'block'
})

menuBlanket.addEventListener('click', () => {
   menu.style.display = 'none'
   menuBlanket.style.display = 'none'
})

menuDeleteInvoice.addEventListener('click', () => {
   menuBlanket.click()
   modalDeleteInvoice.classList.remove('display-none')
})

deleteInvoiceBtn.addEventListener('click', () => {
   fetch(`/api/invoices/${invoiceId}`, { method: 'DELETE' }).then(() => (window.location = '/'))
   modalDeleteInvoice.classList.add('display-none')
})

cancelDeleteInvoiceBtn.addEventListener('click', () => {
   modalDeleteInvoice.classList.add('display-none')
})

menuEditInvoice.addEventListener('click', () => {
   menuBlanket.click()
   modalEditInvoice.classList.remove('display-none')

   fetch(`/api/invoices/${invoiceId}`)
      .then(res => res.json())
      .then(invoice => {
         editCustomerInput.value = invoice.customer.name
         editAddressInput.value = invoice.customer.address.street
         editAddress2Input.value = invoice.customer.address.cityStateZip
         if (invoice.date.month < 10) invoice.date.month = '0' + invoice.date.month
         if (invoice.date.day < 10) invoice.date.day = '0' + invoice.date.day
         editDateInput.value = `${invoice.date.year}-${invoice.date.month}-${invoice.date.day}`
         if (invoice.dueDate.month < 10) invoice.dueDate.month = '0' + invoice.dueDate.month
         if (invoice.dueDate.day < 10) invoice.dueDate.day = '0' + invoice.dueDate.day
         editDueInput.value = `${invoice.dueDate.year}-${invoice.dueDate.month}-${invoice.dueDate.day}`
      })

   fetch('/api/customers')
      .then(res => res.json())
      .then(fillcustomerDataList)
   function fillcustomerDataList(customers) {
      customerList = customers
      customerDataList.innerHTML = ''
      customers.forEach(customer => {
         const customerOption = document.createElement('option')
         customerOption.value = customer.name
         customerDataList.appendChild(customerOption)
      })
   }
})

editInvoiceForm.addEventListener('submit', e => {
   e.preventDefault()
   cancelEditInvoiceBtn.click()
   fetch(`/api/invoices/${invoiceId}`, {
      method: 'PATCH',
      body: JSON.stringify({
         name: editCustomerInput.value,
         address1: editAddressInput.value,
         address2: editAddress2Input.value,
         date: editDateInput.value,
         dueDate: editDueInput.value
      }),
      headers: { 'Content-type': 'application/json' }
   })
      .then(res => res.json())
      .then(fillDetails)
})

cancelEditInvoiceBtn.addEventListener('click', () => {
   modalEditInvoice.classList.add('display-none')
})

addBtn.addEventListener('click', () => {
   addModals.forEach(addModal => addModal.classList.remove('display-none'))
   modalTitle.focus()
})

cancelModal.addEventListener('click', () => {
   addModals.forEach(addModal => addModal.classList.add('display-none'))
   editModals.forEach(editModal => editModal.classList.add('display-none'))
})

modalAddAndMore.addEventListener('click', addLineItem)

modalAddAndQuit.addEventListener('click', () => {
   addLineItem()
   cancelModal.click()
})

modalTemplateBtn.addEventListener('click', saveTemplateItem)

modalEditBtn.addEventListener('click', () => {
   cancelModal.click()
   editLineItem()
})

PaymentBtn.addEventListener('click', () => {
   paymentModal.classList.remove('display-none')
   paymentAmount.focus()
})

cancelPayment.addEventListener('click', () => {
   paymentModal.classList.add('display-none')
})

downloadBtn.addEventListener('click', createAndDownloadPdf)

fetchDataListOptions()

function custInput() {
   customerList.forEach(customer => {
      if (editCustomerInput.value === customer.name) {
         editAddressInput.value = customer.address.street
         editAddress2Input.value = customer.address.cityStateZip
      }
   })
}

// Open modal to edit a line item
function editModal() {
   modalTitle.value = this.children[0].textContent
   modalQty.value = this.children[2].textContent
   modalPrice.value = this.children[3].textContent
   modalDescrip.value = this.children[1].textContent.slice(3)
   editModals.forEach(editModal => editModal.classList.remove('display-none'))
   itemId = this.id.slice(5)
}

// FIll in data and generate the Line Item list
function fillDetails(invoice) {
   invoiceNum.textContent = invoiceId
   invoiceCust.textContent = invoice.customer.name
   invoiceAddress.textContent = `${invoice.customer.address.street}
   ${invoice.customer.address.cityStateZip}`
   invoiceDate.textContent = `${invoice.date.month}/${invoice.date.day}/${invoice.date.year}`
   invoiceDueDate.textContent = `${invoice.dueDate.month}/${invoice.dueDate.day}/${invoice.dueDate.year}`
}

function fillPayments(invoice) {
   invoiceTotalPayments.textContent = `$` + (invoice.total - invoice.owed).toFixed(2)

   const todaysMonth =
      today.getMonth() + 1 > 9 ? today.getMonth() + 1 : '0' + (today.getMonth() + 1)
   const todaysDate = today.getDate() > 9 ? today.getDate() : '0' + today.getDate()
   paymentDate.value = `${today.getFullYear()}-${todaysMonth}-${todaysDate}`

   invoicePayments.innerHTML = ''
   invoice.payment.forEach((payment, index) => {
      const divEl = document.createElement('div')
      divEl.id = `payment${index}`
      const paymentEl = document.createElement('p')
      paymentEl.textContent = `$${payment.amount}`
      divEl.appendChild(paymentEl)

      const dateEl = document.createElement('p')
      dateEl.textContent = `${payment.date.month}/${payment.date.day}/${payment.date.year}`
      divEl.appendChild(dateEl)

      const deleteBtnEl = document.createElement('button')
      deleteBtnEl.textContent = 'x'
      divEl.appendChild(deleteBtnEl)
      deleteBtnEl.addEventListener('click', deletePayment)

      invoicePayments.appendChild(divEl)

      if (payment.note != undefined && payment.note != '') {
         const paymentNoteEl = document.createElement('p')
         paymentNoteEl.textContent = ` -  ${payment.note}`
         invoicePayments.appendChild(paymentNoteEl)
      }
   })
}

function fillInvoiceItems(invoice) {
   invoiceTotal.textContent = invoice.total.toFixed(2)
   invoiceOwed.textContent = `$${invoice.owed.toFixed(2)}`

   if (!invoice.lineItems.length) {
      itemList.innerHTML = '<p style="text-align: center; margin-top: 60px;" >Empty invoice</p>'
   } else {
      itemList.innerHTML = ''
   }

   invoice.lineItems.forEach((item, index) => {
      title = document.createElement('p')
      title.textContent = item.title

      description = document.createElement('p')
      description.textContent = ' - ' + item.description

      amount = document.createElement('p')
      amount.classList.add('dolla-sign')
      amount.textContent = item.amount.toFixed(2)

      quantity = document.createElement('p')
      quantity.textContent = item.quantity

      unitPrice = document.createElement('p')
      unitPrice.classList.add('dolla-sign')
      unitPrice.textContent = item.unitPrice.toFixed(2)

      quitBtn = document.createElement('button')
      quitBtn.textContent = 'x'
      quitBtn.addEventListener('click', deleteItem)
      quitBtn.classList.add('red-button')
      quitBtn.style.top = index * 55.8 + 'px'

      deleteTip = document.createElement('p')
      deleteTip.classList.add('delete-tooltip')
      deleteTip.textContent = 'delete item'

      quitBtn.appendChild(deleteTip)

      oneItem = document.createElement('li')
      oneItem.id = 'item-' + index
      oneItem.addEventListener('click', editModal)
      oneItem.draggable = 'true'
      oneItem.addEventListener('dragstart', dragStart)
      oneItem.addEventListener('dragover', dragOver)
      oneItem.addEventListener('drop', drop)

      oneItem.appendChild(title)
      oneItem.appendChild(description)
      oneItem.appendChild(quantity)
      oneItem.appendChild(unitPrice)
      oneItem.appendChild(amount)
      itemList.appendChild(oneItem)
      itemList.appendChild(quitBtn)
   })
}

// saves data from modal and resets form
function getAndResetModalValues() {
   const body = {
      title: modalTitle.value,
      quantity: +modalQty.value,
      unitPrice: +modalPrice.value,
      description: modalDescrip.value
   }
   modalTitle.value = ''
   modalQty.value = '1'
   modalPrice.value = ''
   modalDescrip.value = ''

   return body
}

// edit an existing line item
function editLineItem() {
   const body = getAndResetModalValues()
   body.index = itemId
   body.itemTotal = +document.querySelector(`#item-${itemId}`).children[4].textContent

   fetch(`/api/invoices/${invoiceId}/item`, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: { 'Content-type': 'application/json' }
   })
      .then(res => res.json())
      .then(fillInvoiceItems)
}

// Add a line item
function addLineItem() {
   const body = getAndResetModalValues()

   fetch(`/api/invoices/${invoiceId}`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-type': 'application/json' }
   })
      .then(res => res.json())
      .then(fillInvoiceItems)
}

// Fill in template invoice items for the datalist object
function fetchDataListOptions() {
   fetch('/api/templates')
      .then(res => res.json())
      .then(fillDataListOptions)
}

function fillDataListOptions(templates) {
   itemTemplates = templates
   const dataList = document.querySelector('#items')
   dataList.innerHTML = ''
   templates.forEach(template => {
      const option = document.createElement('option')
      option.value = template.title
      dataList.appendChild(option)
   })
}

// Fills template info into form inputs
function onInput() {
   const value = document.querySelector('#title').value
   itemTemplates.forEach(template => {
      if (template.title === value) {
         modalTitle.value = template.title
         modalQty.value = template.quantity
         modalPrice.value = template.unitPrice
         modalDescrip.value = template.description
      }
   })
}

// Save new template
function saveTemplateItem() {
   fetch(`/api/templates`, {
      method: 'POST',
      body: JSON.stringify({
         title: modalTitle.value,
         quantity: +modalQty.value,
         unitPrice: +modalPrice.value,
         description: modalDescrip.value
      }),
      headers: { 'Content-type': 'application/json' }
   })
      .then(res => res.json())
      .then(fillDataListOptions)
}

// Drag & Drop Functions to reorder Line Item
function dragStart(e) {
   e.dataTransfer.setData('text', e.target.id.slice(5))
   e.dataTransfer.dropEffect = 'move'
}

function dragOver(e) {
   e.preventDefault()
   e.dataTransfer.dropEffect = 'move'
}

function drop(e, el) {
   e.preventDefault()
   const oldIndex = e.dataTransfer.getData('text')
   const newIndex = this.id.slice(5)

   fetch(`/api/invoices/${invoiceId}/item`, {
      method: 'PATCH',
      body: JSON.stringify({
         oldIndex,
         newIndex
      }),
      headers: { 'Content-type': 'application/json' }
   })
      .then(res => res.json())
      .then(fillInvoiceItems)
}

// Delete Line Item
function deleteItem() {
   const index = this.previousSibling.id.slice(5)
   fetch(`/api/invoices/${invoiceId}/item`, {
      method: 'DELETE',
      body: JSON.stringify({
         index,
         itemTotal: +document.querySelector(`#item-${index}`).children[4].textContent
      }),
      headers: { 'Content-type': 'application/json' }
   })
      .then(res => res.json())
      .then(fillInvoiceItems)
}

// Add a payment
function addPayment(e) {
   fetch(`/api/invoices/${invoiceId}/payment`, {
      method: 'POST',
      body: JSON.stringify({
         payAmount: paymentAmount.value,
         payDate: paymentDate.value,
         payNote: paymentNote.value
      }),
      headers: { 'Content-type': 'application/json' }
   })
      .then(res => res.json())
      .then(fillPayments)
   e.preventDefault()
}

// delete a payment
function deletePayment() {
   fetch(`/api/invoices/${invoiceId}/payment`, {
      method: 'DELETE',
      body: JSON.stringify({
         index: +this.parentNode.id.substring(7),
         payAmt: +this.parentNode.firstChild.textContent.slice(1)
      }),
      headers: { 'Content-type': 'application/json' }
   })
      .then(res => res.json())
      .then(invoice => {
         invoiceOwed.textContent = `$${invoice.owed.toFixed(2)}`
         fillPayments(invoice)
      })
}

// Creates PDF for download
function createAndDownloadPdf() {
   document.querySelector('#loading').style.display = 'flex'
   fetch(`/api/invoices/pdf/${invoiceId}`)
      .then(res => res.blob())
      .then(data => {
         const pdfBlob = new Blob([data], { type: 'application/pdf' })
         saveAs(pdfBlob, `Invoice${invoiceId}.pdf`)
         document.querySelector('#loading').style.display = 'none'
      })
}
