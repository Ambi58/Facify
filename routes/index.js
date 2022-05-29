const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const passport = require('passport')
const { ensureAuth, ensureGuest } = require('../middleware/auth')

const User = require('../models/User')
const Client = require('../models/Client')

//@desc     Login/Landing Page
//@route    GET /login
router.get('/login', ensureGuest, (req, res) => {
    res.render('login', {
        layout: 'auth'
    })
})

//@desc     Login/Landing Page
//@route    POST /login
router.post('/login', ensureGuest, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))

//@desc     Register/New User Page
//@route    GET /register
router.get('/register', ensureGuest, (req, res) => {
    res.render('register', {
        layout: 'auth'
    })
})

//@desc     Register/New User Page
//@route    POST /register
router.post('/register', ensureGuest, async (req, res) => {
    console.log(req.body)
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    const newUser = {
        firstName: req.body.first_name,
        lastName: req.body.last_name,
        email: req.body.email,
        password: hashedPassword,
        applicationName: req.body.application_name
    }
    try {
        let user = await User.create(newUser)
        res.redirect('/login')
    } catch (err) {
        console.error(err)
        res.redirect('/register')
    }
})

// @desc    Logout user
// @route   /logout
router.get('/logout', (req, res) => {
    req.logout()
    res.redirect('/login')
})

// @desc     Dashboard
// @route    GET /dashboard
router.get('/dashboard', ensureAuth, async (req, res) => {
    try {
        console.log(req.auth_message)
        const clients = await Client.find({ user: req.user.id }).lean()
        res.render('dashboard', {
            name: req.user.firstName,
            password: req.user.password,
            clients
        })
    } catch (err) {
        console.error(err)
        res.render('error/500')
    }
})

//@desc     Dashboard
//@route    GET /
router.get('/', ensureAuth, async (req, res) => {
    res.redirect('/dashboard')
})

module.exports = router