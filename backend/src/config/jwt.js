const jwt = require('jsonwebtoken');

const getPrivateKey = () => Buffer.from(process.env.JWT_PRIVATE_KEY || '', 'base64').toString('utf8');
const getPublicKey = () => Buffer.from(process.env.JWT_PUBLIC_KEY || '', 'base64').toString('utf8');

const signAccessToken = (payload) => {
  return jwt.sign(payload, getPrivateKey(), {
    algorithm: 'RS256',
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1d',
  });
};

const signRefreshToken = (payload) => {
  return jwt.sign(payload, getPrivateKey(), {
    algorithm: 'RS256',
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '1d',
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, getPublicKey(), { algorithms: ['RS256'] });
};

module.exports = { signAccessToken, signRefreshToken, verifyToken };
