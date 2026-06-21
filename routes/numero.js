const router     = require('express').Router();
const auth       = require('../middleware/auth');
const apikey     = require('../middleware/apikey');
const UssdConfig = require('../models/UssdConfig');

function getOpKey(op){
  const o=(op||'').toLowerCase();
  if(o.includes('orange'))return 'orange';
  if(o.includes('yas')||o.includes('telma')||o.includes('mvola'))return 'mvola';
  if(o.includes('airtel'))return 'airtel';
  return null;
}
// Maka numéro malgache (03X XX XXX XX) ao amin'ny réponse USSD
function extractNumero(txt){
  const m=(txt||'').replace(/[\s.\-]/g,'').match(/(0(?:32|33|34|37|38)\d{7})/);
  return m?m[1]:null;
}

// POST /api/numero/check-result — APK mandefa ny réponse USSD (apikey)
router.post('/check-result', apikey, async (req,res)=>{
  try{
    const { operator, ussdResponse } = req.body;
    if(!operator||!ussdResponse) return res.status(400).json({error:'operator et ussdResponse requis'});
    const opKey=getOpKey(operator); if(!opKey) return res.status(400).json({error:'Opérateur non reconnu'});
    const numero=extractNumero(ussdResponse);
    if(!numero) return res.status(400).json({error:"Numéro introuvable",raw:ussdResponse});
    await UssdConfig.findOneAndUpdate({operator:opKey},{gatewayNumero:numero,updatedAt:new Date()},{upsert:true});
    res.json({ok:true,operator:opKey,gatewayNumero:numero});
  }catch(e){res.status(500).json({error:e.message});}
});

// POST /api/numero/set — APK mandefa numéro mivantana (apikey)
router.post('/set', apikey, async (req,res)=>{
  try{
    const { operator, numero } = req.body;
    const opKey=getOpKey(operator); if(!opKey) return res.status(400).json({error:'Opérateur non reconnu'});
    const clean=(numero||'').replace(/[\s.\-]/g,'');
    if(!/^0(?:32|33|34|37|38)\d{7}$/.test(clean)) return res.status(400).json({error:'Numéro invalide',numero:clean});
    await UssdConfig.findOneAndUpdate({operator:opKey},{gatewayNumero:clean,updatedAt:new Date()},{upsert:true});
    res.json({ok:true,operator:opKey,gatewayNumero:clean});
  }catch(e){res.status(500).json({error:e.message});}
});

// POST /api/numero — admin manondro manuel { operator, numero, numeroUssd? } (auth)
router.post('/', auth, async (req,res)=>{
  try{
    const { operator, numero, numeroUssd } = req.body;
    const opKey=getOpKey(operator); if(!opKey) return res.status(400).json({error:'Opérateur invalide'});
    const upd={updatedAt:new Date()};
    if(numero!==undefined) upd.gatewayNumero=(numero||'').replace(/[\s.\-]/g,'');
    if(numeroUssd!==undefined) upd.numeroUssd=numeroUssd;
    const c=await UssdConfig.findOneAndUpdate({operator:opKey},upd,{upsert:true,new:true});
    res.json({ok:true,operator:opKey,gatewayNumero:c.gatewayNumero,numeroUssd:c.numeroUssd});
  }catch(e){res.status(500).json({error:e.message});}
});

// GET /api/numero — liste (auth)
router.get('/', auth, async (req,res)=>{
  try{
    const list=await UssdConfig.find({},{operator:1,gatewayNumero:1,numeroUssd:1,_id:0});
    res.json({data:list});
  }catch(e){res.status(500).json({error:e.message});}
});

module.exports = router;
