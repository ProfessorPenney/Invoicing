const express = require('express')
const router = express.Router()
const fs = require('fs')
const mongoose = require('mongoose')

const User = require('../models/UserData')

// get invoice list
router.get('/', (req, res) => {
   User.findById(req.user._id, 'invoices customers')
      .lean()
      .exec((err, user) => {
         if (err) return handleError(err)
         const invoiceList = user.invoices.map(invoice => {
            invoice.customer = user.customers.find(customer => {
               if (invoice.customer === undefined) return (invoice.customer = { name: '' })
               return invoice.customer.equals(customer._id)
            })
            return invoice
         })
         res.json(invoiceList)
      })
})

// get single invoice
router.get('/:id', (req, res) => {
   User.findById(req.user._id, { invoices: { $elemMatch: { invoiceNum: +req.params.id } } })
      .lean()
      .exec((err, user) => {
         if (err) return handleError(err)
         const oneInvoice = user.invoices[0]
         User.findById(req.user._id, {
            customers: { $elemMatch: { _id: oneInvoice.customer } }
         })
            .lean()
            .exec((err, user2) => {
               if (err) return handleError(err)
               if (user2.customers[0] === undefined) {
                  // remove later
                  oneInvoice.customer = ''
               } else {
                  oneInvoice.customer = user2.customers[0]
               }
               res.json(oneInvoice)
            })
      })
})

// drag and drop reorder line items
router.patch('/:id/item', (req, res) => {
   User.findById(req.user._id, { invoices: { $elemMatch: { invoiceNum: +req.params.id } } })
      .lean()
      .exec((err, user) => {
         if (err) return handleError(err)
         const oneInvoice = user.invoices[0]
         const { lineItems } = oneInvoice
         const { oldIndex, newIndex } = req.body

         const draggedItem = lineItems.splice(oldIndex, 1)[0]
         lineItems.splice(newIndex, 0, draggedItem)
         User.updateOne(
            { _id: user._id, 'invoices.invoiceNum': +req.params.id },
            { $set: { 'invoices.$.lineItems': lineItems } }
         ).exec(err => {
            if (err) return handleError(err)
            res.json(oneInvoice)
         })
      })
})

// Add new line item
router.post('/:id', (req, res) => {
   User.findById(req.user._id, { invoices: { $elemMatch: { invoiceNum: +req.params.id } } })
      .lean()
      .exec((err, user) => {
         if (err) return handleError(err)

         const { title, description, quantity, unitPrice } = req.body
         const newLineItem = {
            title,
            description,
            quantity,
            unitPrice,
            amount: quantity * unitPrice
         }
         const oneInvoice = user.invoices[0]
         const { lineItems } = oneInvoice
         lineItems.push(newLineItem)

         oneInvoice.total = lineItems.reduce((total, item) => total + item.amount, 0)
         const totalPayments = oneInvoice.payment.reduce((acc, payment) => acc + payment.amount, 0)
         oneInvoice.owed = oneInvoice.total - totalPayments

         User.findOneAndUpdate(
            { _id: req.user._id, 'invoices.invoiceNum': +req.params.id },
            { $set: { 'invoices.$': oneInvoice } },
            {
               fields: { invoices: { $elemMatch: { invoiceNum: oneInvoice.invoiceNum } } },
               new: true
            }
         ).exec((err, user) => {
            if (err) return handleError(err)
            console.log(user)
            res.json(user.invoices[0])
         })
      })
})

// Add a new invoice
router.post('/', (req, res) => {
   const { daysUntilDue } = req.body
   var dueDate = new Date()
   const today = new Date()
   dueDate.setDate(dueDate.getDate() + +daysUntilDue)
   User.findByIdAndUpdate(
      req.user._id,
      { $inc: { numberofInvoices: 1 } },
      {
         fields: {
            numberofInvoices: 1,
            customers: { $elemMatch: { name: req.body.customer.name } }
         }
      }
   ).exec((err, user) => {
      if (err) return handleError(err)

      const newInvoice = {
         invoiceNum: ++user.numberofInvoices,
         total: 0,
         date: {
            month: today.getMonth() + 1,
            day: today.getDate(),
            year: today.getFullYear()
         },
         owed: 0,
         dueDate: {
            month: dueDate.getMonth() + 1,
            day: dueDate.getDate(),
            year: dueDate.getFullYear()
         },
         sent: false,
         payment: [],
         lineItems: []
      }

      if (user.customers[0]) {
         // if existing customer
         newInvoice.customer = user.customers[0]._id
         addNewInvoice()
      } else {
         User.findOneAndUpdate(
            { _id: req.user._id },
            { $push: { customers: { $each: [req.body.customer], $position: 0 } } },
            { fields: { customers: { $elemMatch: { name: req.body.customer.name } } }, new: true }
         )
            .lean()
            .exec((err, user2) => {
               if (err) return handleError(err)
               console.log('user2 - ', user2)
               newInvoice.customer = user2.customers[0]._id
               addNewInvoice()
            })
      }
      function addNewInvoice() {
         User.updateOne(
            { _id: req.user._id },
            { $push: { invoices: { $each: [newInvoice], $position: 0 } } }
         ).exec(err => {
            if (err) return handleError(err)
            res.json(newInvoice.invoiceNum)
         })
      }
   })
})

// DELETE invoice
router.delete('/:id', (req, res) => {
   fs.readFile('UserData.json', (err, data) => {
      if (err) throw err
      data = JSON.parse(data)
      const oneCompany = data.find(company => company.id.id === req.user.id.id)

      deleteIndex = oneCompany.invoices.findIndex(invoice => invoice.id === +req.params.id)
      if (deleteIndex >= 0) oneCompany.invoices.splice(deleteIndex, 1)

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
      const oneCompany = data.find(company => company.id.id === req.user.id.id)
      const oneInvoice = oneCompany.invoices.find(invoice => invoice.id === +req.params.id)
      const { name, address1, address2, date, dueDate } = req.body
      const customerList = oneCompany.customers

      // Add new customer if new
      customerId = null
      const customerAlreadyExists = customerList.find(customer => customer.name === name)
      if (customerAlreadyExists) {
         customerId = customerAlreadyExists.id
         customerAlreadyExists.address.street = address1
         customerAlreadyExists.address.cityStateZip = address2
      }
      // customerList.forEach(customerFromList => {
      //    if (customerFromList.name == name) {
      //       customerId = customerFromList.id
      //       customerFromList.address.street = address1
      //       customerFromList.address.cityStateZip = address2
      //    }
      // })
      if (!customerId) {
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
      const oneCompany = data.find(company => company.id.id === req.user.id.id)
      const oneInvoice = oneCompany.invoices.find(invoice => invoice.id === +req.params.id)
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
      const totalPayments = oneInvoice.payment.reduce((total, pay) => total + pay.amount, 0)
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
      const oneCompany = data.find(company => company.id.id === req.user.id.id)
      const oneInvoice = oneCompany.invoices.find(invoice => invoice.id === +req.params.id)
      const { lineItems } = oneInvoice

      lineItems.splice(req.body.index, 1)

      oneInvoice.total = lineItems.reduce((total, item) => total + item.amount, 0)
      const totalPayments = oneInvoice.payment.reduce((total, pay) => total + pay.amount, 0)
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
      const oneCompany = data.find(company => company.id.id === req.user.id.id)
      const oneInvoice = oneCompany.invoices.find(invoice => invoice.id === +req.params.id)

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

      const totalPayments = oneInvoice.payment.reduce((total, pay) => total + pay.amount, 0)
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
      const oneCompany = data.find(company => company.id.id === req.user.id.id)
      const oneInvoice = oneCompany.invoices.find(invoice => invoice.id === +req.params.id)
      const { payment } = oneInvoice

      payment.splice(req.body.index, 1)

      const totalPayments = oneInvoice.payment.reduce((total, pay) => total + pay.amount, 0)
      oneInvoice.owed = oneInvoice.total - totalPayments

      fs.writeFile('UserData.json', JSON.stringify(data, null, 2), err => {
         if (err) throw err
         res.json(oneInvoice)
      })
   })
})

function addCustomerInfo(invoice, customerList) {
   return customerList.find(customer => {
      // console.log('invoice', invoice.customer)
      // console.log('customer', customer.id)
      return customer.id === invoice.customer
   })
}
function handleError(err) {
   console.log('error handler says ', err)
}

module.exports = router
