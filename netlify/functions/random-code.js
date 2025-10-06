let codesMap = null;
try { codesMap = require('../api/codes.json'); } catch (e) { codesMap = null; }

exports.handler = async function(event){
  if (event.httpMethod !== 'GET'){
    return { statusCode: 405, body: JSON.stringify({ success:false, message:'Method not allowed' }) };
  }
  if (!codesMap || typeof codesMap !== 'object'){
    return { statusCode: 500, body: JSON.stringify({ success:false, message:'Codes mapping not loaded' }) };
  }
  const pool = Object.keys(codesMap);
  if (!pool.length){
    return { statusCode: 500, body: JSON.stringify({ success:false, message:'No product codes available' }) };
  }
  const randomIndex = Math.floor(Math.random() * pool.length);
  const randomCode = pool[randomIndex];
  const baseUrl = process.env.URL || '';
  const url = baseUrl ? `${baseUrl}/.netlify/functions/qr?c=${randomCode}` : `/api/qr?c=${randomCode}`;
  return { statusCode: 200, body: JSON.stringify({ code: randomCode, url }) };
} 