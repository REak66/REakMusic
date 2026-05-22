require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const connectDB = require('../config/db');
const User = require('../models/User');
const Artist = require('../models/Artist');
const Album = require('../models/Album');
const Genre = require('../models/Genre');
const Song = require('../models/Song');
const Download = require('../models/Download');

async function seed() {
  await connectDB();

  // 1. Get/Create Users
  const producer = await User.findOne({ email: 'producer1@reakmusic.com' });
  const admin = await User.findOne({ email: 'admin1@reakmusic.com' });

  if (!producer || !admin) {
    console.error('Please run seedAdmin.js and seedProducer.js first!');
    await mongoose.disconnect();
    process.exit(1);
  }

  // Ensure producer and admin have correct permissions
  producer.permissions = ['songs:create', 'songs:update', 'songs:delete', 'analytics:view'];
  await producer.save();
  admin.permissions = ['songs:create', 'songs:update', 'songs:delete', 'analytics:view', 'downloads:all', 'users:manage'];
  await admin.save();

  let customer = await User.findOne({ email: 'customer1@reakmusic.com' });
  if (!customer) {
    const passwordHash = await bcrypt.hash('Customer@1234', 12);
    customer = await User.create({
      fullName: 'Customer One',
      email: 'customer1@reakmusic.com',
      passwordHash,
      phone: '+85500000003',
      role: 'customer',
      isVerified: true,
      permissions: ['downloads:all'],
    });
    console.log('Customer seeded:', customer.email);
  } else {
    customer.permissions = ['downloads:all'];
    await customer.save();
  }

  // 2. Create Artist, Genre, Album
  let artist = await Artist.findOne({ name: 'The Producer Syndicate' });
  if (!artist) {
    artist = await Artist.create({
      name: 'The Producer Syndicate',
      bio: 'Representing independent producers around the globe.',
      country: 'Cambodia',
    });
  }

  // Ensure producer user is linked to the seeded artist
  if (producer && !producer.artistId) {
    producer.artistId = artist._id;
    await producer.save();
    console.log('Linked producer1@reakmusic.com to artist "The Producer Syndicate".');
  }

  let genre = await Genre.findOne({ slug: 'pop' });
  if (!genre) {
    genre = await Genre.create({
      name: 'Pop',
      slug: 'pop',
    });
  }

  let album = await Album.findOne({ title: 'Independent Vibes' });
  if (!album) {
    album = await Album.create({
      title: 'Independent Vibes',
      artistId: artist._id,
      releaseYear: 2026,
      genre: [genre._id],
    });
  }

  // 3. Clean up existing test songs and downloads
  await Download.deleteMany({});
  await Song.deleteMany({ title: { $in: ['Producer Paid Anthem', 'Producer Free Single', 'Platform Mega Hit'] } });

  // 4. Create Songs
  const songPaid = await Song.create({
    title: 'Producer Paid Anthem',
    artistId: artist._id,
    albumId: album._id,
    genre: [genre._id],
    duration: 180,
    downloadCount: 2,
    releaseYear: 2026,
    uploadedBy: producer._id,
  });

  const songFree = await Song.create({
    title: 'Producer Free Single',
    artistId: artist._id,
    albumId: album._id,
    genre: [genre._id],
    duration: 210,
    downloadCount: 1,
    releaseYear: 2026,
    uploadedBy: producer._id,
  });

  const songAdmin = await Song.create({
    title: 'Platform Mega Hit',
    artistId: artist._id,
    albumId: album._id,
    genre: [genre._id],
    duration: 240,
    downloadCount: 5,
    releaseYear: 2026,
    uploadedBy: admin._id,
  });

  console.log('Songs seeded:');
  console.log(` - Paid (Producer): ${songPaid.title} (${songPaid._id})`);
  console.log(` - Free (Producer): ${songFree.title} (${songFree._id})`);
  console.log(` - Admin (Platform): ${songAdmin.title} (${songAdmin._id})`);

  // 5. Create Downloads
  // Customer downloads Paid Song
  await Download.create({
    userId: customer._id,
    songId: songPaid._id,
    ip: '192.168.1.50',
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
  });

  // Admin downloads Paid Song
  await Download.create({
    userId: admin._id,
    songId: songPaid._id,
    ip: '192.168.1.100',
    createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
  });

  // Customer downloads Free Song
  await Download.create({
    userId: customer._id,
    songId: songFree._id,
    ip: '192.168.1.50',
    createdAt: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
  });

  // Customer downloads Admin Song (Producer should not see this download!)
  await Download.create({
    userId: customer._id,
    songId: songAdmin._id,
    ip: '192.168.1.50',
    createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
  });

  console.log('Downloads seeded successfully!');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
