const router = require('express').Router();
const auth   = require('../middleware/auth');

// State options in memory (persist avec MongoDB si besoin plus tard)
let options = { tpe: true, tpe_ret: true, cash: false, ret_aut: true, ussd: true };

// GET — récupère les options
router.get('/options', auth, (req, res) => {
  res.json(options);
});

// POST — met à jour les options
router.post('/options', auth, (req, res) => {
  const allowed = ['tpe','tpe_ret','cash','ret_aut','ussd'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) options[key] = !!req.body[key];
  }
  res.json({ ok: true, options });
});

module.exports = router;
module.exports.getOptions = () => options;
