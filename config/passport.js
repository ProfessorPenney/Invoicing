const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')
const User = require('../models/UserData')

module.exports = function (passport) {
   passport.use(
      new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
         // Match User
         User.findOne({ 'login.email': email }, 'login')
            // .lean()
            .exec((err, user) => {
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
      })
   )

   passport.serializeUser((user, done) => {
      done(null, user._id)
   })

   passport.deserializeUser((id, done) => {
      User.findById(id, (err, user) => done(err, user))
   })
}
