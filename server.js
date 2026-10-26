// Surve helper server: creates a FREE KeyAuth key for each new signup.
// Run:  node server.js     (Node 18+)  — set SELLER_KEY first (see steps)
const http = require('http');
const SELLER = process.env.SELLER_KEY;          // KeyAuth Seller key (keep it ONLY here, never inside the exe)
const LEVEL  = process.env.FREE_LEVEL || '1';    // level number of your "free" subscription
const PORT   = process.env.PORT || 3000;
const hits = new Map();                          // simple limit: 8 signups / hour / IP

http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.url === '/free-key') {
    const ip = req.socket.remoteAddress, now = Date.now();
    const list = (hits.get(ip) || []).filter(t => now - t < 3600e3);
    if (list.length >= 8) { res.statusCode = 429; return res.end('{"success":false}'); }
    list.push(now); hits.set(ip, list);
    try {
      const u = `https://keyauth.win/api/seller/?sellerkey=${SELLER}&type=add&expiry=3650&mask=******-******-******&level=${LEVEL}&amount=1&format=json`;
      const r = await (await fetch(u)).json();
      const key = r.key || (r.keys && r.keys[0]);
      if (!key) { console.log('KeyAuth said:', r); res.statusCode = 502; return res.end('{"success":false}'); }
      return res.end(JSON.stringify({ success: true, key }));
    } catch (e) { console.log(e); res.statusCode = 500; return res.end('{"success":false}'); }
  }
  res.statusCode = 404; res.end('{}');
}).listen(PORT, () => console.log('Surve server on http://localhost:' + PORT));
