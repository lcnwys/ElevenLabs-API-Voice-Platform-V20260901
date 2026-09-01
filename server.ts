import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

// Helper to dynamically resolve configuration for tests/custom endpoints
function getElevenLabsConfig(req?: any) {
  let baseUrl = (process.env.ELEVENLABS_BASE_URL || 'https://api.elevenlabs.io').trim().replace(/\/$/, '');
  let apiKey = (process.env.ELEVENLABS_API_KEY || '').trim();

  if (req && req.headers) {
    const headerBaseUrl = req.headers['x-custom-base-url'];
    const headerApiKey = req.headers['x-custom-api-key'];
    if (typeof headerBaseUrl === 'string' && headerBaseUrl.trim() !== '') {
      baseUrl = headerBaseUrl.trim().replace(/\/$/, '');
    }
    if (typeof headerApiKey === 'string' && headerApiKey.trim() !== '') {
      apiKey = headerApiKey.trim();
    }
  }

  const isConfigured = apiKey !== '' && apiKey !== 'your_elevenlabs_api_key_here';
  return { baseUrl, apiKey, isConfigured };
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// In-memory store for custom simulated voices added during cloning
let simulatorVoices: any[] = [];

// Standard ElevenLabs voices list for fallback/simulator mode
const STANDARD_VOICES = [
  {
    voice_id: "21m00Tcm4TlvDq8ikWAM",
    name: "Rachel",
    category: "premade",
    description: "Female, pleasant, warm voice, great for audiobooks and storytelling.",
    labels: { accent: "american", gender: "female", age: "young", use_case: "narration" },
    preview_url: "https://api.elevenlabs.io/v1/voices/21m00Tcm4TlvDq8ikWAM/previews"
  },
  {
    voice_id: "EXAVITQu4vr4xnSDgMaL",
    name: "Bella",
    category: "premade",
    description: "Female, warm, conversational voice, perfect for podcasts and dialogue.",
    labels: { accent: "american", gender: "female", age: "young", use_case: "conversational" },
    preview_url: "https://api.elevenlabs.io/v1/voices/EXAVITQu4vr4xnSDgMaL/previews"
  },
  {
    voice_id: "pNInz6obpgdq5TBBMCf3",
    name: "George",
    category: "premade",
    description: "Male, deep British voice, great for authoritative or documentary narration.",
    labels: { accent: "british", gender: "male", age: "middle_aged", use_case: "documentary" },
    preview_url: "https://api.elevenlabs.io/v1/voices/pNInz6obpgdq5TBBMCf3/previews"
  },
  {
    voice_id: "pMs2g897ldZ37G23Vwuk",
    name: "Adam",
    category: "premade",
    description: "Male, deep American narration voice, classic radio style.",
    labels: { accent: "american", gender: "male", age: "middle_aged", use_case: "narration" },
    preview_url: "https://api.elevenlabs.io/v1/voices/pMs2g897ldZ37G23Vwuk/previews"
  },
  {
    voice_id: "XrExE9y7XgTuxT3XT3pM",
    name: "Nicole",
    category: "premade",
    description: "Female, soft whispering voice, excellent for ASMR or intimate narration.",
    labels: { accent: "australian", gender: "female", age: "young", use_case: "whispering" },
    preview_url: "https://api.elevenlabs.io/v1/voices/XrExE9y7XgTuxT3XT3pM/previews"
  }
];

// Standard ElevenLabs models list for fallback/simulator mode
const STANDARD_MODELS = [
  {
    model_id: "eleven_flash_v2_5",
    name: "Eleven Flash v2.5",
    description: "Super fast model with great quality, extremely low latency and highly cost-effective.",
    languages: ["en", "zh", "ja", "fr", "de", "it", "es", "pt", "pl", "tr", "ru", "nl", "ko"],
    cost_factor: 0.5,
    speed: "Ultra Fast",
    quality: "High"
  },
  {
    model_id: "eleven_turbo_v2_5",
    name: "Eleven Turbo v2.5",
    description: "High speed model, optimized for real-time text-to-speech with very low latency.",
    languages: ["en", "zh", "ja", "fr", "de", "it", "es", "pt", "pl", "tr", "ru", "nl", "ko"],
    cost_factor: 1.0,
    speed: "Very Fast",
    quality: "Very High"
  },
  {
    model_id: "eleven_multilingual_v2",
    name: "Eleven Multilingual v2",
    description: "Highly rich and expressive multilingual model. Captures emotions and accents beautifully.",
    languages: ["en", "zh", "ja", "fr", "de", "it", "es", "pt", "pl", "tr", "ru", "nl", "ko", "ar", "hi", "vi"],
    cost_factor: 2.0,
    speed: "Fast",
    quality: "Studio Grade"
  },
  {
    model_id: "eleven_monolingual_v1",
    name: "Eleven Monolingual v1",
    description: "Legacy English-only model optimized for classic narration and high consistency.",
    languages: ["en"],
    cost_factor: 1.0,
    speed: "Fast",
    quality: "Standard"
  }
];

// 1. Get status of ElevenLabs API
app.get('/api/status', (req, res) => {
  const { baseUrl, isConfigured } = getElevenLabsConfig(req);
  res.json({
    configured: isConfigured,
    mode: isConfigured ? 'api' : 'simulator',
    message: isConfigured ? `Connected to ElevenLabs API (${baseUrl})` : 'Running in Evaluation Mode (Simulator)',
    baseUrl
  });
});

// 2. Get available models
app.get('/api/models', async (req, res) => {
  const { baseUrl, apiKey, isConfigured } = getElevenLabsConfig(req);

  if (isConfigured) {
    try {
      const response = await fetch(`${baseUrl}/v1/models`, {
        headers: { 'xi-api-key': apiKey }
      });
      if (response.ok) {
        const data = await response.json();
        res.json(data);
        return;
      }
    } catch (err) {
      console.error('Error fetching ElevenLabs models:', err);
    }
  }

  // Simulator fallback
  res.json(STANDARD_MODELS);
});

// 3. Get voices list (both system default and custom cloned ones)
app.get('/api/voices', async (req, res) => {
  const { baseUrl, apiKey, isConfigured } = getElevenLabsConfig(req);

  if (isConfigured) {
    try {
      const response = await fetch(`${baseUrl}/v1/voices`, {
        headers: { 'xi-api-key': apiKey }
      });
      if (response.ok) {
        const data = await response.json();
        // Combine real custom voices with any local session-simulated voices
        res.json({ voices: [...data.voices, ...simulatorVoices] });
        return;
      }
    } catch (err) {
      console.error('Error fetching ElevenLabs voices:', err);
    }
  }

  // Simulator mode
  res.json({ voices: [...STANDARD_VOICES, ...simulatorVoices] });
});

// 4. Text to Speech generation API
app.post('/api/tts', async (req, res) => {
  const { text, voice_id, model_id, voice_settings } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  const { baseUrl, apiKey, isConfigured } = getElevenLabsConfig(req);

  // Only route to ElevenLabs if configured AND not a simulated voice ID
  const isSimulatedVoice = String(voice_id).startsWith('sim_');
  if (isConfigured && !isSimulatedVoice) {
    try {
      const targetVoiceId = voice_id || '21m00Tcm4TlvDq8ikWAM';
      const targetModelId = model_id || 'eleven_multilingual_v2';
      
      const payload = {
        text,
        model_id: targetModelId,
        voice_settings: voice_settings || {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      };

      const response = await fetch(`${baseUrl}/v1/text-to-speech/${targetVoiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        res.setHeader('Content-Type', 'audio/mpeg');
        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));
        return;
      } else {
        const errText = await response.text();
        console.error('ElevenLabs API TTS failed:', errText);
      }
    } catch (err) {
      console.error('Error querying ElevenLabs TTS:', err);
    }
  }

  // Fallback / Simulator mode: Use Google Translate TTS or other dynamic fallback
  try {
    const encodedText = encodeURIComponent(text.substring(0, 200));
    // Determine language from text - default to English, if Chinese characters detected use zh
    const hasChinese = /[\u4e00-\u9fa5]/.test(text);
    const lang = hasChinese ? 'zh' : 'en';
    
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodedText}`;
    
    const response = await fetch(ttsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (response.ok) {
      res.setHeader('Content-Type', 'audio/mpeg');
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } else {
      res.status(500).json({ error: 'Failed to generate speech in simulator mode' });
    }
  } catch (err) {
    console.error('Simulator TTS generation failed:', err);
    res.status(500).json({ error: 'Simulator TTS error' });
  }
});

// Configure Multer for processing file uploads in memory
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// 5. Clone voice API (add voice)
app.post('/api/voices/add', upload.single('file'), async (req, res) => {
  const { name, description } = req.body;
  const file = req.file;

  if (!name) {
    return res.status(400).json({ error: 'Voice name is required' });
  }

  const { baseUrl, apiKey, isConfigured } = getElevenLabsConfig(req);

  if (isConfigured && file) {
    try {
      const formData = new FormData();
      formData.append('name', name);
      if (description) formData.append('description', description);
      
      const blob = new Blob([file.buffer], { type: file.mimetype });
      formData.append('files', blob, file.originalname);

      const response = await fetch(`${baseUrl}/v1/voices/add`, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
        },
        body: formData
      });

      if (response.ok) {
        const voiceData = await response.json();
        res.json({ success: true, voice: voiceData });
        return;
      } else {
        const errText = await response.text();
        console.error('ElevenLabs Add Voice endpoint failed:', errText);
      }
    } catch (err) {
      console.error('Error querying ElevenLabs Voice cloning API:', err);
    }
  }

  // Simulator mode fallback
  const newVoiceId = 'sim_' + Math.random().toString(36).substring(2, 11);
  const newVoice = {
    voice_id: newVoiceId,
    name: name,
    category: 'cloned',
    description: description || 'Custom cloned voice from audio sample.',
    labels: { accent: 'cloned', gender: 'custom', age: 'adult', use_case: 'cloned' },
    preview_url: ''
  };
  
  simulatorVoices.push(newVoice);
  res.json({ success: true, voice: newVoice, simulated: true });
});

// 6. Delete Voice API
app.delete('/api/voices/:voice_id', async (req, res) => {
  const { voice_id } = req.params;

  // Filter out from local simulator voices list
  const beforeLength = simulatorVoices.length;
  simulatorVoices = simulatorVoices.filter(v => v.voice_id !== voice_id);

  const { baseUrl, apiKey, isConfigured } = getElevenLabsConfig(req);

  if (isConfigured && !voice_id.startsWith('sim_')) {
    try {
      const response = await fetch(`${baseUrl}/v1/voices/${voice_id}`, {
        method: 'DELETE',
        headers: { 'xi-api-key': apiKey }
      });
      if (response.ok) {
        return res.json({ success: true, message: 'Voice deleted successfully from ElevenLabs' });
      } else {
        const errText = await response.text();
        console.error('ElevenLabs Voice deletion failed:', errText);
      }
    } catch (err) {
      console.error('Error querying ElevenLabs Voice deletion API:', err);
    }
  }

  if (voice_id.startsWith('sim_') || beforeLength > simulatorVoices.length) {
    return res.json({ success: true, message: 'Voice deleted from simulator cache' });
  }

  res.status(404).json({ error: 'Voice not found' });
});

// 7. Speech to Speech transformation API
app.post('/api/sts', upload.single('file'), async (req, res) => {
  const { voice_id, model_id, voice_settings } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'Audio file is required' });
  }

  const { baseUrl, apiKey, isConfigured } = getElevenLabsConfig(req);

  if (isConfigured && voice_id && !voice_id.startsWith('sim_')) {
    try {
      const formData = new FormData();
      const blob = new Blob([file.buffer], { type: file.mimetype });
      formData.append('audio', blob, file.originalname);
      formData.append('model_id', model_id || 'eleven_multilingual_sts_v2');
      
      if (voice_settings) {
        formData.append('voice_settings', voice_settings);
      }

      const response = await fetch(`${baseUrl}/v1/speech-to-speech/${voice_id}`, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
        },
        body: formData
      });

      if (response.ok) {
        res.setHeader('Content-Type', 'audio/mpeg');
        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));
        return;
      } else {
        const errText = await response.text();
        console.error('ElevenLabs STS failed:', errText);
      }
    } catch (err) {
      console.error('Error in ElevenLabs STS:', err);
    }
  }

  // Simulator fallback: return original audio (or echo back)
  res.setHeader('Content-Type', file.mimetype || 'audio/mpeg');
  res.send(file.buffer);
});

// 8. Voice Design (Generation) API
app.post('/api/voice-design/generate', async (req, res) => {
  const { gender, accent, age, accent_strength, text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Sample text is required' });
  }

  const { baseUrl, apiKey, isConfigured } = getElevenLabsConfig(req);

  if (isConfigured) {
    try {
      const response = await fetch(`${baseUrl}/v1/voice-generation/generate-a-voice`, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          gender,
          accent,
          age,
          accent_strength: accent_strength || 1.0,
          text
        })
      });

      if (response.ok) {
        const generatedVoiceId = response.headers.get('generated_voice_id');
        res.setHeader('Content-Type', 'audio/mpeg');
        if (generatedVoiceId) {
          res.setHeader('x-generated-voice-id', generatedVoiceId);
        }
        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));
        return;
      } else {
        const errText = await response.text();
        console.error('ElevenLabs Voice Design generation failed:', errText);
      }
    } catch (err) {
      console.error('Error in ElevenLabs Voice Design API:', err);
    }
  }

  // Simulator Mode: generate speech about voice design parameters using Google TTS
  try {
    const desc = `Hello! This is a mock demo of your newly designed custom speaker. Gender is ${gender}, age bracket is ${age}, and oral accent is ${accent}.`;
    const encodedText = encodeURIComponent(desc);
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodedText}`;
    
    const response = await fetch(ttsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    if (response.ok) {
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('x-generated-voice-id', 'sim_tok_' + Math.random().toString(36).substring(2, 11));
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } else {
      res.status(500).json({ error: 'Simulator Voice Design failure' });
    }
  } catch (err) {
    console.error('Simulator Voice Design error:', err);
    res.status(500).json({ error: 'Simulator Voice Design error' });
  }
});

// 9. Save Designed Voice API
app.post('/api/voice-design/save', async (req, res) => {
  const { voice_name, voice_description, generated_voice_id } = req.body;

  if (!voice_name || !generated_voice_id) {
    return res.status(400).json({ error: 'voice_name and generated_voice_id are required' });
  }

  const { baseUrl, apiKey, isConfigured } = getElevenLabsConfig(req);

  if (isConfigured && !generated_voice_id.startsWith('sim_')) {
    try {
      const response = await fetch(`${baseUrl}/v1/voice-generation/create-voice`, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          voice_name,
          voice_description,
          generated_voice_id
        })
      });

      if (response.ok) {
        const data = await response.json();
        res.json({ success: true, voice: data });
        return;
      } else {
        const errText = await response.text();
        console.error('ElevenLabs save designed voice failed:', errText);
      }
    } catch (err) {
      console.error('Error saving designed voice in ElevenLabs:', err);
    }
  }

  // Simulator mode fallback
  const newVoiceId = 'sim_design_' + Math.random().toString(36).substring(2, 11);
  const newVoice = {
    voice_id: newVoiceId,
    name: voice_name,
    category: 'designed',
    description: voice_description || 'Custom designed voice using AI parameters.',
    labels: { accent: 'designed', gender: 'custom', age: 'designed', use_case: 'designed' },
    preview_url: ''
  };

  simulatorVoices.push(newVoice);
  res.json({ success: true, voice: newVoice, simulated: true });
});

// In-memory store for simulator cloud history items
let simulatorHistory = [
  {
    history_item_id: "cl_item_1",
    voice_id: "21m00Tcm4TlvDq8ikWAM",
    voice_name: "Rachel",
    model_id: "eleven_multilingual_v2",
    text: "This is a simulated cloud-saved generation item. Highly optimized for professional content creation.",
    date_unix: Math.floor(Date.now() / 1000) - 3600,
    character_count_change_from: 0,
    character_count_change_to: 98,
    content_type: "audio/mpeg",
    state: "done"
  },
  {
    history_item_id: "cl_item_2",
    voice_id: "pMs2g897ldZ37G23Vwuk",
    voice_name: "Adam",
    model_id: "eleven_turbo_v2_5",
    text: "Welcome to the bilingual voice evaluation portal. Let us evaluate multiple models together.",
    date_unix: Math.floor(Date.now() / 1000) - 7200,
    character_count_change_from: 0,
    character_count_change_to: 89,
    content_type: "audio/mpeg",
    state: "done"
  }
];

// 10. Get ElevenLabs Cloud History API
app.get('/api/history', async (req, res) => {
  const { baseUrl, apiKey, isConfigured } = getElevenLabsConfig(req);

  if (isConfigured) {
    try {
      const response = await fetch(`${baseUrl}/v1/history`, {
        headers: { 'xi-api-key': apiKey }
      });
      if (response.ok) {
        const data = await response.json();
        res.json(data);
        return;
      }
    } catch (err) {
      console.error('Error fetching cloud history from ElevenLabs:', err);
    }
  }

  res.json({ history: simulatorHistory });
});

// 11. Get ElevenLabs Cloud History Audio API
app.get('/api/history/:history_item_id/audio', async (req, res) => {
  const { history_item_id } = req.params;
  const { baseUrl, apiKey, isConfigured } = getElevenLabsConfig(req);

  if (isConfigured && !history_item_id.startsWith('cl_item_')) {
    try {
      const response = await fetch(`${baseUrl}/v1/history/${history_item_id}/audio`, {
        headers: { 'xi-api-key': apiKey }
      });
      if (response.ok) {
        res.setHeader('Content-Type', 'audio/mpeg');
        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));
        return;
      }
    } catch (err) {
      console.error('Error fetching ElevenLabs cloud history audio:', err);
    }
  }

  // Simulator mode fallback audio
  try {
    const matched = simulatorHistory.find(h => h.history_item_id === history_item_id);
    const txt = matched ? matched.text : "Simulated cloud history item voice playback.";
    const encodedText = encodeURIComponent(txt);
    const response = await fetch(`https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodedText}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    if (response.ok) {
      res.setHeader('Content-Type', 'audio/mpeg');
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } else {
      res.status(500).json({ error: 'Simulator cloud history audio failure' });
    }
  } catch (err) {
    console.error('Simulator cloud history audio error:', err);
    res.status(500).json({ error: 'Simulator cloud history audio error' });
  }
});

// 12. Delete ElevenLabs Cloud History Item API
app.delete('/api/history/:history_item_id', async (req, res) => {
  const { history_item_id } = req.params;
  const { baseUrl, apiKey, isConfigured } = getElevenLabsConfig(req);

  const beforeLength = simulatorHistory.length;
  simulatorHistory = simulatorHistory.filter(h => h.history_item_id !== history_item_id);

  if (isConfigured && !history_item_id.startsWith('cl_item_')) {
    try {
      const response = await fetch(`${baseUrl}/v1/history/${history_item_id}`, {
        method: 'DELETE',
        headers: { 'xi-api-key': apiKey }
      });
      if (response.ok) {
        return res.json({ success: true, message: 'Deleted history item from ElevenLabs' });
      } else {
        const errText = await response.text();
        console.error('ElevenLabs Cloud History item deletion failed:', errText);
      }
    } catch (err) {
      console.error('Error deleting ElevenLabs Cloud History item:', err);
    }
  }

  if (history_item_id.startsWith('cl_item_') || beforeLength > simulatorHistory.length) {
    return res.json({ success: true, message: 'Deleted history item from simulator storage' });
  }

  res.status(404).json({ error: 'Cloud history item not found' });
});



// Setup Vite Dev Server Middleware or static fallback
let vite: any;
if (process.env.NODE_ENV !== 'production') {
  const { createServer } = await import('vite');
  vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
}

// Fallback HTML router (Vite/Client routing)
app.use('*', async (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return next();
  }
  try {
    if (process.env.NODE_ENV !== 'production' && vite) {
      let html = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
      html = await vite.transformIndexHtml(req.originalUrl, html);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } else {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    }
  } catch (e) {
    if (process.env.NODE_ENV !== 'production' && vite) {
      vite.ssrFixStacktrace(e as Error);
    }
    next(e);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port} in ${process.env.NODE_ENV || 'development'} mode`);
});
