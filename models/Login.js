const mongoose = require('mongoose')

const UserSchema = mongoose.Schema({
   id: String, // remove this later
   email: String,
   password: String
})

module.exports = mongoose.model('User', UserSchema)
