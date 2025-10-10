// netlify/functions/verify.js
const fs = require('fs');
const path = require('path');

const DEBUG = (process.env.DEBUG_VERIFY || '').toString().toLowerCase() === 'true';

function loadCodesJson() {
  const tries = [
    path.join(process.cwd(), 'codes.json'),                   // repo root
    path.join(process.cwd(), 'public', 'api', 'codes.json'),  // public/api/codes.json
    path.join(process.cwd(), 'public', 'codes.json'),         // public/codes.json
    path.join(process.cwd(), 'netlify', 'functions', 'codes.json'), // functions/codes.json
  ];

  if (DEBUG) {
    console.log('verify: DEBUG mode ON. Checking for codes.json at candidate paths:');
    tries.forEach(p => console.log('  candidate:', p));
  }

  for (const p of tries) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf8');
        const parsed = JSON.parse(raw);
        if (DEBUG) {
          console.log(`verify: loaded codes.json from ${p} — entries: ${Object.keys(parsed).length}`);
        }
        return parsed;
      } else {
        if (DEBUG) console.log(`verify: not found at ${p}`);
      }
    } catch (e) {
      // parse error or read error
      console.warn('verify: error reading/parsing codes.json at', p, e && e.message);
    }
  }
  return null;
}

let codesMap = loadCodesJson();

exports.handler = async function (event, context) {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'Method not allowed' }) };
    }

    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch (e) {
      if (DEBUG) console.warn('verify: invalid JSON body', e && e.message);
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'Invalid JSON body' }) };
    }

    const code = (body.code || '').toString().trim();
    if (!code) {
      if (DEBUG) console.log('verify: no code provided in request body');
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'No code provided' }) };
    }

    if (!codesMap) {
      // attempt a reload at runtime (helpful if file appeared after function bundled)
      if (DEBUG) console.log('verify: codesMap not loaded at startup, attempting reload now...');
      codesMap = loadCodesJson();
    }

    if (!codesMap) {
      if (DEBUG) console.error('verify: codesMap STILL not loaded — returning error');
      return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'Codes mapping not loaded' }) };
    }

    if (DEBUG) console.log('verify: received code =', code);

    const entry = codesMap[code];
    if (!entry) {
      if (DEBUG) console.log('verify: code not found in codes.json ->', code);
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'Invalid product code' }) };
    }

    const product = {
      code,
      imageUrl: entry.imageUrl || `/images/guilloche_${code}.png`,
      name: entry.name || 'GAT Sport Product',
      description: entry.description || 'Authentic GAT Sport supplement'
    };

    // Upstash increment (only for valid codes)
    let count = null;
    const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
    const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (DEBUG) {
      console.log('verify: UPSTASH_REDIS_REST_URL set?', !!UPSTASH_URL);
      console.log('verify: UPSTASH_REDIS_REST_TOKEN set?', !!UPSTASH_TOKEN);
    }

    if (UPSTASH_URL && UPSTASH_TOKEN) {
      try {
        const redisKey = encodeURIComponent(`verifications:${code}`);
        const url = `${UPSTASH_URL.replace(/\/$/, '')}/INCR/${redisKey}`;
        if (DEBUG) console.log('verify: calling Upstash INCR URL=', url);
        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${UPSTASH_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });

        if (DEBUG) console.log('verify: Upstash response status =', resp.status);

        const json = await resp.json();
        if (DEBUG) console.log('verify: Upstash response body =', JSON.stringify(json).slice(0,2000));
        if (json && typeof json.result !== 'undefined') count = Number(json.result);
      } catch (upErr) {
        console.warn('verify: Upstash error:', upErr && (upErr.message || upErr));
      }
    } else {
      if (DEBUG) console.warn('verify: Upstash env vars missing; count will be null');
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, product, count })
    };
  } catch (err) {
    console.error('verify: fatal error', err && (err.stack || err));
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, message: 'Internal server error', details: String(err) }) };
  }
};
