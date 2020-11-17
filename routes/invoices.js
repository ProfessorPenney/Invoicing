const express = require('express')
const router = express.Router()
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
         const newTotal = oneInvoice.lineItems.reduce((total, item) => total + item.amount, 0)
         const totalPayments = oneInvoice.payment.reduce((total, pay) => total + pay.amount, 0)
         const newOwed = oneInvoice.total - totalPayments
         if (newTotal !== oneInvoice.total || newOwed !== oneInvoice.owed) {
            User.updateOne(
               { _id: req.user._id, 'invoices.invoiceNum': +req.params.id },
               { $set: { 'invoices.$.total': newTotal, 'invoices.$.owed': newOwed } }
            ).exec(err => {
               if (err) return handleError(err)
               matchCustomer()
            })
         } else matchCustomer()
         function matchCustomer() {
            User.findById(req.user._id, {
               customers: { $elemMatch: { _id: oneInvoice.customer } }
            })
               .lean()
               .exec((err, user2) => {
                  if (err) return handleError(err)
                  if (user2.customers[0] === undefined) {
                     oneInvoice.customer = 'Customer not found'
                  } else {
                     oneInvoice.customer = user2.customers[0]
                  }
                  res.json(oneInvoice)
               })
         }
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
   User.updateOne(
      { _id: req.user._id },
      { $pull: { invoices: { invoiceNum: +req.params.id } } }
   ).exec(err => {
      if (err) return handleError(err)
      res.end()
   })
})

// Edit Invoice Info
router.patch('/:id', (req, res) => {
   const { name, address1, address2, date, dueDate } = req.body

   const newDate = {
      month: +date.split('-')[1],
      day: +date.split('-')[2],
      year: +date.split('-')[0]
   }
   const newDueDate = {
      month: +dueDate.split('-')[1],
      day: +dueDate.split('-')[2],
      year: +dueDate.split('-')[0]
   }

   // Update address if current customer
   User.updateOne(
      { _id: req.user._id, 'customers.name': name },
      { $set: { 'customers.$.address': { street: address1, cityStateZip: address2 } } }
   ).exec((err, result) => {
      if (err) return handleError(err)
      if (result.nModified === 1) {
         // update invoice date and due date if customer was found
         User.findOneAndUpdate(
            { _id: req.user._id, 'invoices.invoiceNum': +req.params.id },
            { $set: { 'invoices.$.dueDate': newDueDate, 'invoices.$.date': newDate } },
            { fields: { invoices: { $elemMatch: { invoiceNum: +req.params.id } } } }
         ).exec((err, user) => {
            if (err) return handleError(err)
            res.json(user.invoices[0])
         })
      } else {
         // create new customer
         const newCustomer = {
            _id: new mongoose.Types.ObjectId(),
            name,
            address: {
               street: address1,
               cityStateZip: address2
            }
         }

         User.findOneAndUpdate(
            { _id: req.user._id, 'invoices.invoiceNum': +req.params.id },
            {
               $push: { customers: newCustomer },
               $set: {
                  'invoices.$.dueDate': newDueDate,
                  'invoices.$.customer': newCustomer._id,
                  'invoices.$.date': newDate
               }
            },
            { fields: { invoices: { $elemMatch: { invoiceNum: +req.params.id } } } }
         ).exec((err, user) => {
            if (err) return handleError(err)
            res.json(user.invoices[0])
         })
      }
   })
})

// Edit line item
router.put('/:id/item', (req, res) => {
   const { index, title, description, unitPrice, quantity, itemTotal } = req.body

   const newLineItem = {
      title,
      description,
      quantity,
      unitPrice,
      amount: quantity * unitPrice
   }

   const addToTotal = newLineItem.amount - itemTotal

   User.findOneAndUpdate(
      {
         _id: req.user._id,
         'invoices.invoiceNum': +req.params.id
      },
      {
         $set: {
            [`invoices.$.lineItems.${index}`]: newLineItem
         },
         $inc: {
            'invoices.$.total': addToTotal,
            'invoices.$.owed': addToTotal
         }
      },
      { fields: { invoices: { $elemMatch: { invoiceNum: +req.params.id } } }, new: true }
   ).exec((err, user) => {
      if (err) return handleError(err)
      res.json(user.invoices[0])
   })
})

// delete line item
router.delete('/:id/item', (req, res) => {
   const { index, itemTotal } = req.body

   User.updateOne(
      { _id: req.user._id, 'invoices.invoiceNum': +req.params.id },
      {
         $unset: { [`invoices.$.lineItems.${index}`]: '' },
         $inc: { 'invoices.$.total': -itemTotal, 'invoices.$.owed': -itemTotal }
      }
   ).exec(err => {
      if (err) return handleError(err)
      User.findOneAndUpdate(
         { _id: req.user._id, 'invoices.invoiceNum': +req.params.id },
         { $pull: { 'invoices.$.lineItems': null } },
         { fields: { invoices: { $elemMatch: { invoiceNum: +req.params.id } } }, new: true }
      ).exec((err, user) => {
         if (err) return handleError(err)
         res.json(user.invoices[0])
      })
   })
})

// POST - Add payment
router.post('/:id/payment', (req, res) => {
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

   User.findOneAndUpdate(
      { _id: req.user._id, 'invoices.invoiceNum': +req.params.id },
      { $push: { 'invoices.$.payment': newPayment }, $inc: { 'invoices.$.owed': -payAmount } },
      { fields: { invoices: { $elemMatch: { invoiceNum: +req.params.id } } }, new: true }
   ).exec((err, user) => {
      if (err) return handleError(err)
      res.json(user.invoices[0])
   })
})

// DELETE payment
router.delete('/:id/payment', (req, res) => {
   const { index, payAmt } = req.body

   User.updateOne(
      { _id: req.user._id, 'invoices.invoiceNum': +req.params.id },
      {
         $unset: { [`invoices.$.payment.${index}`]: '' },
         $inc: { 'invoices.$.owed': payAmt }
      }
   ).exec(err => {
      if (err) return handleError(err)
      User.findOneAndUpdate(
         { _id: req.user._id, 'invoices.invoiceNum': +req.params.id },
         { $pull: { 'invoices.$.payment': null } },
         { fields: { invoices: { $elemMatch: { invoiceNum: +req.params.id } } }, new: true }
      ).exec((err, user) => {
         if (err) return handleError(err)
         res.json(user.invoices[0])
      })
   })
})

function handleError(err) {
   console.log('error handler says ', err)
}

module.exports = router
