const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const expressHbs = require('express-handlebars');
const errorController = require('./controllers/error');

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
const PORT = 3000;

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use(errorController.notFoundPage);

app.listen(PORT, () => {
    console.log(`Server is running on the port ${PORT}...`);
});
