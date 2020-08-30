const express = require('express')
const fs = require('fs')
const session = require('express-session')
const passport = require('passport')
const flash = require('connect-flash')
const compression = require('compression')
const helmet = require('helmet')
const { ensureAuthenticated } = require('./config/auth')
const puppeteer = require('puppeteer')

const app = express()

app.use(helmet())

app.use(express.urlencoded({ extended: false }))
app.use(express.json())

// Passport config
require('./config/passport')(passport)

// Express Session Middleware
app.use(
   session({
      secret: 'special sauce is the best sauce',
      resave: true,
      saveUninitialized: true,
      cookie: { maxAge: 80000000 }
   })
)

// Passport middleware
app.use(passport.initialize())
app.use(passport.session())

// Connect flash Middleware
app.use(flash())

// Compression
app.use(compression())

// Route
app.use('/users', require('./routes/users'))

// get invoice list
app.get('/api/invoices', (req, res) => {
   const customerList = req.user.customers
   let invoiceList = req.user.invoices
   invoiceList.forEach(invoice => {
      customerList.forEach(customer => {
         if (invoice.customer === customer.id) {
            invoice.customer = customer
         }
      })
   })
   res.json(invoiceList)
})

// get customer list
app.get('/api/customers', (req, res) => {
   res.json(req.user.customers)
})

// get single invoice
app.get('/api/invoices/:id', (req, res) => {
   const oneInvoice = req.user.invoices.filter(invoice => invoice.id === parseInt(req.params.id))[0]
   req.user.customers.forEach(customer => {
      if (oneInvoice.customer === customer.id) {
         oneInvoice.customer = customer
      }
   })
   res.json(oneInvoice)
})

// get company info
app.get('/api/companyinfo', (req, res) => {
   res.json(req.user.companyInfo)
})

// POST - edit company info
app.post('/api/companyinfo', (req, res) => {
   fs.readFile('UserData.json', (err, data) => {
      if (err) throw err
      data = JSON.parse(data)

      const oneCompany = data.filter(company => company.id.id === req.user.id.id)[0]
      oneCompany.companyInfo = req.body

      fs.writeFile('UserData.json', JSON.stringify(data, null, 2), err => {
         if (err) throw err
         res.end()
      })
   })
})

// get templates
app.get('/api/templates', (req, res) => {
   res.json(req.user.templates)
})

// drag and drop reorder line items
app.patch('/api/invoices/:id/item', (req, res) => {
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

// Add new template line item
app.post('/api/templates', (req, res) => {
   fs.readFile('UserData.json', (err, data) => {
      if (err) throw err
      data = JSON.parse(data)
      const oneCompany = data.filter(company => company.id.id === req.user.id.id)[0]

      const { title, description, quantity, unitPrice } = req.body
      const newTemplateItem = {
         title,
         description,
         quantity,
         unitPrice
      }
      oneCompany.templates.push(newTemplateItem)

      fs.writeFile('UserData.json', JSON.stringify(data, null, 2), err => {
         if (err) throw err
         res.json(oneCompany.templates)
      })
   })
})

// Add new line item
app.post('/api/invoices/:id', (req, res) => {
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
app.post('/api/invoices', (req, res) => {
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
app.delete('/api/invoices/:id', (req, res) => {
   fs.readFile('UserData.json', (err, data) => {
      if (err) throw err
      data = JSON.parse(data)
      const oneCompany = data.filter(company => company.id.id === req.user.id.id)[0]

      oneCompany.invoices.forEach((invoice, index) => {
         if (invoice.id === +req.params.id) {
            console.log(invoice, index)
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
app.patch('/api/invoices/:id', (req, res) => {
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
app.put('/api/invoices/:id/item', (req, res) => {
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
app.delete('/api/invoices/:id/item', (req, res) => {
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
app.post('/api/invoices/:id/payment', (req, res) => {
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
app.delete('/api/invoices/:id/payment', (req, res) => {
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

// GET - PDF generation and fetching of dat
app.get('/api/invoices/:id/pdf', (req, res) => {
   fs.readFile('UserData.json', (err, data) => {
      if (err) throw err
      data = JSON.parse(data)
      const oneCompany = data.filter(company => company.id.id === req.user.id.id)[0]
      const oneInvoice = oneCompany.invoices.filter(
         invoice => invoice.id === parseInt(req.params.id)
      )[0]

      const { name, address, phone, email } = oneCompany.companyInfo

      req.user.customers.forEach(customer => {
         if (oneInvoice.customer === customer.id) {
            oneInvoice.customer = customer
         }
      })

      let companyInfo = ''
      if (address.street != '') companyInfo += `${address.street} <br />`
      if (address.cityStateZip != '') companyInfo += `${address.cityStateZip} <br />`
      if (phone != '') companyInfo += `${phone} <br />`
      if (email != '') companyInfo += `${email} <br />`

      const { id, customer, total, date, owed, dueDate, payment, lineItems } = oneInvoice
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
      let payments = 0
      payment.forEach(pay => (payments += pay.amount))

      const companyName = name
      const custName = customer.name
      const custStreet = customer.address.street
      const custCityStateZip = customer.address.cityStateZip
      const iDate = `${date.month}/${date.day}/${date.year}`
      const iOwed = owed.toFixed(2)
      const iDueDate = `${dueDate.month}/${dueDate.day}/${dueDate.year}`
      const iPayments = payments.toFixed(2)
      const iTotal = total.toFixed(2)
      const lineItemsHTML = tableItems

      // puppeteer pdf
      ;(async function () {
         try {
            // Switch between values for development(top) and production(bottom)

            // Development
            const browser = await puppeteer.launch()

            // Production
            // const browser = await puppeteer.launch({
            //    executablePath: '/usr/bin/chromium-browser',
            //    args: ['--no-sandbox']
            // })

            const page = await browser.newPage()
            await page.setContent(
               `
               <!DOCTYPE html>
               <html>
                  <head>
                     <meta charset="utf-8" />
                     <style>
                     .container {
                        max-width: 750px;
                        margin: auto auto auto auto;
                        padding: 0 30px 30px 30px;
                        font-size: 16px;
                        line-height: 24px;
                        font-family: Arial, Helvetica, sans-serif, 'Helvetica';
                        color: black;
                     }
                     
                     #header {
                        position: relative;
                        min-height: 200px;
                     }

                     #header h1 {
                        margin-top: 0;
                        padding-top: 0;
                        width: 410px;
                        line-height: 1.2;
                     }
                     
                     #header #invoice-bold {
                        position: absolute;
                        margin-top: 0;
                        right: 0px;
                        top: 0px;
                        letter-spacing: 0.5em;
                        color: rgb(20, 136, 230);
                        width: auto;
                     }
                     
                     #header #top-stats {
                        position: absolute;
                        left: 550px;
                        top: 30px;
                        font-size: large;
                     }
                     #header #top-stats #left {
                        position: relative;
                        top: 0;
                        right: 80px;
                        text-align: right;
                     }

                     #header #top-stats #right {
                        position: absolute;
                        top: 0;
                        left: 40px;
                     }

                     .total-due {
                        font-size: x-large;
                     }
                     
                     table {
                        position: relative;
                        width: 100%;
                        text-align: right;
                        border-collapse: collapse;
                        font-size: medium;
                        margin-top: 40px;
                     }

                     table tr {
                        height: 40px;
                        page-break-inside: avoid;
                     }
                     
                     table th {
                        background: rgb(20, 136, 230);
                        color: white;
                        height: 30px;
                        padding-left: 5px;
                        padding-right: 5px;
                     }
                     
                     table td {
                        border-left: 1px solid rgb(175, 175, 175);
                        padding-left: 5px;
                        padding-right: 5px;
                     }
                     
                     table tr :first-child {
                        border-left: none;
                        text-align: left;
                     }
                     
                     table tr :nth-child(2) {
                        width: 50px;
                     }
                     
                     table tr :nth-child(3) {
                        width: 100px;
                     }
                     
                     table tr :nth-child(4) {
                        width: 100px;
                     }
                     
                     table tr * {
                        border-bottom: 1px solid rgb(175, 175, 175);
                     }
                     
                     #table-total {
                        margin-left: auto;
                        text-align: right;
                        width: 220px;
                        font-size: large;
                        page-break-inside: avoid;
                     }
                     
                     #table-total span {
                        margin-top: 10px;
                        margin-right: 5px;
                        display: inline-block;
                        width: 100px;
                     }
                     </style>
                  </head>
                  <body>
                  <div class="container">
                     <div id="header">
                        <h1 id="company-name">${companyName}<br /></h1>
                        <p id="company-address">
                           ${companyInfo}
                        </p>
                        <h3 id="customer">
                           Bill to: <br />
                        </h3>
                        <p>
                           ${custName} <br />
                           ${custStreet} <br />
                           ${custCityStateZip}
                        </p>
                        <h1 id="invoice-bold">INVOICE</h1>
                        <div id="top-stats">
                           <div id="left">
                              <p>
                                 Invoice: <br />
                              </p>
                              <p>
                                 Date: <br />
                              </p>
                              <p>
                                 Due: <br />
                              </p>
                              <p class="total-due">
                                 Total Due: 
                              </p>
                           </div>
                           <div id="right">
                              <p>
                                 ${id} <br />
                              </p>
                              <p>
                                 ${iDate} <br />
                              </p>
                              <p>
                                 ${iDueDate} <br />
                              </p>
                              <p class="total-due">
                                 $${iOwed}
                              </p>
                           </div>
                           
                        </div>

                     </div>
                     <table>
                        <tr id="heading">
                           <th>Description</th>
                           <th>Quantity</th>
                           <th>Unit Price</th>
                           <th>Total Price</th>
                        </tr>
                        ${lineItemsHTML}
                     </table>
                     <div id="table-total">
                        <span>Total:</span>
                        <span>$${iTotal}</span>
                        <span>Payments:</span>
                        <span>-$${iPayments}</span>
                        <span>Due:</span>
                        <span>$${iOwed}</span>
                     </div>
                  </div>
                  </body>
               </html>
               `
            )
            const newPDF = await page.pdf({
               printBackground: true,
               displayHeaderFooter: true,
               footerTemplate: `<div style="font-size: 12px; text-align: center; margin: auto; width: 750px;">
                  <span class="pageNumber"></span><span>/</span><span class="totalPages"></span>
                  </div>`,
               headerTemplate: `<div>`,
               margin: { bottom: 100, top: 80, right: 20, left: 20 }
            })

            await browser.close()
            res.type('pdf')
            res.end(newPDF, 'binary')
         } catch (e) {
            console.log('our error', e)
         }
      })()
   })
})

app.use('/login', express.static(`${__dirname}/public/login`))

app.use('/register', express.static(`${__dirname}/public/register`))

app.use('/', ensureAuthenticated, express.static(`${__dirname}/public`))

const PORT = process.env.PORT || 6357

app.listen(PORT, () => console.log(`Server started on port ${PORT}`))
