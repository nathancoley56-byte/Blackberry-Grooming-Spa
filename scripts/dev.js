// Serves the site, runs the Decap CMS local backend, and starts GitHub sync.
// Usage: node scripts/dev.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const root = path.resolve(__dirname, '..');
const SITE_PORT = 8000;
const CMS_PORT = 8082;

const types = {
  '.html': 'text/html; charset=utf-8',
  '.yml': 'text/yaml; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml'
};

http.createServer((req, res) => {
  let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  const inRoot = file === root || file.startsWith(root + path.sep);
  const top = path.relative(root, file).split(path.sep)[0];
  if (!inRoot || ['scripts', '.env', 'sync.config.json', '.sync-state.json', '.sync-conflicts'].includes(top)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end('Not Found');
    }
    res.writeHead(200, {
      'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(data);
  });
}).listen(SITE_PORT, '127.0.0.1', () => {
  console.log(`Site:  http://localhost:${SITE_PORT}/`);
  console.log(`CMS:   http://localhost:${SITE_PORT}/admin/`);
});

const children = [
  spawn('npx.cmd', ['--yes', 'decap-server'], {
    cwd: root,
    shell: true,
    stdio: 'inherit',
    env: { ...process.env, PORT: String(CMS_PORT) }
  })
];

if (process.env.CMS_LOCAL_ONLY === '1') {
  console.log('[sync] Disabled: CMS_LOCAL_ONLY=1');
} else {
  children.push(spawn(process.execPath, [path.join(__dirname, 'sync.js')], { cwd: root, stdio: 'inherit' }));
}

function shutdown() {
  children.forEach(c => c.kill());
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
