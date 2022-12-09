const express = require('express');
const { check, body } = require('express-validator');
const authController = require('../controllers/auth');
const User = require('../models/user');
const {isEmail} = require("validator");

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login',
    [
        body('email')
            .isEmail()
            .withMessage('Please enter a valid Email!')
            .normalizeEmail(),
        body('password', 'Please enter a validPlease enter a valid password!')
            .isLength({min: 6})
            .isAlphanumeric()
            .trim()
    ],
    authController.postLogin);

router.post('/signup',
    [
    check('email')
    .isEmail()
    .withMessage('Please enter a valid Email!')
        .custom((value, {req}) => {
            // if (value === 'test@test.com'){
            //     throw new Error('forbidden email address')
            // }
            // return true
            return User.findOne({email: value}).then(userDoc => {
                    if (userDoc) {
                        return Promise.reject('Email already exists!');
                    }
            });
        })
        .normalizeEmail(),
    body('password', 'Please enter a password with only numbers and letters and at least 6 characters.')
        .isLength({min: 6})
        .isAlphanumeric()
        .trim(),
    body('confirmPassword').trim()
        .custom((value, {req}) => {
        if (value !== req.body.password){
            throw new Error('Passwords have to match!')
        }
        return true
    })
    ],
    authController.postSignup);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getResetPassword);

router.post('/reset',
    check('email')
        .isEmail()
        .withMessage('Please enter a valid Email!'),
    authController.postResetPassword);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password',
    body('password', 'Please enter a password with only numbers and letters and at least 6 characters.')
        .isLength({min: 6})
        .isAlphanumeric(),
    authController.postNewPassword);

module.exports = router;