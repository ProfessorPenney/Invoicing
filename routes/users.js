const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const passport = require('passport')
const mongoose = require('mongoose')

const User = require('../models/UserData')
// Validation passed
router.post('/register', (req, res) => {
   const { name, email, password } = req.body

   User.findOne({ 'login.email': email }, 'login')
      .lean()
      .exec((err, user) => {
         if (err) return handleError(err)
         if (user) res.end()
         const newUser = {
            login: {
               email
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

         bcrypt.genSalt(10, (error, salt) => {
            bcrypt.hash(password, salt, (err, hash) => {
               if (err) throw err
               newUser.login.password = hash
               const user = new User(newUser)
               user.save(err => {
                  if (err) console.log('error - ', err)
                  res.end()
               })
            })
         })
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
