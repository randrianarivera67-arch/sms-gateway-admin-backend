const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ error: 'Identifiants incorrects' });
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET, { expiresIn: '365d' }
    );
    res.json({ token, user: { username: user.username, role: user.role } });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// Créer admin (une seule fois)
router.post('/setup', async (req, res) => {
  try {
    const count = await User.countDocuments();
    if (count > 0) return res.status(403).json({ error: 'Setup déjà effectué' });
    const user = new User({ ...req.body, role: 'superadmin' });
    await user.save();
    res.json({ message: 'Admin créé' });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// Vérifier token
router.get('/me', require('../middleware/auth'), (req, res) => {
  res.json(req.user);
});

module.exports = router;
