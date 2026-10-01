const express = require('express');
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config();
const app = express();
app.use(express.json({limit:'1mb'}));
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,'public')));

function normalizePhone(phone){
  const p=String(phone||'').replace(/\s|-/g,'');
  if(/^07\d{8}$/.test(p)) return '254'+p.slice(1);
  if(/^01\d{8}$/.test(p)) return '254'+p.slice(1);
  if(/^254[17]\d{8}$/.test(p)) return p;
  if(/^\+254[17]\d{8}$/.test(p)) return p.slice(1);
  return null;
}
function timestamp(){const d=new Date(); const f=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}${f(d.getMonth()+1)}${f(d.getDate())}${f(d.getHours())}${f(d.getMinutes())}${f(d.getSeconds())}`;}
async function darajaToken(){
  const key=process.env.DARAJA_CONSUMER_KEY, secret=process.env.DARAJA_CONSUMER_SECRET;
  if(!key||!secret) throw new Error('Daraja credentials are not configured.');
  const base=process.env.DARAJA_ENV==='production'?'https://api.safaricom.co.ke':'https://sandbox.safaricom.co.ke';
  const auth=Buffer.from(`${key}:${secret}`).toString('base64');
  const r=await fetch(`${base}/oauth/v1/generate?grant_type=client_credentials`,{headers:{Authorization:`Basic ${auth}`}});
  if(!r.ok) throw new Error(`Daraja OAuth failed (${r.status}).`);
  return (await r.json()).access_token;
}
app.post('/api/mpesa/stkpush',async(req,res)=>{
  try{
    const {phone,amount,orderId}=req.body; const normalized=normalizePhone(phone); const amt=Math.round(Number(amount));
    if(!normalized||!Number.isFinite(amt)||amt<1) return res.status(400).json({ok:false,message:'Enter a valid Kenyan M-Pesa number and amount.'});
    const shortcode=process.env.DARAJA_SHORTCODE, passkey=process.env.DARAJA_PASSKEY, callback=process.env.DARAJA_CALLBACK_URL;
    if(!shortcode||!passkey||!callback) return res.status(503).json({ok:false,message:'M-Pesa is not configured on this deployment yet.'});
    const base=process.env.DARAJA_ENV==='production'?'https://api.safaricom.co.ke':'https://sandbox.safaricom.co.ke';
    const token=await darajaToken(); const time=timestamp();
    const password=Buffer.from(`${shortcode}${passkey}${time}`).toString('base64');
    const body={BusinessShortCode:shortcode,Password:password,Timestamp:time,TransactionType:'CustomerPayBillOnline',Amount:amt,PartyA:normalized,PartyB:shortcode,PhoneNumber:normalized,CallBackURL:callback,AccountReference:String(orderId||`WCSH-${Date.now()}`).slice(0,12),TransactionDesc:'Wide City Smart Digital Homes'};
    const r=await fetch(`${base}/mpesa/stkpush/v1/processrequest`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body)});
    const data=await r.json();
    if(!r.ok||data.ResponseCode!=='0') return res.status(502).json({ok:false,message:data.errorMessage||data.ResponseDescription||'STK Push request failed.',data});
    res.json({ok:true,message:'STK Push sent. Complete the payment on your phone.',checkoutRequestId:data.CheckoutRequestID,merchantRequestId:data.MerchantRequestID});
  }catch(e){console.error(e);res.status(500).json({ok:false,message:e.message||'Unable to initiate M-Pesa payment.'});}
});
app.post('/api/mpesa/callback',(req,res)=>{console.log('M-Pesa callback:',JSON.stringify(req.body));res.json({ResultCode:0,ResultDesc:'Accepted'});});
app.get('/api/health',(req,res)=>res.json({ok:true,service:'Wide City Smart Digital Homes'}));
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
const port=process.env.PORT||5000;
if(require.main===module) app.listen(port,()=>console.log(`Wide City Smart Digital Homes running on http://localhost:${port}`));
module.exports=app;
