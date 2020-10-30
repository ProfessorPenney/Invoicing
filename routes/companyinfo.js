const express = require('express')
const router = express.Router()
const fs = require('fs')

// get company info
router.get('/', (req, res) => {
   res.json(req.user.companyInfo)
})

// POST - edit company info
router.post('/', (req, res) => {
   fs.readFile('UserData.json', (err, data) => {
      if (err) throw err
      data = JSON.parse(data)

      const oneCompany = data.find(company => company.id.id === req.user.id.id)
      oneCompany.companyInfo = req.body

      fs.writeFile('UserData.json', JSON.stringify(data, null, 2), err => {
         if (err) throw err
         res.end()
      })
   })
})

module.exports = router
