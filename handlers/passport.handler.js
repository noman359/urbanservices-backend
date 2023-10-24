import { JWT_SECURE_KEY } from '../config/index'

const passport = require("passport")
const localStrategy = require('passport-local').Strategy

passport.use('login', new localStrategy({
    usernameField: 'email',
    passwordField: 'password'

}, (email, password, done) => {


}))