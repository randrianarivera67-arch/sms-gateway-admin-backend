// Script anaovana admin voalohany
// Baiko: node setup.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function setup() {
  await mongoose.connect(process.env.MONGO_URI);
  const count = await User.countDocuments();
  if (count > 0) { console.log('Admin efa misy'); process.exit(0); }
  const user = new User({ username: 'admin', password: 'admin123', role: 'superadmin' });
  await user.save();
  console.log('✅ Admin créé — username: admin / password: admin123');
  process.exit(0);
}
setup().catch(e => { console.error(e); process.exit(1); });
