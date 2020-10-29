const express = require('express')
const router = express.Router()
const fs = require('fs')

// get templates
router.get('/', (req, res) => {
   res.json(req.user.templates)
})

// Add new template line item
router.post('/', (req, res) => {
   fs.readFile('UserData.json', (err, data) => {
      if (err) throw err
      data = JSON.parse(data)
      const oneCompany = data.find(company => company.id.id === req.user.id.id)

      const { title, description, quantity, unitPrice } = req.body
      const newTemplateItem = {
         title,
         description,
         quantity,
         unitPrice
      }
      oneCompany.templates.push(newTemplateItem)

      fs.writeFile('UserData.json', JSON.stringify(data, null, 2), err => {
         if (err) throw err
         res.json(oneCompany.templates)
      })
   })
})

module.exports = router
