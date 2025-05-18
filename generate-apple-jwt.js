const jwt = require('jsonwebtoken');
const fs = require('fs');

const TEAM_ID = 'PK64375L5Q';
const CLIENT_ID = 'com.fliday.si';
const KEY_ID = 'Q6LNYBUD2J';
const PRIVATE_KEY_PATH = './AuthKey_Q6LNYBUD2J.p8';

let privateKey;
try {
  privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
  console.log('✅ Successfully read private key');
} catch (error) {
  console.error('❌ Error reading private key:', error.message);
  process.exit(1);
}

const now = Math.floor(Date.now() / 1000);

try {
  const token = jwt.sign(
    {
      iss: TEAM_ID,
      iat: now,
      exp: now + 15777000, // ~6 months
      aud: 'https://appleid.apple.com',
      sub: CLIENT_ID,
    },
    privateKey,
    {
      algorithm: 'ES256',
      header: {
        alg: 'ES256',
        kid: KEY_ID,
      },
    }
  );
  console.log('\n✅ APPLE_SECRET JWT successfully generated:\n');
  console.log(token);
  console.log('\nAdd this to your .env file as APPLE_SECRET=token\n');
} catch (error) {
  console.error('❌ Error generating JWT:', error.message);
  process.exit(1);
}