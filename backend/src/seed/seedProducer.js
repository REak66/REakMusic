require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const connectDB = require('../config/db');
const User = require('../models/User');

const PRODUCER = {
  fullName: 'Producer One',
  email: 'producer1@reakmusic.com',
  password: 'Producer@1234',
  phone: '+85500000002',
  role: 'producer',
  isVerified: true,
};

async function seed() {
  await connectDB();

  const existing = await User.findOne({ email: PRODUCER.email });
  if (existing) {
    console.log(`Producer already exists: ${PRODUCER.email}`);
    await mongoose.disconnect();
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(PRODUCER.password, 12);

  await User.create({
    fullName: PRODUCER.fullName,
    email: PRODUCER.email,
    passwordHash,
    phone: PRODUCER.phone,
    role: PRODUCER.role,
    isVerified: PRODUCER.isVerified,
    permissions: ['songs:create', 'songs:update', 'songs:delete', 'analytics:view'],
  });

  console.log(`Producer seeded successfully:`);
  console.log(`  Email   : ${PRODUCER.email}`);
  console.log(`  Password: ${PRODUCER.password}`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
