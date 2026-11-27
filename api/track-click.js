import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';

export default async function handler(req, res) {

    res.setHeader('Cache-Control', 'no-store');

    if (req.method !== 'POST') {
        return res.status(405).json({
            error: 'Method not allowed'
        });
    }

    const { productId } = req.body || {};

    if (
        typeof productId !== 'string' ||
        !productId.trim() ||
        productId.length > 200
    ) {
        return res.status(400).json({
            error: 'Invalid product ID'
        });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const hashSecret = process.env.CLICK_HASH_SECRET;

    if (!supabaseUrl || !serviceKey || !hashSecret) {
        return res.status(500).json({
            error: 'Server configuration missing'
        });
    }

    try {

        const ip = String(
            req.headers['x-vercel-forwarded-for'] || ''
        ).split(',')[0].trim();

        if (!isIP(ip)) {
            return res.status(400).json({
                error: 'Visitor identification unavailable'
            });
        }

        const visitorHash = createHmac('sha256', hashSecret)
            .update(ip)
            .digest('hex');

        const response = await fetch(
            `${supabaseUrl}/rest/v1/rpc/track_secure_click`,
            {
                method: 'POST',
                headers: {
                    'apikey': serviceKey,
                    'Authorization': `Bearer ${serviceKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    p_product_id: productId,
                    p_visitor_hash: visitorHash
                })
            }
        );

       if (!response.ok) {
    const details = await response.text();

    console.error(
        'Supabase RPC Error:',
        response.status,
        details
    );

    return res.status(502).json({
        error: 'Click tracking failed'
    });
}
        const counted = await response.json();
console.log('Secure click counted:', counted);
        return res.status(200).json({
            success: true,
            counted: counted === true
        });

    } catch (error) {

        return res.status(500).json({
            error: 'Internal server error'
        });

    }
}
