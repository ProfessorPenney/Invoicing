const mongoose = require('mongoose')

const UserSchema = mongoose.Schema({
   login: {
      id: String, // remove this later
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
         type: mongoose.Schema.Types.ObjectId,
         ref: 'Invoice'
      }
   ]
})

module.exports = mongoose.model('User', UserSchema)
