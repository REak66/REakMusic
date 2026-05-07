const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const { globalLimiter } = require('./middleware/rateLimiter.middleware');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler.middleware');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(mongoSanitize());
app.use(morgan('combined'));
app.use(globalLimiter);

app.use('/api/v1', routes);
app.use(errorHandler);

module.exports = app;
