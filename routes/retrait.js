const router     = require('express').Router();
const auth       = require('../middleware/auth');
const apikey     = require('../middleware/apikey');
const Retrait    = require('../models/Retrait');
const UssdConfig = require('../models/UssdConfig');

const DEFAULTS = {
  orange: { retrait:'*111*1*{numero}*{montant}#', depot:'*111*2*{numero}*{montant}#' },
  mvola:  { retrait:'*155*1*{numero}*{montant}#', depot:'*155*2*{numero}*{montant}#' },
  airtel: { retrait:'*123*1*{numero}*{montant}#', depot:'*123*2*{numero}*{montant}#' },
};

function getOpKey(operator) {
  const op = operator.toLowerCase();
  if (op.includes('orange')) return 'orange';
  if (op.includes('yas') || op.includes('telma') || op.includes('mvola')) return 'mvola';
  if (op.includes('airtel')) return 'airtel';
  return null;
}

async function buildUssd(operator, type, numero, montant) {
  const key = getOpKey(operator);
  if (!key) return null;
  let config = await UssdConfig.findOne({ operator: key });
  const template = config ? config[type] : (DEFAULTS[key]?.[type] || null);
  if (!template) return null;
  return template.replace('{numero}', numero).replace('{montant}', montant);
}

router.post('/', auth, async (req, res) => {
  try {
    const { operator, numero, montant, type='retrait' } = req.body;
    if (!operator || !numero || !montant)
      return res.status(400).json({ error: 'operator, numero, montant requis' });
    const ussdCode = await buildUssd(operator, type, numero, montant);
    if (!ussdCode)
      return res.status(400).json({ error: 'Opérateur non supporté' });
    const retrait = new Retrait({
      operator, numero, montant, ussdCode,
      type, status: 'pending', createdBy: req.user.username
    });
    await retrait.save();
    res.json({ id: retrait._id, ussdCode, type, status: 'pending' });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

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

router.get('/', auth, async (req, res) => {
  try {
    const { page=1, limit=50, status, type } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type)   filter.type   = type;
    const total = await Retrait.countDocuments(filter);
    const data  = await Retrait.find(filter)
      .sort({ createdAt: -1 })
      .skip((page-1)*limit)
      .limit(Number(limit));
    res.json({ total, page: Number(page), data });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
