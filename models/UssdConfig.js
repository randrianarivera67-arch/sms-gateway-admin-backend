const mongoose = require('mongoose');

const ussdConfigSchema = new mongoose.Schema({
  operator:    { type: String, required: true, unique: true },
  // Grand Public (par défaut)
  gp_depot:    { type: String, default: '' },
  gp_retrait:  { type: String, default: '' },
  // TPE (si toggle ON)
  tpe_depot:   { type: String, default: '' },
  tpe_retrait: { type: String, default: '' },
  numeroUssd:  { type: String, default: '' },   // code USSD haka ny numéro Gateway
  gatewayNumero:{ type: String, default: '' },  // numéro Gateway (mandray vola) — detecté/manuel
  updatedBy:   { type: String },
  updatedAt:   { type: Date, default: Date.now }
});

module.exports = mongoose.model('UssdConfig', ussdConfigSchema);
