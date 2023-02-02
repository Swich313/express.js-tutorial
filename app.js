const path = require('path');
const fs = require('fs');
// const https = require('https');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
// const openssl = require('openssl-nodejs');

// const expressHbs = require('express-handlebars');
const errorController = require('./controllers/error');
const User = require('./models/user');
const db = require('./util/database');
require('dotenv/config');

const app = express();
const store = new MongoDBStore({
   uri: process.env.DB_CONNECTION,
   collection: 'sessions'
});
const csrfProtection = csrf();
// openssl('openssl req -config csr.cnf -x509 -sha256 -nodes -days 365 -newkey rsa:2048 -keyout key.key -out certificate.crt')

// const privateKey = fs.readFileSync('server.key');
// const certificate = fs.readFileSync('server.cert');

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images')
    },
    filename: (req, file, cb) => {
        const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        // cb(null, file.fieldname  + '-' + uniqueSuffix);
        cb(null, uniquePrefix + '-' + file.originalname);

    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'){
        cb(null, true);
    } else {
        cb(null, false);
    }
};

// app.set('view engine', 'pug');       for pug template

// app.engine('handlebars', expressHbs({        for handleBar template
//     layoutsDir: 'views/layout/',
//     defaultLayout: 'main-layout',
//     extname: 'handlebars'
// }))
//app.set('view engine', 'handlebars');

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a'});

app.use(helmet());
app.use(compression());
app.use(morgan('combined', {stream: accessLogStream}) );

const hostname = '127.0.0.1';

app.use(bodyParser.urlencoded({extended: false}));
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
}));
app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
    if (!req.session.user) {
    return next();
    }
    User.findById(req.session.user._id)
        .then(user => {
            if(!user) {
                return next();
            }
            req.user = user;
            next();
        })
        .catch(err => {
            next(new Error(err));
        });
});

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', errorController.get500);
app.get('/522', errorController.get522);
app.use(errorController.get404);
app.use((error, req, res, next) => {
    // console.log(error);
    res.redirect('/500');
});

mongoose.connect(process.env.DB_CONNECTION)
    .then(result => {
        // https.createServer({key: privateKey, cert: certificate}, app)
            app.listen(process.env.PORT || 3000, hostname, () => {
            console.log(`Server is running at http://${hostname}:${process.env.PORT}`)
        });
        // app.listen(3000);
    })
    .catch(err => {
        console.log(err);
    });