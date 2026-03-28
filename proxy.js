const http = require('http');
const https = require('https');

const PROXY_PORT = 3001;
const TARGET_HOST = 'api.deepseek.com';

const server = http.createServer((req, res) => {
    // CORS headers - allow all
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method !== 'POST') {
        res.writeHead(405);
        res.end('Method Not Allowed');
        return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        const options = {
            hostname: TARGET_HOST,
            port: 443,
            path: req.url,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': req.headers['authorization'] || '',
                'Content-Length': Buffer.byteLength(body)
            }
        };

        const proxyReq = https.request(options, (proxyRes) => {
            res.writeHead(proxyRes.statusCode, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            proxyRes.pipe(res);
        });

        proxyReq.on('error', (e) => {
            console.error('Proxy error:', e);
            res.writeHead(502);
            res.end(JSON.stringify({ error: e.message }));
        });

        proxyReq.write(body);
        proxyReq.end();
    });
});

server.listen(PROXY_PORT, () => {
    console.log(`✅ CORS 代理已启动 → http://localhost:${PROXY_PORT}`);
    console.log(`   浏览器 → localhost:3001 → ${TARGET_HOST}`);
});
