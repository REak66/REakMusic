require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

async function check() {
  await connectDB();
  const user = await User.findOne({ email: 'admin1@reakmusic.com' });
  console.log('User found:', !!user);
  if (!user) { await mongoose.disconnect(); return; }
  console.log('isVerified:', user.isVerified);
  console.log('role:', user.role);
  console.log('lockedUntil:', user.lockedUntil);
  const valid = await bcrypt.compare('Admin@1234', user.passwordHash);
  console.log('Password valid:', valid);
  await mongoose.disconnect();
}
check().catch(console.error);
