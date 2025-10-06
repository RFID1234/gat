// Vercel/Netlify serverless function for random code generation
let codesMap = null;
try { codesMap = require('./codes.json'); } catch (e) { codesMap = null; }

export default function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    if (!codesMap || typeof codesMap !== 'object') {
        return res.status(500).json({ success: false, message: 'Codes mapping not loaded' });
    }

    const pool = Object.keys(codesMap);
    if (!pool.length) {
        return res.status(500).json({ success: false, message: 'No product codes available' });
    }

    const randomIndex = Math.floor(Math.random() * pool.length);
    const randomCode = pool[randomIndex];
    const baseUrl = req.headers.host ? `https://${req.headers.host}` : '';

    res.status(200).json({ 
        code: randomCode,
        url: baseUrl ? `${baseUrl}/api/qr?c=${randomCode}` : `/api/qr?c=${randomCode}`
    });
}
