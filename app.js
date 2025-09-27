require('dotenv').config();
const routes = require('./routes/index');
const sessionMiddleware = require('./config/session');
const express = require('express');


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(sessionMiddleware);

app.use('/api/v1', routes);

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});



