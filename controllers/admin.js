const Product = require("../models/product");
const {validationResult} = require('express-validator');
const mongoose = require('mongoose');
const fileHelper = require('../util/file');

exports.getAddProduct = (req, res, next) => {
    // if(!req.session.isLoggedIn){
    //     return res.redirect('/login');
    // }
    res.render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false,
        product: null,
        errorMessage: null,
        oldInput: {
            title: '',
            imageUrl: '',
            price: 0,
            description: '',
        },
        validationErrors: [],
    });
};

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const image = req.file;
    const price = req.body.price;
    const description = req.body.description;
   if(!image) {
       return res.status(422).render('admin/edit-product', {
           pageTitle: 'Add Product',
           path: '/admin/add-product',
           editing: false,
           product: null,
           errorMessage: 'Attached file is not an image!',
           oldInput: {
               title: title,
               price: price,
               description: description,
           },
           validationErrors: [],
       });
   }
    console.log(image);
   const imageUrl = image.path;
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            editing: false,
            product: null,
            errorMessage: errors.array()[0].msg,
            oldInput: {
                title: title,
                price: price,
                description: description,
            },
            validationErrors: errors.array(),
        });
    }

    const product = new Product({
        // _id: new mongoose.mongo.ObjectID('63493c308c3f801eab207bfa'),
        title: title,
        price: price,
        description: description,
        imageUrl: imageUrl,
        userId: req.user
    });
    product.save()
        .then(result => {
            console.log('Created Product');
            res.redirect('/admin/products');
        })
        .catch(err => {
            console.log('An error occurred!');
            // res.redirect('/500');
            const error =  new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    if (!editMode) {
       return res.redirect('/');
    }
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then(product => {
        if (!product) {
            return res.redirect('/');
        }
        res.render('admin/edit-product', {
            pageTitle: 'Edit Product',
            path: '/admin/edit-product',
            editing: editMode,
            product: product,
            errorMessage: '',
            oldInput: {
                title: '',
                price: 0,
                description: '',
            },
            validationErrors: [],
        });
    })
        .catch(err => {
            const error =  new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const image = req.file;
    const updatedDescription = req.body.description;
    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Edit Product',
            path: '/admin/edit-product',
            editing: true,
            product: {
                title: updatedTitle,
                price: updatedPrice,
                description: updatedDescription,
                _id: prodId,
            },
            errorMessage: errors.array()[0].msg,
            oldInput: null,
            validationErrors: errors.array(),
        });
    }
    Product.findById(prodId)
        .then(product => {
            if (product.userId.toString() !== req.user._id.toString()) {
                return res.redirect('/');
            }
            product.title = updatedTitle;
            product.price = updatedPrice;
            product.description = updatedDescription;
            if(image) {
                fileHelper.deleteFile(product.imageUrl);
                product.imageUrl = image.path;
            }
            return product.save()
                .then(result => {
                    console.log('Product updated');
                    res.redirect('/admin/products');
                });
        })
        .catch(err => {
            const error =  new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.deleteProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId).then(product => {
        if(!product) {
            return next(new Error('Product not found!'))
        }
        fileHelper.deleteFile(product.imageUrl);
        return  Product.deleteOne({_id: prodId, userId: req.user._id})
    }).then(() => {
            console.log('Product deleted');
            res.status(200).json({message: 'Success!'});
        })
        .catch(err => {
            res.status(500).json({message: 'Deleting product failed!'});
        });
};

exports.getProducts = (req, res, next) => {
    Product.find({userId: req.user._id})
        // .select('title price -_id')
        // .populate('userId', 'name')
        .then(products => {
            console.log(products);
            res.render('admin/products', {
            prods: products,
            pageTitle: 'Admin Products',
            path: '/admin/products',
        });
    })
        .catch(err => {
            const error =  new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

