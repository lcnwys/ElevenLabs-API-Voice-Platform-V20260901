import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);
app.use(express.json({ limit: '2mb' }));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } });
type Config = { baseUrl: string; apiKey: string };

function getConfig(req: express.Request): Config {
  return {
    baseUrl: String(req.header('x-custom-base-url') || process.env.ELEVENLABS_BASE_URL || 'https://api.elevenlabs.io').trim().replace(/\/$/, ''),
    apiKey: String(req.header('x-custom-api-key') || process.env.ELEVENLABS_API_KEY || '').trim()
  };
}

function requireKey(req: express.Request, res: express.Response): Config | null {
  const config = getConfig(req);
  if (!config.apiKey || config.apiKey === 'your_elevenlabs_api_key_here') {
    res.status(503).json({ error: 'ELEVENLABS_API_KEY is not configured', code: 'ELEVENLABS_API_KEY_REQUIRED' });
    return null;
  }
  return config;
}

async function upstreamError(response: Response): Promise<{ error: string; details?: unknown }> {
  const text = await response.text();
  try {
    const parsed = JSON.parse(text);
    return { error: parsed.detail || parsed.error || response.statusText, details: parsed };
  } catch {
    return { error: text || response.statusText };
  }
}

function sendUpstreamError(res: express.Response, response: Response, error: { error: string; details?: unknown }) {
  return res.status(response.status).json({ error: error.error, details: error.details });
}

async function jsonRequest(req: express.Request, res: express.Response, pathname: string, init: RequestInit = {}) {
  const config = requireKey(req, res);
  if (!config) return;
  try {
    const response = await fetch(`${config.baseUrl}${pathname}`, { ...init, headers: { 'xi-api-key': config.apiKey, ...(init.headers || {}) } });
    if (!response.ok) return sendUpstreamError(res, response, await upstreamError(response));
    const type = response.headers.get('content-type') || '';
    if (type.includes('application/json')) return res.status(response.status).json(await response.json());
    return res.status(response.status).send(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    return res.status(502).json({ error: 'Failed to reach ElevenLabs API', details: String(error) });
  }
}

async function binaryRequest(req: express.Request, res: express.Response, pathname: string, init: RequestInit = {}) {
  const config = requireKey(req, res);
  if (!config) return;
  try {
    const response = await fetch(`${config.baseUrl}${pathname}`, { ...init, headers: { 'xi-api-key': config.apiKey, ...(init.headers || {}) } });
    if (!response.ok) return sendUpstreamError(res, response, await upstreamError(response));
    const type = response.headers.get('content-type');
    if (type) res.setHeader('Content-Type', type);
    for (const name of ['request-id', 'character-cost', 'song-id']) {
      const value = response.headers.get(name);
      if (value) res.setHeader(name, value);
    }
    return res.status(response.status).send(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    return res.status(502).json({ error: 'Failed to reach ElevenLabs API', details: String(error) });
  }
}

function unsupported(res: express.Response, feature: string) {
  return res.status(501).json({ error: `${feature} is not implemented by this adapter yet`, code: 'OFFICIAL_API_NOT_IMPLEMENTED' });
}

function fileForm(file: Express.Multer.File, fieldName: string, fields: Record<string, unknown> = {}) {
  const form = new FormData();
  form.append(fieldName, new Blob([file.buffer], { type: file.mimetype }), file.originalname);
  for (const [key, value] of Object.entries(fields)) if (value !== undefined && value !== null && value !== '') form.append(key, String(value));
  return form;
}

function filesForm(files: Express.Multer.File[], fields: Record<string, unknown> = {}) {
  const form = new FormData();
  for (const file of files) form.append('files[]', new Blob([file.buffer], { type: file.mimetype }), file.originalname);
  for (const [key, value] of Object.entries(fields)) if (value !== undefined && value !== null && value !== '') form.append(key, String(value));
  return form;
}

function mapDubbingProject(project: any) {
  return { ...project, dubbing_id: project.project_id, name: project.reference || project.project_id, source_lang: project.source_language || 'auto', target_lang: project.language_ids?.[0] || '', source_language: project.source_language || 'auto', target_languages: project.language_ids || [], created_at: project.created_at ? Date.parse(project.created_at) : undefined };
}

app.get('/api/status', (req, res) => {
  const config = getConfig(req);
  const configured = Boolean(config.apiKey && config.apiKey !== 'your_elevenlabs_api_key_here');
  res.json({ configured, mode: configured ? 'api' : 'unconfigured', message: configured ? `Connected to ElevenLabs API (${config.baseUrl})` : 'ElevenLabs API key is required', baseUrl: config.baseUrl });
});
app.get('/api/models', (req, res) => jsonRequest(req, res, '/v1/models'));
app.get('/api/voices', (req, res) => {
  const params = new URLSearchParams();
  for (const key of ['page_size', 'search', 'sort', 'sort_direction', 'voice_type', 'category']) {
    const value = req.query[key];
    if (typeof value === 'string' && value) params.set(key, value);
  }
  return jsonRequest(req, res, `/v2/voices${params.toString() ? `?${params}` : ''}`);
});
app.post('/api/tts', (req, res) => {
  const { text, voice_id, model_id, voice_settings, output_format } = req.body || {};
  if (!text || !voice_id) return res.status(400).json({ error: 'text and voice_id are required' });
  const query = output_format ? `?output_format=${encodeURIComponent(output_format)}` : '';
  return binaryRequest(req, res, `/v1/text-to-speech/${encodeURIComponent(voice_id)}${query}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, model_id, voice_settings }) });
});
app.post('/api/voices/add', upload.fields([{ name: 'files', maxCount: 20 }, { name: 'file', maxCount: 20 }]), (req, res) => {
  const grouped = (req.files || {}) as Record<string, Express.Multer.File[]>;
  const files = [...(grouped.files || []), ...(grouped.file || [])];
  if (files.length === 0 || !req.body.name) return res.status(400).json({ error: 'name and at least one audio file are required' });
  return jsonRequest(req, res, '/v1/voices/add', { method: 'POST', body: filesForm(files, { name: req.body.name, description: req.body.description, remove_background_noise: req.body.remove_noise }) }).then(() => undefined);
});
app.delete('/api/voices/:voice_id', (req, res) => jsonRequest(req, res, `/v1/voices/${encodeURIComponent(req.params.voice_id)}`, { method: 'DELETE' }));
app.post('/api/sts', upload.single('file'), (req, res) => {
  if (!req.file || !req.body.voice_id) return res.status(400).json({ error: 'voice_id and audio file are required' });
  return binaryRequest(req, res, `/v1/speech-to-speech/${encodeURIComponent(req.body.voice_id)}`, { method: 'POST', body: fileForm(req.file, 'audio', { model_id: req.body.model_id, voice_settings: req.body.voice_settings }) });
});

app.post('/api/voice-design/generate', async (req, res) => {
  const { text, voice_description, model_id } = req.body || {};
  if (!text || !voice_description) return res.status(400).json({ error: 'text and voice_description are required' });
  const config = requireKey(req, res);
  if (!config) return;
  try {
    const response = await fetch(`${config.baseUrl}/v1/text-to-voice/design`, { method: 'POST', headers: { 'xi-api-key': config.apiKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ text, voice_description, model_id: model_id || 'eleven_multilingual_ttv_v2' }) });
    if (!response.ok) return sendUpstreamError(res, response, await upstreamError(response));
    const data: any = await response.json();
    const preview = data.previews?.[0];
    if (!preview?.audio_base_64 || !preview.generated_voice_id) return res.status(502).json({ error: 'ElevenLabs returned no voice preview' });
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('x-generated-voice-id', preview.generated_voice_id);
    return res.send(Buffer.from(preview.audio_base_64, 'base64'));
  } catch (error) {
    return res.status(502).json({ error: 'Failed to reach ElevenLabs Voice Design API', details: String(error) });
  }
});
app.post('/api/voice-design/save', (req, res) => {
  const { voice_name, voice_description, generated_voice_id } = req.body || {};
  if (!voice_name || !generated_voice_id) return res.status(400).json({ error: 'voice_name and generated_voice_id are required' });
  return jsonRequest(req, res, '/v1/text-to-voice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ voice_name, voice_description, generated_voice_id }) });
});

app.get('/api/history', (req, res) => jsonRequest(req, res, `/v1/history${req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : ''}`));
app.get('/api/history/download', (req, res) => binaryRequest(req, res, `/v1/history/download${req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : ''}`));
app.get('/api/history/:history_item_id', (req, res) => jsonRequest(req, res, `/v1/history/${encodeURIComponent(req.params.history_item_id)}`));
app.get('/api/history/:history_item_id/audio', (req, res) => binaryRequest(req, res, `/v1/history/${encodeURIComponent(req.params.history_item_id)}/audio`));
app.delete('/api/history/:history_item_id', (req, res) => jsonRequest(req, res, `/v1/history/${encodeURIComponent(req.params.history_item_id)}`, { method: 'DELETE' }));
app.get('/api/history/:history_item_id/source-file', (_req, res) => unsupported(res, 'History source file retrieval'));
app.get('/api/history/:history_item_id/logs', (_req, res) => unsupported(res, 'Custom execution logs'));
app.get('/api/history/:history_item_id/transcript', (_req, res) => unsupported(res, 'Generated history transcript'));
app.post('/api/history/record', (_req, res) => unsupported(res, 'Client-side history recording'));

app.get('/api/subscription', async (req, res) => {
  const config = requireKey(req, res);
  if (!config) return;
  try {
    const headers = { 'xi-api-key': config.apiKey };
    const [subscription, user] = await Promise.all([fetch(`${config.baseUrl}/v1/user/subscription`, { headers }), fetch(`${config.baseUrl}/v1/user`, { headers })]);
    if (!subscription.ok) return sendUpstreamError(res, subscription, await upstreamError(subscription));
    res.json({ ...(await subscription.json()), user: user.ok ? await user.json() : undefined });
  } catch (error) {
    res.status(502).json({ error: 'Failed to reach ElevenLabs user API', details: String(error) });
  }
});
app.post('/api/analytics/usage', (req, res) => jsonRequest(req, res, '/v1/workspace/analytics/query/usage-by-product-over-time', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req.body || {}) }));
app.post('/api/analytics/requests', (req, res) => jsonRequest(req, res, '/v1/workspace/analytics/requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req.body || {}) }));
app.get('/api/billing-breakdown', (_req, res) => unsupported(res, 'Invoice line-item billing breakdown is not available in the public ElevenLabs API; use workspace usage analytics and subscription data'));

app.get('/api/workspace/keys', (req, res) => jsonRequest(req, res, '/v1/service-accounts'));
app.post('/api/workspace/keys', (_req, res) => unsupported(res, 'Service account/API key creation'));
app.delete('/api/workspace/keys/:key_id', (_req, res) => unsupported(res, 'Service account/API key deletion'));
app.get('/api/workspace/members', (req, res) => jsonRequest(req, res, '/v1/workspace/members'));
app.post('/api/workspace/members', (req, res) => jsonRequest(req, res, '/v1/workspace/invites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req.body) }));
app.delete('/api/workspace/members/:user_id', (req, res) => jsonRequest(req, res, `/v1/workspace/members/${encodeURIComponent(req.params.user_id)}`, { method: 'DELETE' }));
app.get('/api/workspace/groups', (req, res) => jsonRequest(req, res, '/v1/workspace/groups'));
app.post('/api/workspace/groups', (_req, res) => unsupported(res, 'Workspace group creation'));
app.delete('/api/workspace/groups/:group_id', (_req, res) => unsupported(res, 'Workspace group deletion'));
app.get('/api/workspace/webhooks', (req, res) => jsonRequest(req, res, '/v1/webhooks'));
app.post('/api/workspace/webhooks', (req, res) => jsonRequest(req, res, '/v1/webhooks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req.body) }));
app.delete('/api/workspace/webhooks/:webhook_id', (req, res) => jsonRequest(req, res, `/v1/webhooks/${encodeURIComponent(req.params.webhook_id)}`, { method: 'DELETE' }));
app.post('/api/workspace/webhooks/:webhook_id/test', (_req, res) => unsupported(res, 'Webhook test delivery'));
app.get('/api/workspace/audit-logs', (req, res) => jsonRequest(req, res, `/v1/workspace/audit-logs${req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : ''}`));
app.get('/api/workspace/security', (_req, res) => unsupported(res, 'Security policy'));
app.post('/api/workspace/security', (_req, res) => unsupported(res, 'Security policy'));

app.get('/api/convai/agents', (req, res) => jsonRequest(req, res, '/v1/convai/agents'));
app.post('/api/convai/agents', (req, res) => jsonRequest(req, res, '/v1/convai/agents/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req.body) }));
app.post('/api/convai/conversation', (_req, res) => unsupported(res, 'Live Conversational AI session; use the official Agents client/WebSocket flow'));

app.post(['/api/sound-effects', '/api/sound-generation'], (req, res) => binaryRequest(req, res, '/v1/sound-generation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req.body) }));
app.post('/api/audio-isolation', upload.single('audio'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'audio file is required' });
  return binaryRequest(req, res, '/v1/audio-isolation', { method: 'POST', body: fileForm(req.file, 'audio') });
});
app.post('/api/speech-to-text', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file is required' });
  return jsonRequest(req, res, '/v1/speech-to-text', { method: 'POST', body: fileForm(req.file, 'file', { model_id: req.body.model_id || 'scribe_v2', language_code: req.body.language_code, keyterms: req.body.keyterms }) });
});

app.get('/api/dubbing', async (req, res) => {
  const config = requireKey(req, res);
  if (!config) return;
  try {
    const query = req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : '';
    const response = await fetch(`${config.baseUrl}/v1/dubbing/project${query}`, { headers: { 'xi-api-key': config.apiKey } });
    if (!response.ok) return sendUpstreamError(res, response, await upstreamError(response));
    const data: any = await response.json();
    res.json({ ...data, dubbings: (data.projects || []).map(mapDubbingProject) });
  } catch (error) {
    res.status(502).json({ error: 'Failed to reach ElevenLabs Dubbing API', details: String(error) });
  }
});
app.post('/api/dubbing', upload.single('file'), (req, res) => {
  if (!req.file && !req.body.source_url) return res.status(400).json({ error: 'file or source_url is required' });
  const form = req.file ? fileForm(req.file, 'file', { reference: req.body.name, source_language: req.body.source_lang === 'auto' ? undefined : req.body.source_lang, target_language: req.body.target_lang, model_id: req.body.model_id }) : (() => { const f = new FormData(); for (const [k, v] of Object.entries({ source_url: req.body.source_url, reference: req.body.name, source_language: req.body.source_lang, target_language: req.body.target_lang, model_id: req.body.model_id })) if (v) f.append(k, String(v)); return f; })();
  return jsonRequest(req, res, '/v1/dubbing/project', { method: 'POST', body: form });
});
app.get('/api/dubbing/:dubbing_id', (req, res) => jsonRequest(req, res, `/v1/dubbing/project/${encodeURIComponent(req.params.dubbing_id)}`));
app.delete('/api/dubbing/:dubbing_id', (req, res) => jsonRequest(req, res, `/v1/dubbing/project/${encodeURIComponent(req.params.dubbing_id)}`, { method: 'DELETE' }));
app.get('/api/dubbing/:dubbing_id/audio/:language_code', (_req, res) => unsupported(res, 'Dubbing language audio download; update UI to official language-target endpoint'));
app.get('/api/dubbing/:dubbing_id/transcript/:language_code', (_req, res) => unsupported(res, 'Dubbing transcript endpoint'));

app.post('/api/music/generate', async (req, res) => {
  const config = requireKey(req, res);
  if (!config) return;
  try {
    const body = req.body || {};
    const response = await fetch(`${config.baseUrl}/v1/music`, { method: 'POST', headers: { 'xi-api-key': config.apiKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: body.prompt, model_id: body.model_id || 'music_v1', music_length_ms: body.duration_seconds ? Math.round(body.duration_seconds * 1000) : undefined, force_instrumental: body.is_instrumental }) });
    if (!response.ok) return sendUpstreamError(res, response, await upstreamError(response));
    const audio = Buffer.from(await response.arrayBuffer());
    res.json({ track: { id: response.headers.get('song-id'), title: body.prompt, prompt: body.prompt, model_id: body.model_id || 'music_v1', duration_seconds: body.duration_seconds, is_instrumental: body.is_instrumental, audio_url: `data:${response.headers.get('content-type') || 'audio/mpeg'};base64,${audio.toString('base64')}`, created_at: Date.now() } });
  } catch (error) {
    res.status(502).json({ error: 'Failed to reach ElevenLabs Music API', details: String(error) });
  }
});
app.get('/api/music/models', (_req, res) => res.json([]));
app.get('/api/music/tracks', (_req, res) => res.json({ tracks: [] }));
app.get('/api/music/tracks/:id/audio', (_req, res) => unsupported(res, 'Music track persistence'));
app.get('/api/music/tracks/:id/stems/:stem_type', (_req, res) => unsupported(res, 'Music stems'));

app.get('/api/shared-voices', (req, res) => jsonRequest(req, res, `/v1/shared-voices${req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : ''}`));
app.post('/api/voices/add/:public_user_id/:voice_id', (req, res) => jsonRequest(req, res, `/v1/voices/add/${encodeURIComponent(req.params.public_user_id)}/${encodeURIComponent(req.params.voice_id)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req.body || {}) }));
app.get('/api/pronunciation-dictionaries', (req, res) => jsonRequest(req, res, '/v1/pronunciation-dictionaries'));
app.post('/api/pronunciation-dictionaries', (_req, res) => unsupported(res, 'Pronunciation dictionary creation; use official file/rules payload'));

app.post('/api/workbench/live-exec', async (req, res) => {
  const config = requireKey(req, res);
  if (!config) return;
  const { endpoint, method = 'GET', headers = {}, payload } = req.body || {};
  if (!endpoint || !String(endpoint).startsWith('/')) return res.status(400).json({ error: 'endpoint must be a relative official ElevenLabs path' });
  const started = Date.now();
  try {
    const response = await fetch(`${config.baseUrl}${endpoint}`, { method, headers: { 'xi-api-key': config.apiKey, ...headers }, body: method === 'GET' || method === 'DELETE' ? undefined : JSON.stringify(payload) });
    const type = response.headers.get('content-type') || '';
    const data = type.includes('json') ? await response.json() : await response.text();
    return res.json({ status: response.status, statusText: response.statusText, latency_ms: Date.now() - started, ttfb_ms: Date.now() - started, headers: Object.fromEntries(response.headers.entries()), contentType: type, jsonResponse: typeof data === 'object' ? data : undefined, error: response.ok ? undefined : typeof data === 'string' ? data : JSON.stringify(data), timestamp: new Date().toISOString() });
  } catch (error) {
    return res.status(502).json({ error: 'Failed to reach ElevenLabs API', details: String(error) });
  }
});

app.get('/api/pvc/slots', async (req, res) => {
  const config = requireKey(req, res);
  if (!config) return;
  try {
    const response = await fetch(`${config.baseUrl}/v1/voices`, { headers: { 'xi-api-key': config.apiKey } });
    if (!response.ok) return sendUpstreamError(res, response, await upstreamError(response));
    const data: any = await response.json();
    const voices = (data.voices || []).filter((voice: any) => voice.category === 'professional' || voice.voice_type === 'professional');
    return res.json({ total_pvc_slots: voices.length, used_pvc_slots: voices.length, available_pvc_slots: 0, total_custom_slots: voices.length, used_custom_slots: voices.length, can_use_pvc: voices.length > 0, slots: voices.map((voice: any, index: number) => ({ ...voice, slot_id: voice.voice_id, slot_index: index + 1, status: 'ready', voice_id: voice.voice_id, voice_name: voice.name })) });
  } catch (error) {
    return res.status(502).json({ error: 'Failed to reach ElevenLabs PVC API', details: String(error) });
  }
});
app.post('/api/pvc/slots/train', upload.array('dataset_files', 20), async (req, res) => {
  const config = requireKey(req, res);
  if (!config) return;
  const files = (req.files || []) as Express.Multer.File[];
  if (!req.body.voice_name || files.length === 0) return res.status(400).json({ error: 'voice_name and at least one dataset file are required' });
  try {
    const created = await fetch(`${config.baseUrl}/v1/voices/pvc`, { method: 'POST', headers: { 'xi-api-key': config.apiKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: req.body.voice_name, language: req.body.language || 'en', description: req.body.description }) });
    if (!created.ok) return sendUpstreamError(res, created, await upstreamError(created));
    const voice = await created.json() as any;
    const form = new FormData();
    for (const file of files) form.append('files[]', new Blob([file.buffer], { type: file.mimetype }), file.originalname);
    if (req.body.remove_background_noise !== undefined) form.append('remove_background_noise', String(req.body.remove_background_noise));
    const samples = await fetch(`${config.baseUrl}/v1/voices/pvc/${encodeURIComponent(voice.voice_id)}/samples`, { method: 'POST', headers: { 'xi-api-key': config.apiKey }, body: form });
    if (!samples.ok) return sendUpstreamError(res, samples, await upstreamError(samples));
    const trained = await fetch(`${config.baseUrl}/v1/voices/pvc/${encodeURIComponent(voice.voice_id)}/train`, { method: 'POST', headers: { 'xi-api-key': config.apiKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ model_id: req.body.base_model }) });
    if (!trained.ok) return sendUpstreamError(res, trained, await upstreamError(trained));
    return res.json({ voice, samples: await samples.json(), training: await trained.json(), slot: { ...voice, slot_id: voice.voice_id, voice_id: voice.voice_id, voice_name: req.body.voice_name, status: 'training' } });
  } catch (error) {
    return res.status(502).json({ error: 'Failed to reach ElevenLabs PVC API', details: String(error) });
  }
});
app.post('/api/pvc/slots/:slot_id/release', (req, res) => jsonRequest(req, res, `/v1/voices/${encodeURIComponent(req.params.slot_id)}`, { method: 'DELETE' }));
app.post('/api/pvc/slots/:slot_id/retrain', (req, res) => jsonRequest(req, res, `/v1/voices/pvc/${encodeURIComponent(req.params.slot_id)}/train`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model_id: req.body?.model_id }) }));
app.get('/api/pvc/slots/:slot_id/preview', (_req, res) => unsupported(res, 'PVC preview requires an official sample_id and sample audio endpoint'));

if (process.env.NODE_ENV !== 'production') {
  const { createServer } = await import('vite');
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
  app.use(vite.middlewares);
  app.use('*', async (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) return next();
    try {
      let html = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
      html = await vite.transformIndexHtml(req.originalUrl, html);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (error) {
      vite.ssrFixStacktrace(error as Error);
      next(error);
    }
  });
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) return next();
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found' }));
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.originalUrl.startsWith('/api')) return next(error);
  const isUploadError = error instanceof multer.MulterError;
  return res.status(isUploadError ? 400 : 500).json({
    error: isUploadError ? `Upload error: ${error.message}` : 'Internal server error',
    code: isUploadError ? error.code : 'INTERNAL_SERVER_ERROR'
  });
});
export { app };
if (!process.env.VERCEL) app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
