/**
 * Dependency and connection verification script
 * Run this script to check if all required dependencies are installed
 * and if the MongoDB connection is working.
 */

console.log('Starting dependency and connection verification...');

// Check if required modules are installed
const requiredModules = [
  'express',
  'cors',
  'mongoose',
  'morgan',
  'jsonwebtoken',
  'bcrypt',
  'stripe',
  'dotenv'
];

const missingModules = [];

console.log('\nChecking for required Node.js modules:');
requiredModules.forEach(module => {
  try {
    require.resolve(module);
    console.log(`✅ ${module} is installed`);
  } catch (error) {
    console.error(`❌ ${module} is missing`);
    missingModules.push(module);
  }
});

if (missingModules.length > 0) {
  console.error('\n⚠️ Missing modules detected. Install them with:');
  console.error(`npm install ${missingModules.join(' ')}`);
} else {
  console.log('\n✅ All required modules are installed.');
}

// Load environment variables
require('dotenv').config();

// Check environment variables
console.log('\nChecking environment variables:');
const requiredEnvVars = [
  { name: 'MONGODB_URI', value: process.env.MONGODB_URI || 'Not set' },
  { name: 'JWT_SECRET', value: process.env.JWT_SECRET ? '******' : 'Not set' },
  { name: 'PORT', value: process.env.PORT || 'Not set' }
];

requiredEnvVars.forEach(envVar => {
  if (envVar.value === 'Not set') {
    console.error(`❌ ${envVar.name} is not set`);
  } else {
    console.log(`✅ ${envVar.name} is set to: ${envVar.value}`);
  }
});

// Test MongoDB connection
console.log('\nTesting MongoDB connection...');

const mongoose = require('mongoose');
const mongoDB = process.env.MONGODB_URI || 'mongodb://localhost:27017/unifi-guest-portal';

mongoose.connect(mongoDB, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB connection successful!');
  console.log(`Connected to: ${mongoDB}`);
  
  // List all collections
  return mongoose.connection.db.listCollections().toArray();
})
.then(collections => {
  console.log('\nExisting collections:');
  if (collections.length === 0) {
    console.log('No collections found (empty database)');
  } else {
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
  }
  
  // Close the connection
  return mongoose.connection.close();
})
.then(() => {
  console.log('\nVerification complete! 🎉');
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  console.log('\nTroubleshooting tips:');
  console.log('1. Make sure MongoDB is running');
  console.log('2. Check the MONGODB_URI environment variable');
  console.log('3. Verify network connectivity to the MongoDB server');
  console.log('4. Check if authentication credentials are correct (if used)');
  console.log('\nVerification failed ❌');
});
