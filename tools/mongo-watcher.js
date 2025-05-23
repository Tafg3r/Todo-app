

const mongoose = require('mongoose');

const uri = 'mongodb://mongo:27017';

setInterval(async () => {
  try {
    await mongoose.connect(uri);
    console.log(`[${new Date().toISOString()}] MongoDB OK`);
    await mongoose.disconnect();
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ❌ MongoDB FAILED:`, err.message);
    // Optional: send alert via webhook
  }
}, 30000); // check every 30s