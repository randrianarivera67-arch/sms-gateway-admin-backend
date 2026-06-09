const router     = require('express').Router();
const auth       = require('../middleware/auth');
const UssdConfig = require('../models/UssdConfig');

// Defaults raha tsy misy config
const DEFAULTS = [
  { operator:'orange', retrait:'*111*1*{numero}*{montant}#', depot:'*111*2*{numero}*{montant}#' },
  { operator:'mvola',  retrait:'*155*1*{numero}*{montant}#', depot:'*155*2*{numero}*{montant}#' },
  { operator:'airtel', retrait:'*123*1*{numero}*{montant}#', depot:'*123*2*{numero}*{montant}#' },
];

// GET — récupère tous les codes
router.get('/', auth, async (req, res) => {
  try {
    let configs = await UssdConfig.find();
    // Si vide, retourner les defaults
    if (!configs.length) {
      return res.json(DEFAULTS);
    }
    res.json(configs);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// POST — sauvegarde/met à jour un code
router.post('/', auth, async (req, res) => {
  try {
    const { operator, retrait, depot } = req.body;
    if (!operator || !retrait || !depot)
      return res.status(400).json({ error: 'operator, retrait, depot requis' });
    const config = await UssdConfig.findOneAndUpdate(
      { operator },
      { retrait, depot, updatedBy: req.user.username, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ ok: true, config });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// Reset defaults
router.delete('/reset', auth, async (req, res) => {
  try {
    await UssdConfig.deleteMany({});
    res.json({ ok: true, message: 'Codes réinitialisés aux valeurs par défaut' });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
