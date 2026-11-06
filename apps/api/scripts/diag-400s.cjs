const http = require('http');

function login() {
  return new Promise((resolve, reject) => {
    const d = JSON.stringify({ email: 'admin@svr-constructora.com', password: 'admin123' });
    const rq = http.request({ hostname: 'localhost', port: 3001, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': d.length } }, (r) => {
      let b = '';
      r.on('data', (c) => (b += c));
      r.on('end', () => resolve(JSON.parse(b).data.accessToken));
    });
    rq.on('error', reject);
    rq.write(d);
    rq.end();
  });
}

function post(pathx, body, tok) {
  return new Promise((resolve, reject) => {
    const d = JSON.stringify(body);
    const rq = http.request({ hostname: 'localhost', port: 3001, path: pathx, method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tok}`, 'Content-Length': d.length } }, (r) => {
      let b = '';
      r.on('data', (c) => (b += c));
      r.on('end', () => resolve({ status: r.statusCode, body: b }));
    });
    rq.on('error', reject);
    rq.write(d);
    rq.end();
  });
}

function get(pathx, tok) {
  return new Promise((resolve, reject) => {
    const rq = http.request({ hostname: 'localhost', port: 3001, path: pathx, method: 'GET', headers: { 'Authorization': `Bearer ${tok}` } }, (r) => {
      let b = '';
      r.on('data', (c) => (b += c));
      r.on('end', () => { try { resolve(JSON.parse(b)); } catch (e) { resolve({ body: b }); } });
    });
    rq.on('error', reject);
    rq.end();
  });
}

(async () => {
  const tok = await login();
  const inv = await get('/api/inventario?limit=1', tok);
  const art = inv?.data?.items?.[0];
  console.log('artículo real:', art ? `${art.id} ${art.nombre}` : 'NO ENCONTRADO');
  if (!art) return;
  const prov = await post('/api/proveedores', { nombre: 'Prov Sanit Y2' }, tok);
  const pid = JSON.parse(prov.body).data.id;
  // payload SANITIZADO como el fix lo envía (sin modo)
  const payload = { proveedorId: pid, descripcion: 'Sanitizada', items: [{ articuloId: art.id, cantidad: 2, precioUnitario: Number(art.precioUnitario) }] };
  const oc = await post('/api/ordenes-compra', payload, tok);
  console.log('OC sanitizada (sin modo) =>', oc.status, oc.body.slice(0, 160));
  // niega el payload con modo para verificación completa
  const oc2 = await post('/api/ordenes-compra', { ...payload, items: payload.items.map((x) => ({ ...x, modo: 'inventario' })) }, tok);
  console.log('OC con modo =>', oc2.status);
})();
