const { builder } = require('@netlify/functions');

let codesMap = null;
try { codesMap = require('../api/codes.json'); } catch (e) { codesMap = null; }

async function handler(event){
  if (event.httpMethod !== 'POST'){
    return { statusCode: 405, body: JSON.stringify({ success:false, message:'Method not allowed' }) };
  }
  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { body = {}; }
  const code = (body.code || '').trim();
  if (!code){
    return { statusCode: 400, body: JSON.stringify({ success:false, message:'No code provided' }) };
  }
  if (!codesMap){
    return { statusCode: 500, body: JSON.stringify({ success:false, message:'Codes mapping not loaded' }) };
  }
  const entry = codesMap[code];
  if (!entry){
    return { statusCode: 200, body: JSON.stringify({ success:false, message:'Invalid product code' }) };
  }
  const product = {
    code,
    imageUrl: entry.imageUrl || `/images/guilloche_${code}.png`,
    name: entry.name || 'GAT Sport Product',
    description: entry.description || 'Authentic GAT Sport supplement'
  };
  return { statusCode: 200, body: JSON.stringify({ success:true, product }) };
}

exports.handler = handler; 