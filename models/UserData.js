const mongoose = require('mongoose')

const UserSchema = mongoose.Schema({
   id: {
      id: String,
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
         id: Number,
         name: String,
         address: {
            street: String,
            cityStateZip: String
         }
      }
   ],
   templates: [
      {
         title: String,
         description: String,
         quantity: Number,
         unitPrice: Number
      }
   ],
   invoices: [
      {
         id: Number,
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
      }
   ]
})

module.exports = mongoose.model('User', UserSchema)


/*
const user = new User({
   
})


*/