// Vercel/Netlify serverless function for product verification
let codesMap = null;
try {
    codesMap = require('./codes.json');
} catch (e) {
    codesMap = null;
}

export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { code } = req.body || {};
    if (!code || typeof code !== 'string') {
        return res.status(400).json({ success: false, message: 'No code provided' });
    }

    if (!codesMap) {
        return res.status(500).json({ success: false, message: 'Codes mapping not loaded' });
    }

    const entry = codesMap[code.trim()];
    if (!entry) {
        return res.status(200).json({ success: false, message: 'Invalid product code' });
    }

    const product = {
        code: code.trim(),
        imageUrl: entry.imageUrl || `/images/guilloche_${code.trim()}.png`,
        name: entry.name || 'GAT Sport Product',
        description: entry.description || 'Authentic GAT Sport supplement'
    };

    return res.status(200).json({ success: true, product });
}
