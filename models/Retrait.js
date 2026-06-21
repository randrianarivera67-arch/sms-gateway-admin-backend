const mongoose = require('mongoose');

const retraitSchema = new mongoose.Schema({
  operator:  { type: String, required: true },
  numero:    { type: String, required: true },
  montant:   { type: Number, required: true },
  status:    { type: String, enum: ['pending','processing','success','failed'], default: 'pending' },
  type:      { type: String, enum: ['retrait','depot'], default: 'retrait' },
  channel:   { type: String, enum: ['gp','tpe','TPE','Grand Public'], default: 'gp' },
  ussdCode:  { type: String },
  sessionId: { type: String, index: true },
  clientId:   { type: String, default: '', index: true },
  provider:   { type: String, default: '' },
  providerId: { type: String, default: '' },
  response:  { type: String },
  createdBy: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Retrait', retraitSchema);
