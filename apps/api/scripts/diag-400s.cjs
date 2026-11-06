const http = require('http');

function login() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ email: 'admin@svr-constructora.com', password: 'admin123' });
    const req = http.request({ hostname: 'localhost', port: 3001, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': data.length } }, (r) => {
      let b = '';
      r.on('data', (c) => (b += c));
      r.on('end', () => resolve(JSON.parse(b).data.accessToken));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function post(path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({ hostname: 'localhost', port: 3001, path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'Content-Length': data.length } }, (r) => {
      let b = '';
      r.on('data', (c) => (b += c));
      r.on('end', () => resolve({ status: r.statusCode, body: b }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  const token = await login();
  const a = await post('/api/proveedores', { nombre: 'Prueba RFC', rfc: 'gdm' }, token);
  console.log('PROV rfc=gdm =>', a.status, a.body.slice(0, 220));
  const b = await post('/api/proveedores', { nombre: 'Prueba RFC', rfc: '——' }, token);
  console.log('PROV rfc=dash-dash =>', b.status, b.body.slice(0, 220));
  const c = await post('/api/proveedores', { nombre: 'Prueba RFC' }, token);
  console.log('PROV rfc=undefined =>', c.status, c.body.slice(0, 160));
  const d = await post('/api/ordenes-compra', { proveedorId: '550e8400-e29b-41d4-a716-446655440010', fecha: '2026-11-06' }, token);
  console.log('OC contrato viejo (sin items) =>', d.status, d.body.slice(0, 300));
})();
