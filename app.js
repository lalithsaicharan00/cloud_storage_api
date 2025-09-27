require('dotenv').config();
const routes = require('./routes/index');
const express = require('express');


const app = express();


app.use('/api/v1', routes);

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});



