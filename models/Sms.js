const mongoose = require('mongoose');

const smsSchema = new mongoose.Schema({
  from:      { type: String, required: true },
  message:   { type: String, required: true },
  sim:       { type: String },
  simSlot:   { type: Number, default: -1 },
  operator:  { type: String },
  status:    { type: String, enum: ['pending','sent','failed'], default: 'pending' },
  deviceId:  { type: String },
  receivedAt:{ type: Date, default: Date.now }
});

module.exports = mongoose.model('Sms', smsSchema);
