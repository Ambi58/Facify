const path = require('path')
const express = require('express')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const morgan = require('morgan')
const exphbs = require('express-handlebars')
const methodOverride = require('method-override')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const connectDB = require('./config/db')
const cors = require('cors')

//Load config
dotenv.config({ path: './config/config.env' })

//Passport Config
require('./config/passport')(passport)

connectDB()

const app = express()
app.use(cors())

// Body parser
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

// Method Override
app.use(methodOverride('_method'))
app.use(
    methodOverride(function (req, res) {
        if (req.body && typeof req.body === 'object' && '_method' in req.body) {
            // look in urlencoded POST bodies and delete it
            let method = req.body._method
            delete req.body._method
            return method
        }
    })
)

//Used for logging while in development
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
}

// Handlebars Helpers
const { formatDate, editIcon } = require('./helpers/hbs')

//Handlebars
app.engine('.hbs', exphbs.engine({
    helpers: {
        formatDate, editIcon
    }, defaultLayout: 'main', extname: '.hbs'
}))
app.set('view engine', '.hbs')

// Sessions
app.use(flash())
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
}))

// Passport middleware
app.use(passport.initialize())
app.use(passport.session())

// Set global var
app.use(function (req, res, next) {
    res.locals.user = req.user || null
    next()
})

//Static folder
app.use(express.static(path.join(__dirname, 'public')))

//Routes
app.use('/', require('./routes/index'))
app.use('/clients', require('./routes/clients'))
app.use('/auth', require('./routes/auth'))
app.use('/demo', require('./routes/demo'))

const PORT = process.env.PORT || 5000

app.listen(PORT)
