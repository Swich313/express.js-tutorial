module.exports = (req, res, next) => {
    if(!req.session.isLoggedIn) {
        console.log('Please log in!');
        return res.redirect('/login');
    }
    next();
}