const express = require('express')
const fs = require('fs')
const pdf = require('html-pdf')

const pdfTemplate = require('./documents')

const app = express()

app.use(express.urlencoded({ extended: false }))
app.use(express.json())

// get invoice list
app.get('/api/invoices', (req, res) => {
   fs.readFile('UserData.json', (err, data) => {
      if (err) throw err
      stuff = JSON.parse(data)
      res.json(stuff.invoices)
   })
})

// get customer list
app.get('/api/customers', (req, res) => {
   fs.readFile('UserData.json', (err, data) => {
      if (err) throw err
      stuff = JSON.parse(data)
      res.json(stuff.customers)
   })
})

// get single invoice
app.get('/api/invoices/:id', (req, res) => {
   fs.readFile('UserData.json', (err, data) => {
      if (err) throw err
      data = JSON.parse(data)
      oneInvoice = data.invoices.filter(invoice => invoice.id === parseInt(req.params.id))
      res.json(oneInvoice[0])
   })
})

// get templates
app.get('/api/templates', (req, res) => {
   fs.readFile('UserData.json', (err, data) => {
      if (err) throw err
      data = JSON.parse(data)
      res.json(data.templates)
   })
})

// drag and drop reorder line items
app.patch('/api/invoices/:id', (req, res) => {
   fs.readFile('UserData.json', (err, data) => {
      if (err) throw err
      data = JSON.parse(data)
      oneInvoice = data.invoices.filter(invoice => invoice.id === parseInt(req.params.id))
      lineItems = oneInvoice[0].lineItems

      const { oldIndex, newIndex } = req.body

      draggedItem = lineItems.slice(oldIndex, oldIndex + 1)[0]
      lineItems.splice(oldIndex, 1)
      lineItems.splice(newIndex, 0, draggedItem)

      fs.writeFile('UserData.json', JSON.stringify(data, null, 2), err => {
         if (err) throw err
         res.json(oneInvoice[0])
      })
   })
})

// Add new template line item
app.post('/api/templates', (req, res) => {
   fs.readFile('UserData.json', (err, data) => {
      if (err) throw err
      data = JSON.parse(data)

      const { title, description, quantity, unitPrice } = req.body
      const newTemplateItem = {
         title,
         description,
         quantity,
         unitPrice
      }
      data.templates.push(newTemplateItem)

      fs.writeFile('UserData.json', JSON.stringify(data, null, 2), err => {
         if (err) throw err
         res.json(data.templates)
      })
   })
})

// Add new line item
app.post('/api/invoices/:id', (req, res) => {
   fs.readFile('UserData.json', (err, data) => {
      if (err) throw err
      data = JSON.parse(data)
      const oneInvoice = data.invoices.filter(invoice => invoice.id === parseInt(req.params.id))[0]
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

      fs.writeFile('UserData.json', JSON.stringify(data, null, 2), err => {
         if (err) throw err
         res.json(oneInvoice)
      })
   })
})

// Add a new invoice
app.post('/api/invoices', (req, res) => {
   fs.readFile('UserData.json', (err, data) => {
      if (err) throw err
      data = JSON.parse(data)

      const { customer, daysUntilDue } = req.body
      var dueDate = new Date()
      const today = new Date()
      dueDate.setDate(dueDate.getDate() + +daysUntilDue)

      const newInvoice = {
         id: ++data.numberofInvoices,
         customer,
         total: 0,
         date: {
            month: today.getMonth(),
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
      data.invoices.unshift(newInvoice)

      fs.writeFile('UserData.json', JSON.stringify(data, null, 2), err => {
         if (err) throw err
         res.json(data.numberofInvoices)
      })
   })
})

// Edit line item
app.put('/api/invoices/:id', (req, res) => {
   fs.readFile('UserData.json', (err, data) => {
      if (err) throw err
      data = JSON.parse(data)
      oneInvoice = data.invoices.filter(invoice => invoice.id === parseInt(req.params.id))[0]
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

      fs.writeFile('UserData.json', JSON.stringify(data, null, 2), err => {
         if (err) throw err
         res.json(oneInvoice)
      })
   })
})

// delete line item
app.delete('/api/invoices/:id', (req, res) => {
   fs.readFile('UserData.json', (err, data) => {
      if (err) throw err
      data = JSON.parse(data)
      oneInvoice = data.invoices.filter(invoice => invoice.id === parseInt(req.params.id))[0]
      const { lineItems } = oneInvoice

      lineItems.splice(req.body.index, 1)

      oneInvoice.total = lineItems.reduce((total, item) => total + item.amount, 0)

      fs.writeFile('UserData.json', JSON.stringify(data, null, 2), err => {
         if (err) throw err
         res.json(oneInvoice)
      })
   })
})

// POST - Add payment
app.post('/api/invoices/:id/payment', (req, res) => {
   fs.readFile('UserData.json', (err, data) => {
      if (err) throw err
      data = JSON.parse(data)
      oneInvoice = data.invoices.filter(invoice => invoice.id === parseInt(req.params.id))[0]

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
app.delete('/api/invoices/:id/payment', (req, res) => {
   fs.readFile('UserData.json', (err, data) => {
      if (err) throw err
      data = JSON.parse(data)
      oneInvoice = data.invoices.filter(invoice => invoice.id === parseInt(req.params.id))[0]
      const { payment } = oneInvoice

      payment.splice(req.body.index, 1)

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

// POST - PDF generation and fetching of dat
app.post('/api/invoices/:id/pdf', (req, res) => {
   fs.readFile('UserData.json', (err, data) => {
      if (err) throw err
      data = JSON.parse(data)
      const oneInvoice = data.invoices.filter(invoice => invoice.id === parseInt(req.params.id))[0]

      const { id, customer, total, date, dueDate, lineItems } = oneInvoice
      let tableItems = ''
      lineItems.forEach(item => {
         tableItems += `<tr class="items">`
         if (item.description === '') {
            tableItems += `<td>${item.title}</td>`
         } else {
            tableItems += `<td>${item.title} <br> &nbsp&nbsp&nbsp&nbsp -&nbsp${item.description}</td>`
         }
         tableItems += `<td>${item.quantity}</td>
				<td>${item.unitPrice.toFixed(2)}</td>
				<td>$${item.amount.toFixed(2)}</td>
				</tr> `
      })

      const pdfData = {
         custName: customer.name,
         custStreet: customer.address.street,
         custCityStateZip: customer.address.cityStateZip,
         id,
         date: `${date.month}/${date.day}/${date.year}`,
         dueDate: `${dueDate.month}/${dueDate.day}/${dueDate.year}`,
         total: total.toFixed(2),
         lineItemsHTML: tableItems
      }

      pdf.create(pdfTemplate(pdfData), {}).toBuffer((err, buffer) => {
         if (err) return res.status(404).send(err)
         res.type('pdf')
         res.end(buffer, 'binary')
      })
   })
})

app.use('/', express.static(`${__dirname}/public`))

const PORT = process.env.PORT || 5000

app.listen(PORT, () => console.log(`Server started on port ${PORT}`))
