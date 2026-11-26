module.exports = async function (req, res) {
    const id = req.query.id;

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
    const BASE_URL = 'https://velmorashop.vercel.app';

    const esc = s => String(s ?? '').replace(
        /[&<>"']/g,
        c => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[c]
    );

    try {
        if (typeof id !== 'string' || !/^[a-z0-9-]{3,60}$/.test(id)) {
            return res.status(400).send('Invalid product ID');
        }

        const endpoint = new URL(
            '/rest/v1/products',
            SUPABASE_URL
        );

        endpoint.searchParams.set(
            'select', 'id,name,price,image,published'
        );
        endpoint.searchParams.set('id', 'eq.' + id);
        endpoint.searchParams.set('published', 'eq.true');
        endpoint.searchParams.set('limit', '1');

        const response = await fetch(endpoint, {
            headers: {
                apikey: SUPABASE_KEY
            }
        });

        if (!response.ok) {
            throw new Error('Database request failed');
        }

        const products = await response.json();
        const product = products[0];

        if (!product) {
            return res.status(404).send('Product not found');
        }

        const title = product.name + ' | Velmora';

        const description =
            '₹' + Number(product.price).toLocaleString('en-IN') +
            ' on Velmora. Check current price at the retailer.';

        const image = product.image &&
            product.image.startsWith('https://')
            ? product.image
            : 'https://fyqskrkplwrbinirtldo.supabase.co/storage/v1/object/public/dealora-assets/VELMORA%20LOGO.jpeg';

        const url = BASE_URL + '/product/' +
            encodeURIComponent(id);

        const redirect = BASE_URL + '/#/p/' +
            encodeURIComponent(id);

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');

        return res.status(200).send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>${esc(title)}</title>

    <meta name="description" content="${esc(description)}">

    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Velmora">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(description)}">
    <meta property="og:image" content="${esc(image)}">
    <meta property="og:url" content="${esc(url)}">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(title)}">
    <meta name="twitter:description" content="${esc(description)}">
    <meta name="twitter:image" content="${esc(image)}">

</head>
<body>
    <h1>${esc(product.name)}</h1>
    <img src="${esc(image)}" alt="${esc(product.name)}" width="300">
    <p>${esc(description)}</p>
    <a href="${esc(redirect)}">View Product on Velmora</a>

    <script>
        window.location.replace(${JSON.stringify(redirect)});
    </script>
</body>
</html>
        `);

    } catch (error) {
        return res.status(500).send('Unable to load product');
    }
};
