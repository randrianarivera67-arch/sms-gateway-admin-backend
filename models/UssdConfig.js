const mongoose = require('mongoose');

const ussdConfigSchema = new mongoose.Schema({
  operator: { type: String, required: true, unique: true },
  retrait:  { type: String, required: true },
  depot:    { type: String, required: true },
  updatedBy:{ type: String },
  updatedAt:{ type: Date, default: Date.now }
});

module.exports = mongoose.model('UssdConfig', ussdConfigSchema);
