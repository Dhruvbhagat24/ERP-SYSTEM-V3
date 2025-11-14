const bcrypt = require('bcryptjs');

async function generateTestPasswords() {
  const password = 'password123';
  const hash = await bcrypt.hash(password, 10);
  console.log('Hashed password for test users:', hash);
  console.log('Use this password to login:', password);
}

generateTestPasswords();