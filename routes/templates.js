const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')

const User = require('../models/UserData')

// get templates
router.get('/', (req, res) => {
   User.findById(req.user._id, 'templates')
      .lean()
      .exec((err, user) => {
         if (err) return handleError(err)
         res.json(user.templates)
      })
})

// Add new template line item
router.post('/', (req, res) => {
   const { title, description, quantity, unitPrice } = req.body
   const newTemplateItem = {
      title,
      description,
      quantity,
      unitPrice
   }
   User.findOneAndUpdate(
      { _id: req.user._id },
      { $push: { templates: newTemplateItem } },
      { fields: 'templates', new: true }
   )
      .lean()
      .exec((err, user) => {
         if (err) return handleError(err)
         res.json(user.templates)
      })
})

function handleError(err) {
   console.log('error handler says ', err)
}

module.exports = router
