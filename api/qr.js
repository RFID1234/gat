// Vercel/Netlify serverless function for QR code redirects
export default function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ 
            success: false, 
            message: 'Method not allowed' 
        });
    }

    const { c: code } = req.query || {};

    if (code) {
        return res.redirect(302, `/?c=${code}`);
    }
    return res.redirect(302, '/');
}

