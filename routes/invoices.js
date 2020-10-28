const express = require('express')
const router = express.Router()
const fs = require('fs')

// get invoice list
router.get('/', (req, res) => {
   const invoices = req.user.invoices.map(invoice => {
      addCustomerInfo(invoice, req.user.customers)
      return invoice
   })
   res.json(invoices)
})

// get single invoice
router.get('/:id', (req, res) => {
   const oneInvoice = req.user.invoices.filter(invoice => invoice.id === parseInt(req.params.id))[0]
   addCustomerInfo(oneInvoice, req.user.customers)
   res.json(oneInvoice)
})

// drag and drop reorder line items
router.patch('/:id/item', (req, res) => {
   fs.readFile('UserData.json', (err, data) => {
      if (err) throw err
      data = JSON.parse(data)
      const oneCompany = data.filter(company => company.id.id === req.user.id.id)[0]
      const oneInvoice = oneCompany.invoices.filter(
         invoice => invoice.id === parseInt(req.params.id)
      )[0]
      const lineItems = oneInvoice.lineItems

      const { oldIndex, newIndex } = req.body

      const draggedItem = lineItems.slice(oldIndex, oldIndex + 1)[0] // unnecessary? dragged item = first splice?
      lineItems.splice(oldIndex, 1)
      lineItems.splice(newIndex, 0, draggedItem)

      fs.writeFile('UserData.json', JSON.stringify(data, null, 2), err => {
         if (err) throw err
         res.json(oneInvoice)
      })
   })
})

// Add new line item
router.post('/:id', (req, res) => {
   fs.readFile('UserData.json', (err, data) => {
      if (err) throw err
      data = JSON.parse(data)
      const oneCompany = data.filter(company => company.id.id === req.user.id.id)[0]
      const oneInvoice = oneCompany.invoices.filter(
         invoice => invoice.id === parseInt(req.params.id)
      )[0]
      const { lineItems } = oneInvoice
      const { title, description, quantity, unitPrice, amount } = req.body

      const newLineItem = {
         title,
         description,
         quantity,
         unitPrice,
         amount: quantity * unitPrice
      }
      lineItems.push(newLineItem)

      oneInvoice.total = lineItems.reduce((total, item) => total + item.amount, 0)
      let totalPayments = 0
      // const totalPayments = oneInvoice.payments.reduce((total, payment) => total + payment.amount, 0)
      oneInvoice.payment.forEach(pay => {
         totalPayments += pay.amount
      })
      oneInvoice.owed = oneInvoice.total - totalPayments

      fs.writeFile('UserData.json', JSON.stringify(data, null, 2), err => {
         if (err) throw err
         res.json(oneInvoice)
      })
   })
})

// Add a new invoice
router.post('/', (req, res) => {
   fs.readFile('UserData.json', (err, data) => {
      if (err) throw err
      data = JSON.parse(data)

      const oneCompany = data.filter(company => company.id.id === req.user.id.id)[0]
      const customerList = oneCompany.customers
      const { customer, daysUntilDue } = req.body

      // Add new customer if new
      if (customerList.length === 0) {
         // if first customer ever
         customerList.unshift(customer)
         customer.id = 1
      } else {
         customerList.forEach(customerFromList => {
            if (customerFromList.name == customer.name) {
               customer.id = customerFromList.id
               // update customer address in case it changed
               customerFromList.address.street = customer.address.street
               customerFromList.address.cityStateZip = customer.address.cityStateZip
            }
         })
         if (!customer.id) {
            // if New Customer
            customer.id = +customerList[0].id + 1
            customerList.unshift(customer)
         }
      }

      var dueDate = new Date()
      const today = new Date()
      dueDate.setDate(dueDate.getDate() + +daysUntilDue)

      const newInvoice = {
         id: ++oneCompany.numberofInvoices,
         customer: customer.id,
         total: 0,
         date: {
            month: today.getMonth() + 1,
            day: today.getDate(),
            year: today.getFullYear()
         },
         owed: 0,
         dueDate: {
            month: dueDate.getMonth(),
            day: dueDate.getDate(),
            year: dueDate.getFullYear()
         },
         sent: false,
         payment: [],
         lineItems: []
      }
      oneCompany.invoices.unshift(newInvoice)

      fs.writeFile('UserData.json', JSON.stringify(data, null, 2), err => {
         if (err) throw err
         res.json(newInvoice.id)
      })
   })
})

// DELETE invoice
router.delete('/:id', (req, res) => {
   fs.readFile('UserData.json', (err, data) => {
      if (err) throw err
      data = JSON.parse(data)
      const oneCompany = data.filter(company => company.id.id === req.user.id.id)[0]

      oneCompany.invoices.forEach((invoice, index) => {
         // use oneCompany.invoices.find(invoice => invoice.id === +req.params.id) One of the methods returns the index I think
         if (invoice.id === +req.params.id) {
            oneCompany.invoices.splice(index, 1)
         }
      })

      fs.writeFile('UserData.json', JSON.stringify(data, null, 2), err => {
         if (err) throw err
         res.end()
      })
   })
})

// Edit Invoice Info
router.patch('/:id', (req, res) => {
   fs.readFile('UserData.json', (err, data) => {
      if (err) throw err
      data = JSON.parse(data)
      const oneCompany = data.filter(company => company.id.id === req.user.id.id)[0]
      const oneInvoice = oneCompany.invoices.filter(
         invoice => invoice.id === parseInt(req.params.id)
      )[0]
      const { name, address1, address2, date, dueDate } = req.body
      const customerList = oneCompany.customers

      // Add new customer if new
      customerId = null
      customerList.forEach(customerFromList => {
         if (customerFromList.name == name) {
            customerId = customerFromList.id
            customerFromList.address.street = address1
            customerFromList.address.cityStateZip = address2
         }
      })
      if (customerId === null) {
         // if New Customer
         customerId = +customerList[0].id + 1
         const customer = {
            id: customerId,
            name,
            address: {
               street: address1,
               cityStateZip: address2
            }
         }
         customerList.unshift(customer)
      }

      oneInvoice.customer = customerId
      oneInvoice.date = {
         month: +date.split('-')[1],
         day: +date.split('-')[2],
         year: +date.split('-')[0]
      }
      oneInvoice.dueDate = {
         month: +dueDate.split('-')[1],
         day: +dueDate.split('-')[2],
         year: +dueDate.split('-')[0]
      }

      fs.writeFile('UserData.json', JSON.stringify(data, null, 2), err => {
         if (err) throw err
         res.json(oneInvoice)
      })
   })
})

// Edit line item
router.put('/:id/item', (req, res) => {
   fs.readFile('UserData.json', (err, data) => {
      if (err) throw err
      data = JSON.parse(data)
      const oneCompany = data.filter(company => company.id.id === req.user.id.id)[0]
      const oneInvoice = oneCompany.invoices.filter(
         invoice => invoice.id === parseInt(req.params.id)
      )[0]
      const { lineItems } = oneInvoice
      const { id, title, description, unitPrice, quantity } = req.body

      const newLineItem = {
         title,
         description,
         quantity,
         unitPrice,
         amount: quantity * unitPrice
      }
      lineItems[id] = newLineItem

      oneInvoice.total = lineItems.reduce((total, item) => total + item.amount, 0)
      let totalPayments = 0
      oneInvoice.payment.forEach(pay => {
         totalPayments += pay.amount
      })
      oneInvoice.owed = oneInvoice.total - totalPayments

      fs.writeFile('UserData.json', JSON.stringify(data, null, 2), err => {
         if (err) throw err
         res.json(oneInvoice)
      })
   })
})

// delete line item
router.delete('/:id/item', (req, res) => {
   fs.readFile('UserData.json', (err, data) => {
      if (err) throw err
      data = JSON.parse(data)
      const oneCompany = data.filter(company => company.id.id === req.user.id.id)[0]
      const oneInvoice = oneCompany.invoices.filter(
         invoice => invoice.id === parseInt(req.params.id)
      )[0]
      const { lineItems } = oneInvoice

      lineItems.splice(req.body.index, 1)

      oneInvoice.total = lineItems.reduce((total, item) => total + item.amount, 0)
      let totalPayments = 0
      oneInvoice.payment.forEach(pay => {
         totalPayments += pay.amount
      })
      oneInvoice.owed = oneInvoice.total - totalPayments

      fs.writeFile('UserData.json', JSON.stringify(data, null, 2), err => {
         if (err) throw err
         res.json(oneInvoice)
      })
   })
})

// POST - Add payment
router.post('/:id/payment', (req, res) => {
   fs.readFile('UserData.json', (err, data) => {
      if (err) throw err
      data = JSON.parse(data)
      const oneCompany = data.filter(company => company.id.id === req.user.id.id)[0]
      const oneInvoice = oneCompany.invoices.filter(
         invoice => invoice.id === parseInt(req.params.id)
      )[0]

      const { payAmount, payDate, payNote } = req.body

      const newPayment = {
         amount: +payAmount,
         date: {
            month: +payDate.split('-')[1],
            day: +payDate.split('-')[2],
            year: +payDate.split('-')[0]
         },
         note: payNote
      }

      oneInvoice.payment.push(newPayment)

      let totalPayments = 0
      oneInvoice.payment.forEach(pay => {
         totalPayments += pay.amount
      })
      oneInvoice.owed = oneInvoice.total - totalPayments

      fs.writeFile('UserData.json', JSON.stringify(data, null, 2), err => {
         if (err) throw err
         res.json(oneInvoice)
      })
   })
})

// DELETE payment
router.delete('/:id/payment', (req, res) => {
   fs.readFile('UserData.json', (err, data) => {
      if (err) throw err
      data = JSON.parse(data)
      const oneCompany = data.filter(company => company.id.id === req.user.id.id)[0]
      const oneInvoice = oneCompany.invoices.filter(
         invoice => invoice.id === parseInt(req.params.id)
      )[0]
      const { payment } = oneInvoice

      payment.splice(req.body.index, 1)

      let totalPayments = 0
      oneInvoice.payment.forEach(pay => (totalPayments += pay.amount))
      oneInvoice.owed = oneInvoice.total - totalPayments

      fs.writeFile('UserData.json', JSON.stringify(data, null, 2), err => {
         if (err) throw err
         res.json(oneInvoice)
      })
   })
})

function addCustomerInfo(invoice, customerList) {
   invoice.customer = customerList.find(customer => customer.id === invoice.customer)
}

module.exports = router
