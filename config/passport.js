const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')
const User = require('../models/User')

module.exports = function (passport) {
    const authenticateUser = async (email, password, done) => {
        const user = await User.findOne({ email: email })
        if (user == null) {
            return done(null, false, { message: 'No user with that email' })
        }

        try {
            if (await bcrypt.compare(password, user.password)) {
                return done(null, user)
            } else {
                return done(null, false, { message: 'Password incorrect' })
            }
        } catch (err) {
            return done(err)
        }
    }

    passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser))
    passport.serializeUser((user, done) => done(null, user.id))
    passport.deserializeUser((id, done) => {
        User.findById(id, (err, user) => done(err, user))
    })
}