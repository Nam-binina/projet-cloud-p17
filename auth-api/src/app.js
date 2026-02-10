const express = require('express');
const router = require("./routes");
const cors = require("cors");
const cookieParser = require('cookie-parser');
const path = require('path');
require("dotenv").config();

const SERVER_PORT = process.env.SERVER_PORT || 3000;
const SERVER_HOST = process.env.SERVER_HOST || '0.0.0.0';

const app = express();

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost', 'http://localhost:80', 'http://localhost:3000', process.env.FRONTEND_URL || '*'], 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true  
}));


app.use(express.json());
app.use(cookieParser());

const uploadsPath = path.resolve(__dirname, '../../web-content/web/public/uploads');
app.use('/uploads', express.static(uploadsPath));


app.use(router);


app.options('*', cors());


app.get('/', (req, res) => {
    res.send('Hello World');
});


app.listen(SERVER_PORT, SERVER_HOST, () => {
    console.log(`Listening on ${SERVER_HOST}:${SERVER_PORT}`);
});

module.exports = app;
