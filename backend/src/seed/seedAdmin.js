require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const connectDB = require('../config/db');
const User = require('../models/User');

const ADMIN = {
  fullName: 'Admin One',
  email: 'admin1@reakmusic.com',
  password: 'Admin@1234',
  phone: '+85500000001',
  role: 'admin',
  isVerified: true,
};

async function seed() {
  await connectDB();

  const existing = await User.findOne({ email: ADMIN.email });
  if (existing) {
    console.log(`Admin already exists: ${ADMIN.email}`);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(ADMIN.password, 12);

  await User.create({
    fullName: ADMIN.fullName,
    email: ADMIN.email,
    passwordHash,
    phone: ADMIN.phone,
    role: ADMIN.role,
    isVerified: ADMIN.isVerified,
  });

  console.log(`Admin seeded successfully:`);
  console.log(`  Email   : ${ADMIN.email}`);
  console.log(`  Password: ${ADMIN.password}`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
