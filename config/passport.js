const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcryptjs')
const fs = require('fs')
const mongoose = require('mongoose')
const User = require('../models/UserData')

module.exports = function (passport) {
   passport.use(
      new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
         // Match User
         User.findOne({ id: { email: email } }).then(user => {
            console.log(user)
            if (!user) {
               return done(null, false, { message: 'That email is not registered' })
            }
            // Match password
            bcrypt.compare(password, user.id.password, (err, isMatch) => {
               if (err) throw err
               if (isMatch) {
                  return done(null, user.id)
               } else {
                  return done(null, false, { message: 'Password incorrect' })
               }
            })
         })
         // fs.readFile('UserData.json', (err, data) => {
         //    if (err) throw err
         //    data = JSON.parse(data)

         //    const user = data.find(company => company.id.email === email)

         //    if (!user) {
         //       return done(null, false, { message: 'That email is not registered' })
         //    }
         //    // Match password
         //    bcrypt.compare(password, user.id.password, (err, isMatch) => {
         //       if (err) throw err
         //       if (isMatch) {
         //          return done(null, user.id)
         //       } else {
         //          return done(null, false, { message: 'Password incorrect' })
         //       }
         //    })
         // })
      })
   )

   passport.serializeUser((user, done) => {
      done(null, user.id)
   })

   passport.deserializeUser((id, done) => {
      fs.readFile('UserData.json', (err, data) => {
         if (err) throw err
         data = JSON.parse(data)

         const user = data.find(company => company.id.id === id)

         done(err, user)
      })
   })
}
