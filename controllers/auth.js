const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const sendpulse = require('sendpulse-api');
require('dotenv/config');

const User = require('../models/user');

const smtpConfig = {
    host: 'smtp.ukr.net',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_UKR_NET,
        pass: process.env.PASS_UKR_NET_IMAP,
    }
};
const transporter = nodemailer.createTransport(smtpConfig);

const mailOptions = {
    from: process.env.EMAIL_UKR_NET,
    to: 'swichfist@gmail.com',
    subject: 'Letter has been sent via node.js',
    text: 'Have You just sign up?'
};


exports.getLogin = (req, res, next) => {
    // const isLoggedIn = req.get('Cookie').split(';')[1].trim().split('=')[1];
    let message = req.flash('error');
    if(message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage: message,
  });
};

exports.getSignup = (req, res, next) => {
    let message = req.flash('error');
    if(message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/signup', {
        path: '/signup',
        pageTitle: 'Signup',
        errorMessage: message,
    });
};

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    User.findOne({email: email})
        .then(user => {
            if(!user) {
                req.flash('error', 'Invalid email or password!');
                return res.redirect('/login');
            }
            bcrypt.compare(password, user.password)
                .then(doMatch => {
                    if(doMatch) {
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        return req.session.save((err) => {
                            console.log(err);
                            res.redirect('/');
                        })
                    }
                    req.flash('error', 'Invalid email or password!');
                    res.redirect('/login');
                })
                .catch(err => {
                    console.log(err);
                    res.redirect('/login');
                })
        })
        .catch(err => console.log(err));
    // res.setHeader('Set-Cookie', 'loggedIn=true');
};

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    User.findOne({email: email})
        .then(userDoc => {
            if(userDoc) {
                req.flash('error', 'Email already exists!');
                return res.redirect('/signup');
            }
            return bcrypt.hash(password, 12)
                .then(hashedPassword => {
                    const user = new User({
                        email: email,
                        password: hashedPassword,
                        cart: {items: []},
                    })
                    return user.save();
                })
                .then(
                    transporter.sendMail(mailOptions, (err, info) => {
                        if(err){
                            console.log(err);
                        } else {
                            console.log('Email sent: ' + info.response);
                        }
                    })
                )
                .then(result => {
                    res.redirect('/login')
                })
        })
        .catch(err => console.log(err));
};

exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        console.log(err);
       res.redirect('/');
    });
};
