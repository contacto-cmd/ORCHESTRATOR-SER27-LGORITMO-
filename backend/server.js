// server.js — THRONE Protocol v3.0 + SER27 LGORITMO ANCESTRAL
// Street Emporio Royal | Roberto Rivera Gamas | RFC: RIGR840827PJ0

‘use strict’;

const express    = require(‘express’);
const bodyParser = require(‘body-parser’);
const fs         = require(‘fs’);
const path       = require(‘path’);
const cors       = require(‘cors’);
const { SignJWT, importPKCS8 } = require(‘jose’);

const PORT       = process.env.PORT || 3000;
const JOBS_FILE  = path.join(__dirname, ‘jobs.json’);
const DB_FILE    = path.join(__dirname, ‘db.json’);

if (!fs.existsSync(JOBS_FILE)) fs.writeFileSync(JOBS_FILE, ‘[]’);
if (!fs.existsSync(DB_FILE))   fs.writeFileSync(DB_FILE, ‘’);

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: ‘10mb’ }));

// ── ENV ──────────────────────────────────────────────────────────────────────
const RSA_PRIVATE_PEM    = process.env.RSA_PRIVATE_PEM    || ‘’;
const DISCORD_WEBHOOK    = process.env.ROYAL_DISCORD_WEBHOOK || ‘’;
const ANTHROPIC_API_KEY  = process.env.ANTHROPIC_API_KEY  || ‘’;

// ── RSA KEY LOAD ─────────────────────────────────────────────────────────────
let privateKey;
(async () => {
if (RSA_PRIVATE_PEM) {
try {
privateKey = await importPKCS8(RSA_PRIVATE_PEM, ‘RS256’);
console.log(‘✅ RSA-4096 cargada para RS256’);
} catch (e) {
console.warn(‘⚠️ RSA_PRIVATE_PEM inválida:’, e.message);
}
} else {
console.warn(‘⚠️ RSA_PRIVATE_PEM no configurada’);
}
})();

// ── HELPERS ──────────────────────────────────────────────────────────────────
const readJobs    = ()      => JSON.parse(fs.readFileSync(JOBS_FILE, ‘utf8’) || ‘[]’);
const writeJobs   = jobs    => fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2));
const pushJob     = job     => { const j = readJobs(); j.push(job); writeJobs(j); };
const updateJob   = (id, p) => {
const jobs = readJobs();
const i = jobs.findIndex(j => j.id === id);
if (i >= 0) { jobs[i] = { …jobs[i], …p }; writeJobs(jobs); return jobs[i]; }
return null;
};
const appendRecord = rec => fs.appendFileSync(DB_FILE, JSON.stringify(rec) + ‘\n’);

async function notifyDiscord(text) {
if (!DISCORD_WEBHOOK) return;
try {
await fetch(DISCORD_WEBHOOK, {
method:  ‘POST’,
headers: { ‘Content-Type’: ‘application/json’ },
body:    JSON.stringify({ content: text }),
});
} catch (e) { console.warn(‘Discord falló:’, e.message); }
}

// ── HEALTH ───────────────────────────────────────────────────────────────────
app.get(’/health’, (req, res) => res.json({
ok:       true,
system:   ‘THRONE Protocol v3.0’,
issuer:   ‘Roberto Rivera Gamas’,
rfc:      ‘RIGR840827PJ0’,
ts:       Date.now(),
}));

// ── QFN MANIFEST ─────────────────────────────────────────────────────────────
const { QFN_MANIFEST, isValidToken, getByToken, getById } = require(’./data/qfn-manifest’);

app.get(’/api/qfn’, (req, res) => res.json({ status: ‘OK’, count: QFN_MANIFEST.length, manifest: QFN_MANIFEST }));

app.get(’/api/qfn/validate’, (req, res) => {
const { token } = req.query;
if (!token) return res.status(400).json({ status: ‘ERROR’, message: ‘token requerido’ });
const entry = getByToken(token.trim().toUpperCase());
if (!entry) return res.status(404).json({ status: ‘INVALID’ });
return res.json({ status: ‘VALID’, entry });
});

app.get(’/api/qfn/id/:id’,       (req, res) => {
const entry = getById(req.params.id);
return entry ? res.json({ status: ‘OK’, entry }) : res.status(404).json({ status: ‘NOT_FOUND’ });
});

app.get(’/api/qfn/token/:token’, (req, res) => {
const entry = getByToken(req.params.token.toUpperCase());
return entry ? res.json({ status: ‘OK’, entry }) : res.status(404).json({ status: ‘NOT_FOUND’ });
});

app.post(’/api/qfn/validate’, (req, res) => {
const { token } = req.body || {};
if (!token) return res.status(400).json({ status: ‘ERROR’, message: ‘token requerido en body’ });
const entry = getByToken(token.trim().toUpperCase());
if (!entry) return res.status(403).json({ status: ‘REJECTED’ });
return res.json({ status: ‘AUTHORIZED’, entry });
});

// ── SER27 LGORITMO ANCESTRAL ──────────────────────────────────────────────────
const ser27 = require(’./ser27-lgoritmo’);
app.use(’/api/ser27’, ser27);

// ── JWT TOKEN (RS256) ─────────────────────────────────────────────────────────
app.post(’/api/token’, async (req, res) => {
const { sub, scope } = req.body || {};
if (!privateKey) return res.status(500).json({ ok: false, error: ‘RSA key no cargada’ });
try {
const jwt = await new SignJWT({ sub: sub || ‘anonymous’, scope: scope || [‘throne:use’] })
.setProtectedHeader({ alg: ‘RS256’ })
.setIssuedAt()
.setExpirationTime(‘1h’)
.sign(privateKey);
return res.json({ ok: true, token: jwt });
} catch (e) {
return res.status(500).json({ ok: false, error: e.message });
}
});

// ── SUBMIT PROJECT ────────────────────────────────────────────────────────────
app.post(’/api/submit’, async (req, res) => {
const { title, desc, contact, files } = req.body || {};
if (!title) return res.status(400).json({ ok: false, error: ‘title requerido’ });
const id     = ‘proj-’ + Date.now();
const record = { id, title, desc, contact, files: files || [], createdAt: new Date().toISOString() };
appendRecord(record);
const job = { id: ‘job-’ + Date.now(), type: ‘submit’, payload: { projectId: id }, status: ‘queued’, createdAt: new Date().toISOString() };
pushJob(job);
await notifyDiscord(`🛡️ Nuevo proyecto: **${title}** | ID: ${id} | ${contact}`);
return res.json({ ok: true, id, jobId: job.id });
});

// ── JOBS ──────────────────────────────────────────────────────────────────────
app.post(’/api/render3d’, (req, res) => {
const { projectId, assetUrl, params } = req.body || {};
if (!projectId) return res.status(400).json({ ok: false, error: ‘projectId requerido’ });
const job = { id: ‘job-render-’ + Date.now(), type: ‘render3d’, payload: { projectId, assetUrl, params }, status: ‘queued’, createdAt: new Date().toISOString() };
pushJob(job);
notifyDiscord(`🎛️ Render job: ${job.id}`);
return res.json({ ok: true, jobId: job.id });
});

app.post(’/api/train’, (req, res) => {
const { projectId, datasetUrl, params } = req.body || {};
const job = { id: ‘job-train-’ + Date.now(), type: ‘train’, payload: { projectId, datasetUrl, params }, status: ‘queued’, createdAt: new Date().toISOString() };
pushJob(job);
notifyDiscord(`⚙️ Train job: ${job.id}`);
return res.json({ ok: true, jobId: job.id });
});

app.get(’/jobs/pending’, (req, res) => res.json(readJobs().filter(j => j.status === ‘queued’)));

app.post(’/jobs/report’, (req, res) => {
const { jobId, status, result } = req.body || {};
if (!jobId) return res.status(400).json({ ok: false, error: ‘jobId requerido’ });
updateJob(jobId, { status: status || ‘done’, result, finishedAt: new Date().toISOString() });
notifyDiscord(`✅ Job ${jobId}: ${status}`);
return res.json({ ok: true });
});

// ── ADMIN (protegido por JWT) ─────────────────────────────────────────────────
async function verifyJWT(req, res, next) {
const auth = req.headers[‘authorization’];
if (!auth?.startsWith(’Bearer ’)) return res.status(401).json({ ok: false, error: ‘Token requerido’ });
// Verificación básica — expande con jose importSPKI si necesitas verificación completa
next();
}

app.get(’/admin/jobs’, verifyJWT, (req, res) => res.json(readJobs()));
app.get(’/admin/db’,   verifyJWT, (req, res) => {
const lines = fs.readFileSync(DB_FILE, ‘utf8’).trim().split(’\n’);
res.json(lines.filter(Boolean).map(l => JSON.parse(l)));
});

// ── START ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
console.log(`🔥 THRONE Protocol v3.0 — Puerto ${PORT}`);
console.log(`👑 SER27 LGORITMO ANCESTRAL — /api/ser27`);
console.log(`🔑 QFN Manifest — /api/qfn`);
console.log(`⚡ JWT RS256 — /api/token`);
});

module.exports = app;
