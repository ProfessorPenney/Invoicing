const mongoose = require('mongoose')

const UserSchema = mongoose.Schema({
   login: {
      email: String,
      password: String
   },
   companyInfo: {
      name: String,
      address: {
         street: String,
         cityStateZip: String
      },
      phone: String,
      email: String
   },
   numberofInvoices: Number,
   customers: [
      {
         name: String,
         address: {
            street: String,
            cityStateZip: String
         }
      }
   ],
   templates: [
      {
         _id: false,
         title: String,
         description: String,
         quantity: Number,
         unitPrice: Number
      }
   ],
   invoices: [
      {
         _id: false,
         invoiceNum: Number,
         customer: mongoose.Schema.Types.ObjectId,
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
               _id: false,
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
               _id: false,
               title: String,
               description: String,
               quantity: Number,
               unitPrice: Number,
               amount: Number
            }
         ]
      }
   ]
})

module.exports = mongoose.model('User', UserSchema)
