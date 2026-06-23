const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ['superadmin','admin','viewer'], default: 'admin' },
  passkeys: [{
    credentialID: { type: String },
    publicKey:    { type: String },
    counter:      { type: Number, default: 0 },
    transports:   [String],
    name:         { type: String, default: 'Passkey' },
    createdAt:    { type: Date, default: Date.now }
  }],
  currentChallenge: { type: String, default: '' },
  createdAt:{ type: Date, default: Date.now }
});

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function(p) {
  return bcrypt.compare(p, this.password);
};

module.exports = mongoose.model('User', userSchema);
