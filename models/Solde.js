const mongoose = require('mongoose');

const soldeSchema = new mongoose.Schema({
  operator:        { type: String, required: true, unique: true },
  montant:         { type: Number, default: 0 },     // solde tena izy (base + incréments) — ampiasaina ho VALIDATION foana
  montantOff:      { type: Number, default: 0 },     // solde calculé manomboka amin'ny 0 — ampiasaina ho DISPLAY raha toggle OFF
  baseAmount:      { type: Number, default: 0 },     // solde réel via USSD check farany
  baseTimestamp:   { type: Date,   default: null },  // date du dernier check USSD
  baseRawResponse: { type: String, default: '' },    // texte brut réponse USSD
  updatedAt:       { type: Date, default: Date.now }
});

module.exports = mongoose.model('Solde', soldeSchema);
