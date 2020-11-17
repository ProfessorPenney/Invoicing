const express = require('express')
const router = express.Router()
const puppeteer = require('puppeteer')
const mongoose = require('mongoose')

const User = require('../models/UserData')

// GET - PDF generation and fetching of data
router.get('/:id', (req, res) => {
   User.findById(req.user._id, {
      invoices: { $elemMatch: { invoiceNum: +req.params.id } },
      companyInfo: 1
   })
      .lean()
      .exec((err, user) => {
         if (err) return handleError(err)
         User.findById(req.user._id, {
            customers: { $elemMatch: { _id: user.invoices[0].customer } }
         })
            .lean()
            .exec((err, user2) => {
               if (err) return handleError(err)
               if (user2.customers[0] === undefined) {
                  user.invoice[0].customer = {
                     name: 'Customer not found',
                     address: {
                        street: 'none',
                        cityStateZip: 'none'
                     }
                  }
               } else {
                  user.invoices[0].customer = user2.customers[0]
               }

               const { name, address, phone, email } = user.companyInfo

               let companyInfo = ''
               if (address.street != '') companyInfo += `${address.street} <br />`
               if (address.cityStateZip != '') companyInfo += `${address.cityStateZip} <br />`
               if (phone != '') companyInfo += `${phone} <br />`
               if (email != '') companyInfo += `${email} <br />`

               const {
                  id,
                  customer,
                  total,
                  date,
                  owed,
                  dueDate,
                  payment,
                  lineItems
               } = user.invoices[0]

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
               const totalPayments = payment.reduce((acc, pay) => acc + pay.amount, 0)

               const companyName = name
               const custName = customer.name
               const custStreet = customer.address.street
               const custCityStateZip = customer.address.cityStateZip
               const iDate = `${date.month}/${date.day}/${date.year}`
               const iOwed = owed.toFixed(2)
               const iDueDate = `${dueDate.month}/${dueDate.day}/${dueDate.year}`
               const iPayments = totalPayments.toFixed(2)
               const iTotal = total.toFixed(2)
               const lineItemsHTML = tableItems

               // puppeteer pdf
               ;(async function () {
                  try {
                     let browser = null
                     if (process.env.NODE_ENV == 'production') {
                        browser = await puppeteer.launch({
                           executablePath: '/usr/bin/chromium-browser',
                           args: ['--no-sandbox']
                        })
                     } // development
                     else browser = await puppeteer.launch()

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
                     console.log('error', e)
                  }
               })()
            })
      })
})

function handleError(err) {
   console.log('error handler says ', err)
}

module.exports = router
