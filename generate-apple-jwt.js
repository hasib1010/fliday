// generate-apple-jwt.js
const jwt = require('jsonwebtoken');
const fs = require('fs');

// Replace these values with your actual Apple Developer credentials
const TEAM_ID = 'PK64375L5Q'; // Your Apple Developer Team ID
const CLIENT_ID = 'com.fliday.si'; // Your complete Services ID 
const KEY_ID = 'Q6LNYBUD2J'; // This is what you've entered as APPLE_SECRET, but it's actually the Key ID
const PRIVATE_KEY_PATH = './AuthKey_Q6LNYBUD2J.p8'; // Path to your private key file

// Read the private key
let privateKey;
try {
  privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
  console.log('✅ Successfully read private key');
} catch (error) {
  console.error('❌ Error reading private key:', error.message);
  process.exit(1);
}

// Current timestamp in seconds
const now = Math.floor(Date.now() / 1000);

// Create the JWT
try {
  const token = jwt.sign({
    iss: TEAM_ID,
    iat: now,
    exp: now + 15777000, // ~6 months (maximum allowed)
    aud: 'https://appleid.apple.com',
    sub: CLIENT_ID,
  }, privateKey, {
    algorithm: 'ES256',
    header: {
      alg: 'ES256',
      kid: KEY_ID
    }
  });
  
  console.log('\n✅ APPLE_SECRET JWT successfully generated:\n');
  console.log(token);
  console.log('\nAdd this to your .env file as APPLE_SECRET=token\n');
} catch (error) {
  console.error('❌ Error generating JWT:', error.message);
  if (error.message.includes('ECDSA')) {
    console.log('\nThe private key might be in the wrong format or corrupted.');
  }
}