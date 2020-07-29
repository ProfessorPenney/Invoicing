const express = require('express')
const router = express.Router()
const fs = require('fs')
const bcrypt = require('bcryptjs')
const passport = require('passport')

// Validation passed
router.post('/register', (req, res) => {
   fs.readFile('UserData.json', (err, data) => {
      if (err) throw err
      data = JSON.parse(data)

      const { name, email, password } = req.body

      let companyData = data.find(company => company.id.email === email)

      if (companyData) {
         res.json({
            error: 'Email is already registered'
         })
      } else {
         let newUser = {
            id: {
               id: data.length + 1,
               email,
               password
            },
            companyInfo: {
               name,
               email
            }
         }

         // Hash Password
         bcrypt.genSalt(10, (error, salt) => {
            bcrypt.hash(password, salt, (err, hash) => {
               if (err) throw err
               newUser.id.password = hash
               data.push(newUser)
               fs.writeFile('UserData.json', JSON.stringify(data, null, 2), err => {
                  if (err) throw err
                  res.json({ success: true })
               })
            })
         })
      }
   })
})

// Login Handle
router.post(
   '/login',
   passport.authenticate('local', {
      successRedirect: '/',
      failureRedirect: '/login',
      failureFlash: true
   })
)

// Logout Handle
router.get('/logout', (req, res) => {
   req.logout()
   req.flash('success_msg', 'You are logged out')
   res.redirect('/users/login')
})

module.exports = router
