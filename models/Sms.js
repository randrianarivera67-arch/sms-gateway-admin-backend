const mongoose = require('mongoose');

const smsSchema = new mongoose.Schema({
  from:      { type: String, required: true },
  message:   { type: String, required: true },
  sim:       { type: String },
  simSlot:   { type: Number, default: -1 },
  operator:  { type: String },
  // pending: tsy mbola noraisina | sent: avy tao amin'ny APK
  // matched: nifanaraka tamin'ny retrait (success) | failed: tsy mitovy template, refusé
  // processing: mitovy template fa miandry validation manuel
  status:    { type: String, enum: ['pending','sent','failed','matched','processing'], default: 'pending' },
  // Retrait izay mifandraika amin'ity SMS ity (raha misy)
  retraitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Retrait' },
  deviceId:  { type: String },
  receivedAt:{ type: Date, default: Date.now }
});

module.exports = mongoose.model('Sms', smsSchema);
