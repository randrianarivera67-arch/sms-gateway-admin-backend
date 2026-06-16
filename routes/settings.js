const router   = require('express').Router();
const auth     = require('../middleware/auth');
const Settings = require('../models/Settings');

// FIX: tpe_depot sy tpe_ret = false par défaut (Grand Public)
const DEFAULTS = { tpe_depot: false, tpe_ret: false, cash: false, ret_aut: true, ussd: true };
const ALLOWED  = ['tpe_depot','tpe_ret','cash','ret_aut','ussd'];

let options = { ...DEFAULTS };

async function loadOptions() {
  try {
    const docs = await Settings.find({ key: { $in: ALLOWED } });
    docs.forEach(d => { options[d.key] = d.value; });
  } catch(e) { console.error('loadOptions:', e.message); }
}
loadOptions();

router.get('/options', auth, (req, res) => {
  res.json(options);
});

router.post('/options', auth, async (req, res) => {
  try {
    for (const key of ALLOWED) {
      if (req.body[key] !== undefined) {
        options[key] = !!req.body[key];
        await Settings.findOneAndUpdate(
          { key },
          { value: options[key] },
          { upsert: true }
        );
      }
    }
    res.json({ ok: true, options });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
module.exports.getOptions = () => options;
