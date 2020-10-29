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

// API Routes
app.use('/api/invoices/pdf', require('./routes/pdf'))
app.use('/api/invoices', require('./routes/invoices'))
app.use('/api/templates', require('./routes/templates'))
app.use('/api/companyinfo', require('./routes/companyinfo'))

// get customer list
app.get('/api/customers', (req, res) => {
   res.json(req.user.customers)
})

app.use('./api/invoices/:id/pdf', require('./routes/pdf'))

app.use('/login', express.static(`${__dirname}/public/login`))

app.use('/register', express.static(`${__dirname}/public/register`))

app.use('/', ensureAuthenticated, express.static(`${__dirname}/public`))

const PORT = process.env.PORT || 6357

app.listen(PORT, () => console.log(`Server started on port ${PORT}`))
