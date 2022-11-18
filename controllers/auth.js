const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const crypto = require('crypto');
require('dotenv/config');


const User = require('../models/user');
const Product = require("../models/product");

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

//using sendgrid
// const transporter = nodemailer.createTransport(sendgridTransport({
//     auth: {
//         api_user: ,
//         api_key: ,
//     }
// }));

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
                .then(result => {
                    const mailOptions = {
                        from: process.env.EMAIL_UKR_NET,
                        to: email,
                        subject: 'Signup succeeded!',
                        text: 'Have You just sign up?',
                        html: '<h1>You successfully signed up!</h1>'
                    };
                    res.redirect('/login')
                    return transporter.sendMail(mailOptions, (err, info) => {
                        if(err){
                            console.log(err);
                        } else {
                            console.log('Email sent: ' + info.response);
                        }
                    });
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

exports.getResetPassword = (req, res, next) => {
    let message = req.flash('error');
    if(message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/password-reset', {
        path: '/reset',
        pageTitle: 'Reset Password',
        errorMessage: message,
    });
};

exports.postResetPassword = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
       if (err) {
           console.log(err);
           return res.redirect('/reset');
       }
       const token = buffer.toString('hex');
        User.findOne({email: req.body.email})
            .then(user => {
                if(!user) {
                    req.flash('error', 'No account with that email found!');
                    return res.redirect('/reset');
                }
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000;
                return user.save();
            })
            .then(result => {
                const mailOptions = {
                    from: process.env.EMAIL_UKR_NET,
                    to: req.body.email,
                    subject: 'Password reset',
                    html: `
                    <p>You requested a password reset</p>
                    <p>Click this <a href="http://localhost:3000/reset/${token}">link</a>  to set a new password.</p>
                    `
                };
                res.redirect('/reset');
                return transporter.sendMail(mailOptions, (err, info) => {
                    if(err){
                        console.log(err);
                    } else {
                        console.log('Email sent: ' + info.response);
                    }
                });
            })
            .catch(err => console.log(err));

    });
};

exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now()}})         //resetTokenExpiration: {$gt: Date.now()} stands for resetTokenExpiration is greater than Date.now()
        .then(user => {
            let message = req.flash('error');
            if(message.length > 0){
                message = message[0];
            } else {
                message = null;
            }
            res.render('auth/new-password', {
                path: '/new-password',
                pageTitle: 'Update your password',
                errorMessage: message,
                userId: user._id.toString(),
                passwordToken: token,
            });
        })
        .catch(err => console.log(err));
};

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    let resetUser;
    User.findOne({
        resetToken: passwordToken,
        resetTokenExpiration: {$gt: Date.now()},
        _id: userId
    })
        .then(user => {
            resetUser = user;
            return bcrypt.hash(newPassword, 12);
        })
        .then(hashedPassword => {
                resetUser.password = hashedPassword;
                resetUser.resetToken = undefined;
                resetUser.resetTokenExpiration = undefined;
                return resetUser.save();
        })
        .then(result => {
            res.redirect('/login');
            console.log('Password updated')
        })
        .catch(err => console.log(err));
};
