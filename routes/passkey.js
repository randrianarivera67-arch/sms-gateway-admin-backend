const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');
const auth   = require('../middleware/auth');
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');

// === Config (env override possible) ===========================
const RP_NAME = process.env.RP_NAME || 'Gateway Admin Pro';
const RP_IDS  = (process.env.RP_ID || 'sms-gateway-admin-sepia.vercel.app')
  .split(',').map(s => s.trim()).filter(Boolean);
const ORIGINS = (process.env.RP_ORIGIN || 'https://sms-gateway-admin-sepia.vercel.app')
  .split(',').map(s => s.trim()).filter(Boolean);
const rpID = RP_IDS[0];

// === ENREGISTREMENT (admin connecté ajoute un passkey) ========
router.post('/register/options', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID,
      userID: new Uint8Array(Buffer.from(String(user._id))),
      userName: user.username,
      userDisplayName: user.username,
      attestationType: 'none',
      excludeCredentials: (user.passkeys || []).map(p => ({
        id: p.credentialID,
        transports: p.transports && p.transports.length ? p.transports : undefined,
      })),
      authenticatorSelection: { residentKey: 'preferred', userVerification: 'preferred' },
    });
    user.currentChallenge = options.challenge;
    await user.save();
    res.json(options);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/register/verify', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    const response = req.body.response || req.body;
    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: user.currentChallenge,
        expectedOrigin: ORIGINS,
        expectedRPID: RP_IDS,
        requireUserVerification: false,
      });
    } catch (e) { return res.status(400).json({ error: e.message }); }
    const { verified, registrationInfo } = verification;
    if (!verified || !registrationInfo) return res.status(400).json({ error: 'Non verifie' });
    const { credential } = registrationInfo;
    if (!(user.passkeys || []).some(p => p.credentialID === credential.id)) {
      user.passkeys.push({
        credentialID: credential.id,
        publicKey: Buffer.from(credential.publicKey).toString('base64'),
        counter: credential.counter || 0,
        transports: credential.transports || [],
        name: (req.body.name || 'Passkey'),
      });
    }
    user.currentChallenge = '';
    await user.save();
    res.json({ ok: true, verified: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// === CONNEXION (username-first) ===============================
router.post('/login/options', async (req, res) => {
  try {
    const { username } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(user.passkeys || []).length)
      return res.status(404).json({ error: 'Aucun passkey pour cet utilisateur' });
    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: user.passkeys.map(p => ({
        id: p.credentialID,
        transports: p.transports && p.transports.length ? p.transports : undefined,
      })),
      userVerification: 'preferred',
    });
    user.currentChallenge = options.challenge;
    await user.save();
    res.json(options);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/login/verify', async (req, res) => {
  try {
    const { username, response } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    const cred = (user.passkeys || []).find(p => p.credentialID === response.id);
    if (!cred) return res.status(400).json({ error: 'Passkey inconnu' });
    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: user.currentChallenge,
        expectedOrigin: ORIGINS,
        expectedRPID: RP_IDS,
        credential: {
          id: cred.credentialID,
          publicKey: new Uint8Array(Buffer.from(cred.publicKey, 'base64')),
          counter: cred.counter || 0,
          transports: cred.transports && cred.transports.length ? cred.transports : undefined,
        },
        requireUserVerification: false,
      });
    } catch (e) { return res.status(400).json({ error: e.message }); }
    const { verified, authenticationInfo } = verification;
    if (!verified) return res.status(401).json({ error: 'Echec passkey' });
    cred.counter = authenticationInfo.newCounter;
    user.currentChallenge = '';
    await user.save();
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET, { expiresIn: '365d' }
    );
    res.json({ token, user: { username: user.username, role: user.role } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// === GESTION ==================================================
router.get('/list', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json((user && user.passkeys || []).map(p => ({
      id: p.credentialID, name: p.name, createdAt: p.createdAt,
    })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:credentialID', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    const before = user.passkeys.length;
    user.passkeys = user.passkeys.filter(p => p.credentialID !== req.params.credentialID);
    await user.save();
    res.json({ ok: true, removed: before - user.passkeys.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
