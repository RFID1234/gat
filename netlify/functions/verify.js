// netlify/functions/verify.js
const fs = require('fs');
const path = require('path');

// Helper: try to load codes.json from a few likely locations
function loadCodesJson() {
  const tries = [
    path.join(process.cwd(), 'codes.json'),                  // repo root
    path.join(process.cwd(), 'public', 'api', 'codes.json'),// public/api/codes.json (served to client)
    path.join(process.cwd(), 'public', 'codes.json'),       // public/codes.json
    path.join(process.cwd(), 'netlify', 'functions', 'codes.json'), // functions/codes.json (less common)
  ];

  for (const p of tries) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf8');
        return JSON.parse(raw);
      }
    } catch (e) {
      // ignore parse errors, try next
      console.warn('Failed to parse codes.json at', p, e && e.message);
    }
  }
  return null;
}

let codesMap = loadCodesJson();

exports.handler = async function (event, context) {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, message: 'Method not allowed' })
      };
    }

    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch (e) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'Invalid JSON body' }) };
    }

    const code = (body.code || '').toString().trim();
    if (!code) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'No code provided' }) };
    }

    // If codesMap not loaded yet (rare), try to reload
    if (!codesMap) {
      codesMap = loadCodesJson();
    }

    if (!codesMap) {
      return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'Codes mapping not loaded' }) };
    }

    const entry = codesMap[code];
    if (!entry) {
      // preserve your previous behavior
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
        if (json && typeof json.result !== 'undefined') {
          count = Number(json.result);
        }
      } catch (upErr) {
        console.warn('Upstash error:', upErr && (upErr.message || upErr));
        // continue - we will return product with count=null
      }
    } else {
      console.warn('Upstash env vars not set; count will be null.');
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, product, count })
    };

  } catch (err) {
    console.error('verify function fatal error:', err && err.stack ? err.stack : err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, message: 'Internal server error', details: String(err) })
    };
  }
};
