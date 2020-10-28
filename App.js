const express = require('express')
const fs = require('fs')
const session = require('express-session')
const passport = require('passport')
const flash = require('connect-flash')
const compression = require('compression')
const helmet = require('helmet')
const { ensureAuthenticated } = require('./config/auth')

const app = express()

app.use(helmet())

app.use(express.urlencoded({ extended: false }))
app.use(express.json())

// Passport config
require('./config/passport')(passport)

// Express Session Middleware for auth cookie
app.use(
   session({
      secret: 'special sauce is the best sauce',
      resave: true,
      saveUninitialized: true,
      cookie: { maxAge: 80000000 }
   })
)

// Passport middleware
app.use(passport.initialize())
app.use(passport.session())

// Connect flash Middleware
app.use(flash())

// Compression
app.use(compression())

// Authentification Route
app.use('/users', require('./routes/users'))

// Invoices API Routes
app.use('/api/invoices', require('./routes/invoices'))

// get customer list
app.get('/api/customers', (req, res) => {
   res.json(req.user.customers)
})

// get company info
app.get('/api/companyinfo', (req, res) => {
   res.json(req.user.companyInfo)
})

// POST - edit company info
app.post('/api/companyinfo', (req, res) => {
   fs.readFile('UserData.json', (err, data) => {
      if (err) throw err
      data = JSON.parse(data)

      const oneCompany = data.filter(company => company.id.id === req.user.id.id)[0]
      oneCompany.companyInfo = req.body

      fs.writeFile('UserData.json', JSON.stringify(data, null, 2), err => {
         if (err) throw err
         res.end()
      })
   })
})

// get templates
app.get('/api/templates', (req, res) => {
   res.json(req.user.templates)
})

// Add new template line item
app.post('/api/templates', (req, res) => {
   fs.readFile('UserData.json', (err, data) => {
      if (err) throw err
      data = JSON.parse(data)
      const oneCompany = data.filter(company => company.id.id === req.user.id.id)[0]

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
app.use('./api/invoices/:id/pdf', require('./routes/pdf'))

app.use('/login', express.static(`${__dirname}/public/login`))

app.use('/register', express.static(`${__dirname}/public/register`))

app.use('/', ensureAuthenticated, express.static(`${__dirname}/public`))

const PORT = process.env.PORT || 6357

app.listen(PORT, () => console.log(`Server started on port ${PORT}`))
