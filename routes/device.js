const router = require('express').Router();
const apikey = require('../middleware/apikey');
const auth   = require('../middleware/auth');
const Device = require('../models/Device');

// Heartbeat depuis APK
router.post('/heartbeat', apikey, async (req, res) => {
  try {
    const { deviceId, sims, battery, smsReceived, smsSent } = req.body;
    await Device.findOneAndUpdate(
      { deviceId },
      { sims, battery, smsReceived, smsSent, online: true, lastSeen: new Date() },
      { upsert: true, new: true }
    );
    // Vérifier commandes retrait en attente
    const Retrait = require('../models/Retrait');
    const pending = await Retrait.find({ status: 'pending' }).limit(5);
    res.json({ status: 'ok', commands: pending });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// Stats device (admin)
router.get('/stats', auth, async (req, res) => {
  try {
    const devices = await Device.find().sort({ lastSeen: -1 });
    // Mark offline si lastSeen > 2min
    const now = Date.now();
    const result = devices.map(d => ({
      ...d.toObject(),
      online: (now - new Date(d.lastSeen).getTime()) < 120000
    }));
    res.json(result);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
