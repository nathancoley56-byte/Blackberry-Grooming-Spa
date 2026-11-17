// Two-way sync between local content files and the GitHub repo that the online CMS commits to.
// Local CMS edits are pushed to GitHub; online CMS edits are pulled to disk.
// Config: sync.config.json ({ owner, repo, branch, paths }). Token: GITHUB_TOKEN env var or .env file.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const configPath = path.join(root, 'sync.config.json');
const statePath = path.join(root, '.sync-state.json');
const INTERVAL_MS = 15000;

function loadToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  const envFile = path.join(root, '.env');
  if (!fs.existsSync(envFile)) return '';
  const match = fs.readFileSync(envFile, 'utf8').match(/^\s*GITHUB_TOKEN\s*=\s*(.+?)\s*$/m);
  return match ? match[1].replace(/^["']|["']$/g, '') : '';
}

const config = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
const token = loadToken();

if (!config.owner || !config.repo || !token || token === 'paste_your_token_here') {
  console.log('[sync] Disabled: add your GitHub token to .env (GITHUB_TOKEN=...) to sync with the online CMS.');
  process.exit(0);
}

const branch = config.branch || 'main';
const prefixes = config.paths || ['content', 'assets/images/uploads'];
const api = `https://api.github.com/repos/${config.owner}/${config.repo}`;
const headers = {
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'maddies-grooming-cms-sync'
};

async function gh(url, options = {}) {
  const res = await fetch(url.startsWith('http') ? url : api + url, {
    ...options,
    headers: { ...headers, ...(options.body ? { 'Content-Type': 'application/json' } : {}) }
  });
  if (!res.ok) throw new Error(`${options.method || 'GET'} ${url} -> ${res.status} ${(await res.text()).slice(0, 200)}`);
  return res.status === 204 ? null : res.json();
}

const inScope = p => prefixes.some(prefix => p === prefix || p.startsWith(prefix + '/'));
const blobSha = buf => crypto.createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');
const encodePath = p => p.split('/').map(encodeURIComponent).join('/');

function listLocal() {
  const files = {};
  const walk = target => {
    if (!fs.existsSync(target)) return;
    if (fs.statSync(target).isFile()) {
      files[path.relative(root, target).split(path.sep).join('/')] = blobSha(fs.readFileSync(target));
      return;
    }
    for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
      walk(path.join(target, entry.name));
    }
  };
  prefixes.forEach(p => walk(path.join(root, p)));
  return files;
}

async function listRemote() {
  const tree = await gh(`/git/trees/${encodeURIComponent(branch)}?recursive=1`);
  const files = {};
  for (const item of tree.tree) {
    if (item.type === 'blob' && inScope(item.path)) files[item.path] = item.sha;
  }
  return files;
}

const loadState = () => (fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : {});

async function syncOnce() {
  const state = loadState();
  const local = listLocal();
  let remote;
  try {
    remote = await listRemote();
  } catch (err) {
    // An empty repository has no tree yet
    if (/ 404 | 409 /.test(err.message)) remote = {};
    else throw err;
  }

  for (const file of new Set([...Object.keys(local), ...Object.keys(remote), ...Object.keys(state)])) {
    const L = local[file];
    const R = remote[file];
    const B = state[file];
    const abs = path.join(root, ...file.split('/'));

    if (L === R) {
      if (L) state[file] = L;
      else delete state[file];
      continue;
    }

    const localChanged = L !== B;
    const remoteChanged = R !== B;

    if (localChanged && !remoteChanged) {
      if (L) {
        await gh(`/contents/${encodePath(file)}`, {
          method: 'PUT',
          body: JSON.stringify({
            message: `CMS (local): update ${file}`,
            content: fs.readFileSync(abs).toString('base64'),
            branch,
            ...(R ? { sha: R } : {})
          })
        });
        state[file] = L;
        console.log(`[sync] pushed ${file}`);
      } else {
        await gh(`/contents/${encodePath(file)}`, {
          method: 'DELETE',
          body: JSON.stringify({ message: `CMS (local): delete ${file}`, sha: R, branch })
        });
        delete state[file];
        console.log(`[sync] deleted remote ${file}`);
      }
    } else {
      if (L && localChanged) {
        const backup = path.join(root, '.sync-conflicts', file.replace(/\//g, '__') + `.${Date.now()}`);
        fs.mkdirSync(path.dirname(backup), { recursive: true });
        fs.copyFileSync(abs, backup);
        console.log(`[sync] conflict on ${file}: online version kept, local copy saved to ${path.relative(root, backup)}`);
      }
      if (R) {
        const blob = await gh(`/git/blobs/${R}`);
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        fs.writeFileSync(abs, Buffer.from(blob.content, 'base64'));
        state[file] = R;
        console.log(`[sync] pulled ${file}`);
      } else {
        fs.rmSync(abs, { force: true });
        delete state[file];
        console.log(`[sync] removed local ${file}`);
      }
    }
  }

  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

let running = false;
async function tick() {
  if (running) return;
  running = true;
  try {
    await syncOnce();
  } catch (err) {
    console.warn(`[sync] ${err.message}`);
  } finally {
    running = false;
  }
}

console.log(`[sync] Syncing ${prefixes.join(', ')} with ${config.owner}/${config.repo}@${branch} every ${INTERVAL_MS / 1000}s`);
tick();
setInterval(tick, INTERVAL_MS);
