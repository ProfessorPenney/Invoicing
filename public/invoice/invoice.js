const invoiceNum = document.querySelector('#invoice-num')
const invoiceCust = document.querySelector('#customer')
const invoiceAddress = document.querySelector('#address')
const invoiceTotal = document.querySelector('#total')
const invoiceDate = document.querySelector('#date')
const invoiceSent = document.querySelector('#sent')
const invoicePaid = document.querySelector('#paid')
const itemList = document.querySelector('#line-item-list ul')
const addBtn = document.querySelector('#add-item-btn')

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

const invoiceId = sessionStorage.getItem('id')

let templates = []
let itemId = null

const downloadBtn = document.querySelector('#download')

downloadBtn.addEventListener('click', createAndDownloadPdf)

function createAndDownloadPdf() {
   // fetch('/api/invoices/' + invoiceId)
   // .then(res => res.json())
   // .then(invoice => {
   // 	fetch('/api/pdf')
   // 		.then(res => res.blob())
   // 		.then(data => {
   // 			const pdfBlob = new Blob([data], { type: 'application/pdf' })
   // 			saveAs(pdfBlob, 'tempPdf.pdf')
   // 		})
   // }

   fetch(`/api/invoices/${invoiceId}/pdf`, {
      method: 'POST',
      body: JSON.stringify({
         name: '',
         receiptId: 0,
         price1: 0,
         price2: 0,
      }),
      headers: { 'Content-type': 'application/json' },
   })
      .then(res => res.blob())
      .then(data => {
         const pdfBlob = new Blob([data], { type: 'application/pdf' })
         saveAs(pdfBlob, 'newPdf.pdf')
      })
}

// Get invoice items and call fillData
fetch('/api/invoices/' + invoiceId)
   .then(res => res.json())
   .then(fillData)

// Button listeners
addBtn.addEventListener('click', () =>
   addModals.forEach(addModal => addModal.classList.remove('display-none'))
)

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
   editLineItem()
   cancelModal.click()
})

fetchDataListOptions()

// Open modal to edit a line item
function editModal() {
   modalTitle.value = this.children[0].textContent
   modalQty.value = this.children[2].textContent
   modalPrice.value = this.children[3].textContent
   modalDescrip.value = this.children[1].textContent.slice(3)
   editModals.forEach(editModal => editModal.classList.remove('display-none'))
   itemId = this.id
}

// FIll in data and generate the Line Item list
function fillData(invoice) {
   invoiceNum.textContent = invoiceId
   invoiceCust.textContent = invoice.customer.name
   invoiceAddress.textContent = `${invoice.customer.address.street}
                                 ${invoice.customer.address.cityStateZip}`
   invoiceTotal.textContent = invoice.total.toFixed(2)
   invoiceDate.textContent = `${invoice.date.month}/${invoice.date.day}/${invoice.date.year}`
   invoiceSent.textContent = invoice.sent === true ? 'Emailed' : 'Nope'
   invoicePaid.textContent = invoice.paid === true ? 'Paid' : 'Outstanding'

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
      quitBtn.style.top = index * 55.8 + 'px'

      deleteTip = document.createElement('p')
      deleteTip.classList.add('delete-tooltip')
      deleteTip.textContent = 'delete item'

      quitBtn.appendChild(deleteTip)

      oneItem = document.createElement('li')
      oneItem.id = index
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
      description: modalDescrip.value,
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
   body.id = itemId

   fetch(`/api/invoices/${invoiceId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: { 'Content-type': 'application/json' },
   })
      .then(res => res.json())
      .then(fillData)
}

// Add a line item
function addLineItem() {
   const body = getAndResetModalValues()

   fetch(`/api/invoices/${invoiceId}`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-type': 'application/json' },
   })
      .then(res => res.json())
      .then(fillData)
}

// Fill in template invoice items for the datalist object
function fetchDataListOptions() {
   fetch('/api/templates')
      .then(res => res.json())
      .then(fillDataListOptions)
}

function fillDataListOptions(templates) {
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
   const template = templates.forEach(template => {
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
         qty: modalQty.value,
         unitPrice: modalPrice.value,
         description: modalDescrip.value,
      }),
      headers: { 'Content-type': 'application/json' },
   })
      .then(res => res.json())
      .then(fillDataListOptions)
}

// Drag & Drop Functions to reorder Line Item
function dragStart(e) {
   e.dataTransfer.setData('text', e.target.id)
   e.dataTransfer.dropEffect = 'move'
}

function dragOver(e) {
   e.preventDefault()
   e.dataTransfer.dropEffect = 'move'
}

function drop(e, el) {
   e.preventDefault()
   const oldIndex = e.dataTransfer.getData('text')
   const newIndex = this.id

   fetch(`/api/invoices/${invoiceId}`, {
      method: 'PATCH',
      body: JSON.stringify({
         oldIndex,
         newIndex,
      }),
      headers: { 'Content-type': 'application/json' },
   })
      .then(res => res.json())
      .then(fillData)
}

// Delete Line Item
function deleteItem() {
   fetch(`/api/invoices/${invoiceId}`, {
      method: 'DELETE',
      body: JSON.stringify({
         index: this.previousSibling.id,
      }),
      headers: { 'Content-type': 'application/json' },
   })
      .then(res => res.json())
      .then(fillData)
}
