const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcryptjs')
const fs = require('fs')
const mongoose = require('mongoose')
const Users = require('../models/UserData')

module.exports = function (passport) {
   passport.use(
      new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
         // Match User
         Users.findOne({ 'login.email': email }, (err, user) => {
            // console.log('login user', user)
            if (err) console.log(err)
            if (!user) {
               return done(null, false, { message: 'That email is not registered' })
            }
            // Match password
            bcrypt.compare(password, user.login.password, (err, isMatch) => {
               if (err) throw err
               if (isMatch) {
                  return done(null, user._id)
               } else {
                  return done(null, false, { message: 'Password incorrect' })
               }
            })
         })
         // .catch(err => console.log(err))

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
      done(null, user._id)
   })

   passport.deserializeUser((id, done) => {
      Users.findById(id, (err, user) => done(err, user))
      // fs.readFile('UserData.json', (err, data) => {
      //    if (err) throw err
      //    data = JSON.parse(data)

      //    const user = data.find(company => company.id.id === id)

      //    done(err, user)
      // })
   })
}
