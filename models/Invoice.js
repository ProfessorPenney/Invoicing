const mongoose = require('mongoose')

const InvoiceSchema = mongoose.Schema({
   invoiceNum: Number,
   customer: Number,
   total: Number,
   date: {
      month: Number,
      day: Number,
      year: Number
   },
   owed: Number,
   dueDate: {
      month: Number,
      day: Number,
      year: Number
   },
   sent: Boolean,
   payment: [
      {
         amount: Number,
         date: {
            month: Number,
            day: Number,
            year: Number
         },
         note: String
      }
   ],
   lineItems: [
      {
         title: String,
         description: String,
         quantity: Number,
         unitPrice: Number,
         amount: Number
      }
   ]
})

module.exports = InvoiceSchema
