const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const session = require('express-session');
const morgan = require('morgan');
const { globalLimiter } = require('./middleware/rateLimiter.middleware');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler.middleware');

const app = express();

app.use(helmet());

// Allow browser Audio element to load cross-origin audio (overrides helmet's same-origin CORP)
app.use('/api/v1/songs/:id/stream', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length', 'Content-Type'],
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'reakmusic-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,
  },
}));
app.use(mongoSanitize());
app.use(morgan('combined'));
app.use(globalLimiter);

app.use('/api/v1', routes);
app.use(errorHandler);

module.exports = app;
