const router  = require('express').Router();
const auth    = require('../middleware/auth');
const apikey  = require('../middleware/apikey');
const Retrait = require('../models/Retrait');

// Construire code USSD
function buildUssd(operator, numero, montant) {
  const op = operator.toLowerCase();
  if (op.includes('orange')) return `*111*1*${numero}*${montant}#`;
  if (op.includes('yas') || op.includes('telma') || op.includes('mvola'))
    return `*155*1*${numero}*${montant}#`;
  if (op.includes('airtel')) return `*123*1*${numero}*${montant}#`;
  return null;
}

// Créer retrait (admin)
router.post('/', auth, async (req, res) => {
  try {
    const { operator, numero, montant } = req.body;
    if (!operator || !numero || !montant)
      return res.status(400).json({ error: 'operator, numero, montant requis' });
    const ussdCode = buildUssd(operator, numero, montant);
    if (!ussdCode)
      return res.status(400).json({ error: 'Opérateur non supporté' });
    const retrait = new Retrait({
      operator, numero, montant, ussdCode,
      status: 'pending', createdBy: req.user.username
    });
    await retrait.save();
    res.json({ id: retrait._id, ussdCode, status: 'pending' });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// APK signale résultat USSD
router.post('/result', apikey, async (req, res) => {
  try {
    const { retraitId, success, response } = req.body;
    await Retrait.findByIdAndUpdate(retraitId, {
      status: success ? 'success' : 'failed',
      response, updatedAt: new Date()
    });
    res.json({ ok: true });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// Liste retraits (admin)
router.get('/', auth, async (req, res) => {
  try {
    const { page=1, limit=50, status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const total   = await Retrait.countDocuments(filter);
    const data    = await Retrait.find(filter)
      .sort({ createdAt: -1 })
      .skip((page-1)*limit)
      .limit(Number(limit));
    res.json({ total, page: Number(page), data });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
