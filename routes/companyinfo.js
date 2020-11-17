const express = require('express')
const router = express.Router()
const fs = require('fs')
const mongoose = require('mongoose')

const User = require('../models/UserData')

// get company info
router.get('/', (req, res) => {
   User.findById(req.user._id, 'companyInfo').exec((err, user) => {
      if (err) return handleError(err)
      res.json(user.companyInfo)
   })
})

// POST - edit company info
router.post('/', (req, res) => {
   const companyInfo = req.body

   User.updateOne({ _id: req.user._id }, { $set: { companyInfo: companyInfo } }).exec(err => {
      if (err) return handleError(err)
      res.end()
   })
})

function handleError(err) {
   console.log('error handler says ', err)
}

module.exports = router
