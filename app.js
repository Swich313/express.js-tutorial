const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const expressHbs = require('express-handlebars');
const errorController = require('./controllers/error');
const User = require('./models/user');
const db = require('./util/database');
require('dotenv/config');

const app = express();

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

const PORT = 3000;

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    User.findById('635b79ca1ac27311cd0534bb')
        .then(user => {
            req.user = user;
            next();
        })
        .catch(err => console.log(err));
})

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.notFoundPage);

mongoose.connect(process.env.DB_CONNECTION)
    .then(result => {
        User.findOne().then(user => {
                if(!user){
                    const user = new User({
                        name: 'Andruha',
                        email: '123@gmail.com',
                        cart: {
                            items: []
                        }
                    });
                    user.save();
                }
            });
        app.listen(3000);
    })
    .catch(err => console.log(err));


// app.listen(PORT, () => {
//     console.log(`Server is running on the port ${PORT}...`);
// });
