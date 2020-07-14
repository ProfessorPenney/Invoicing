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

fetch('/api/invoices')
	.then(res => res.json())
	.then(fillData)

fetch('/api/customers')
	.then(res => res.json())
	.then(fillcustomerDataList)

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
					cityStateZip: cityStateZipInput.value,
				},
			},
			daysUntilDue: dueInput.value,
		}),
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
		if (invoice.payment.paid === false) {
			outstandingTotalCount++
			outstandingTotalAmount += invoice.total
		}

		if (invoice.payment.date.year === today.getFullYear()) {
			ytdIncomeAmount += invoice.total
		} else if (invoice.payment.date.year === today.getFullYear() - 1) {
			lastYtdIncomeAmount += invoice.total
		}

		const invoiceRow = document.createElement('tr')

		const id = document.createElement('td')
		id.textContent = invoice.id
		invoiceRow.appendChild(id)

		const customer = document.createElement('td')
		customer.textContent = invoice.customer.name
		invoiceRow.appendChild(customer)

		const total = document.createElement('td')
		total.textContent = invoice.total.toFixed(2)
		total.classList.add('dolla-sign')
		invoiceRow.appendChild(total)

		const date = document.createElement('td')
		date.textContent = `${invoice.date.month}/${invoice.date.day}/${invoice.date.year}`
		invoiceRow.appendChild(date)

		const dueDate = document.createElement('td')
		dueDate.textContent = `${invoice.dueDate.month}/${invoice.dueDate.day}/${invoice.dueDate.year}`
		invoiceRow.appendChild(dueDate)

		const paid = document.createElement('td')
		paid.textContent = invoice.payment.paid === true ? 'Paid' : 'Outstanding'
		invoiceRow.appendChild(paid)

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
