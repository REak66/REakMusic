require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Song = require('../models/Song');
const Download = require('../models/Download');

async function test() {
  await connectDB();

  console.log('----------------------------------------------------');
  console.log('RUNNING BACKEND CONTROLLER LOGIC SIMULATION CHECKS...');
  console.log('----------------------------------------------------');

  const producer = await User.findOne({ email: 'producer1@reakmusic.com' });
  const admin = await User.findOne({ email: 'admin1@reakmusic.com' });

  if (!producer || !admin) {
    console.error('Seed accounts not found! Seed first.');
    await mongoose.disconnect();
    return;
  }

  console.log(`Producer User ID: ${producer._id}`);
  console.log(`Admin User ID: ${admin._id}`);

  // Simulating Producer Dashboard Analytics
  console.log('\n--- SIMULATING PRODUCER ANALYTICS ---');
  const producerSongs = await Song.find({ uploadedBy: producer._id }).select('_id title price');
  console.log(`Songs uploaded by Producer (${producerSongs.length}):`);
  producerSongs.forEach(s => console.log(` - [${s._id}] ${s.title} ($${s.price})`));

  const songIds = producerSongs.map(s => s._id);
  const songPriceMap = {};
  producerSongs.forEach(s => {
    songPriceMap[s._id.toString()] = s.price || 0;
  });

  const downloads = await Download.find({ songId: { $in: songIds } });
  console.log(`\nDownloads of Producer's songs found (${downloads.length}):`);
  
  let totalRevenue = 0;
  downloads.forEach(d => {
    const price = songPriceMap[d.songId.toString()] || 0;
    totalRevenue += price;
    console.log(` - Song ID: ${d.songId}, Price: $${price}, User: ${d.userId}, IP: ${d.ip}`);
  });

  const uniqueUsers = new Set(downloads.map(d => d.userId.toString()));
  console.log(`\nProducer Analytics Summary calculated:`);
  console.log(` - Total Songs     : ${producerSongs.length} (Expected: 2)`);
  console.log(` - Total Downloads : ${downloads.length} (Expected: 3 - 2 for Paid Anthem, 1 for Free Single)`);
  console.log(` - Total Revenue   : $${totalRevenue.toFixed(2)} (Expected: $3.98 - 2 downloads of $1.99)`);
  console.log(` - Unique Users    : ${uniqueUsers.size} (Expected: 2)`);

  // Simulating Admin Dashboard Analytics
  console.log('\n--- SIMULATING ADMIN ANALYTICS ---');
  const allSongsCount = await Song.countDocuments();
  const allDownloadsCount = await Download.countDocuments();
  const allUsersCount = await User.countDocuments();
  console.log(`Admin/Platform Summary calculated:`);
  console.log(` - Total Songs     : ${allSongsCount} (Expected: 3)`);
  console.log(` - Total Downloads : ${allDownloadsCount} (Expected: 4)`);
  console.log(` - Total Users     : ${allUsersCount} (Expected: 3)`);

  // Simulating Download History API
  console.log('\n--- SIMULATING DOWNLOAD HISTORY (PRODUCER VIEW) ---');
  const paginatedDownloads = await Download.find({ songId: { $in: songIds } })
    .populate('userId', 'fullName email')
    .populate('songId', 'title price')
    .sort({ createdAt: -1 });

  console.log(`Downloads returned to Producer (${paginatedDownloads.length} records):`);
  paginatedDownloads.forEach((d, i) => {
    console.log(`[Record ${i+1}]`);
    console.log(`   User      : ${d.userId.fullName} (${d.userId.email})`);
    console.log(`   Song      : ${d.songId.title} (Price: $${d.songId.price})`);
    console.log(`   IP Address: ${d.ip}`);
    console.log(`   Time      : ${d.createdAt.toISOString()}`);
  });

  // Simulating CRUD authorizations
  console.log('\n--- SIMULATING AUTHORIZATION CHECKS ---');
  const ownSong = await Song.findOne({ uploadedBy: producer._id });
  const otherSong = await Song.findOne({ uploadedBy: admin._id });

  console.log(`Can Producer edit their own song "${ownSong.title}"?`);
  const isOwnAllowed = ownSong.uploadedBy.toString() === producer._id.toString();
  console.log(` -> ${isOwnAllowed ? 'ALLOWED' : 'FORBIDDEN'} (Expected: ALLOWED)`);

  console.log(`Can Producer edit platform song "${otherSong.title}"?`);
  const isOtherAllowed = otherSong.uploadedBy && otherSong.uploadedBy.toString() === producer._id.toString();
  console.log(` -> ${isOtherAllowed ? 'ALLOWED' : 'FORBIDDEN'} (Expected: FORBIDDEN)`);

  await mongoose.disconnect();
  console.log('\nAll simulation checks finished!');
}

test().catch(console.error);
