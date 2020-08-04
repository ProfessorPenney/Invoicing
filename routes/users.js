const express = require('express')
const router = express.Router()
const fs = require('fs')
const bcrypt = require('bcryptjs')
const passport = require('passport')
const { v4: uuid } = require('uuid')

// Validation passed
router.post('/register', (req, res) => {
   fs.readFile('UserData.json', (err, data) => {
      if (err) throw err
      data = JSON.parse(data)

      const { name, email, password } = req.body

      let companyData = data.find(company => company.id.email === email)

      if (companyData) {
         res.end()
      } else {
         let newUser = {
            id: {
               id: uuid(),
               email,
               password
            },
            companyInfo: {
               name,
               address: {
                  street: '',
                  cityStateZip: ''
               },
               phone: '',
               email
            },
            numberofInvoices: 100,
            customers: [],
            templates: [],
            invoices: []
         }

         // Hash Password
         bcrypt.genSalt(10, (error, salt) => {
            bcrypt.hash(password, salt, (err, hash) => {
               if (err) throw err
               newUser.id.password = hash
               data.push(newUser)
               fs.writeFile('UserData.json', JSON.stringify(data, null, 2), err => {
                  if (err) throw err
                  res.end()
               })
            })
         })
      }
   })
})

//Login Handle
router.post('/login', (req, res, next) => {
   passport.authenticate('local', {
      successRedirect: '/',
      failureRedirect: '/login',
      failureFlash: true
   })(req, res, next)
})

// Logout Handle
router.get('/logout', (req, res) => {
   req.logout()
   req.flash('success_msg', 'You are logged out')
   res.redirect('/login')
})

module.exports = router
