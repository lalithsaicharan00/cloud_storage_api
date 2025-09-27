const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const sequelize = require('./database');


const myStore = new SequelizeStore({
    db: sequelize,
});


myStore.sync();


const sessionConfig = {
    secret: process.env.SESSION_SECRET,
    store: myStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 2 * 24 * 60 * 60 * 1000,
        sameSite: 'lax'
    }
};


module.exports = session(sessionConfig);