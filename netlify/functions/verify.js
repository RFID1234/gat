// netlify/functions/verify.js
// Netlify function: validates code against codes.json, increments Upstash counter (INCR)
// Returns JSON: { success: true, product, count }  (count may be null if Upstash not configured)

let codesMap = null;
try {
  // Try a few relative paths so it works regardless of where codes.json is in repo
  try { codesMap = require('../../codes.json'); } catch (e1) {}
  if (!codesMap) {
    try { codesMap = require('../codes.json'); } catch (e2) {}
  }
  if (!codesMap) {
    try { codesMap = require('./codes.json'); } catch (e3) {}
  }
} catch (e) {
  codesMap = null;
}

exports.handler = async function (event, context) {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'Method not allowed' }) };
    }

    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch (e) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'Invalid JSON body' }) };
    }

    const code = (body.code || '').toString().trim();
    if (!code) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'No code provided' }) };
    }

    if (!codesMap) {
      // We keep behavior close to your original: require codes.json to exist
      return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'Codes mapping not loaded' }) };
    }

    const entry = codesMap[code];
    if (!entry) {
      // Keep your previous behavior: invalid code returns success:false, not incrementing Upstash
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'Invalid product code' }) };
    }

    const product = {
      code,
      imageUrl: entry.imageUrl || `/images/guilloche_${code}.png`,
      name: entry.name || 'GAT Sport Product',
      description: entry.description || 'Authentic GAT Sport supplement'
    };

    // Only increment Upstash for valid codes
    let count = null;
    const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
    const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (UPSTASH_URL && UPSTASH_TOKEN) {
      try {
        const redisKey = encodeURIComponent(`verifications:${code}`);
        const url = `${UPSTASH_URL.replace(/\/$/, '')}/INCR/${redisKey}`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${UPSTASH_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });
        const json = await resp.json();
        if (json && typeof json.result !== 'undefined') count = Number(json.result);
      } catch (upErr) {
        console.warn('Upstash error:', upErr && (upErr.message || upErr));
        // we do not abort entire response if Upstash fails; return product and count=null
      }
    } else {
      // Upstash not configured in environment — count will remain null
      console.warn('Upstash environment variables not set; count will be null.');
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, product, count })
    };

  } catch (err) {
    console.error('verify function error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: 'Internal server error', details: String(err) })
    };
  }
};
