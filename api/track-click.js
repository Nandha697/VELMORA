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

    if (!supabaseUrl || !serviceKey) {
        return res.status(500).json({
            error: 'Server configuration missing'
        });
    }

    try {

        const response = await fetch(
            `${supabaseUrl}/rest/v1/rpc/track_product_click`,
            {
                method: 'POST',
                headers: {
                    'apikey': serviceKey,
                    'Authorization': `Bearer ${serviceKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    p_product_id: productId
                })
            }
        );

        if (!response.ok) {
            return res.status(502).json({
                error: 'Click tracking failed'
            });
        }

        return res.status(200).json({
            success: true
        });

    } catch (error) {

        return res.status(500).json({
            error: 'Internal server error'
        });

    }
}  
