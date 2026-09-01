import React, { useState, useEffect, useRef } from 'react';
import { 
  Music, 
  Play, 
  Pause, 
  Download, 
  Sparkles, 
  Sliders, 
  Volume2, 
  Layers, 
  Radio, 
  Clock, 
  Disc, 
  RefreshCw, 
  Activity, 
  CheckCircle2, 
  FileAudio, 
  Music2, 
  Settings2,
  Share2,
  Mic,
  SlidersHorizontal,
  ChevronRight,
  ListMusic
} from 'lucide-react';
import { MusicGenerationParams, MusicTrackResult } from '../types';

interface MusicStudioTabProps {
  onNotify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  apiKeyConfigured?: boolean;
}

export const MusicStudioTab: React.FC<MusicStudioTabProps> = ({ onNotify, apiKeyConfigured }) => {
  const [params, setParams] = useState<MusicGenerationParams>({
    prompt: 'Cinematic cyberpunk synthwave with driving bassline, retro arpeggios, and neon atmospheric pads',
    model_id: 'music_v2',
    genre: 'Synthwave',
    mood: 'Energetic',
    duration_seconds: 30,
    is_instrumental: true,
    lyrics: '',
    tempo_bpm: 128,
    key_signature: 'A Minor',
    stems_enabled: true
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTrack, setActiveTrack] = useState<MusicTrackResult | null>(null);
  const [trackHistory, setTrackHistory] = useState<MusicTrackResult[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [activeStemSolo, setActiveStemSolo] = useState<'master' | 'drums' | 'bass' | 'melody' | 'vocals'>('master');
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stemAudioRef = useRef<HTMLAudioElement | null>(null);

  const genres = [
    'Synthwave', 'Cinematic Orchestral', 'Lofi Hip Hop', 'EDM / Dance', 
    'Acoustic Folk', 'Rock / Indie', 'Ambient Soundscape', 'Cyberpunk', 'Jazz / Blues'
  ];

  const moods = [
    'Energetic', 'Epic & Majestic', 'Chill & Relaxing', 'Dark & Atmospheric', 
    'Uplifting', 'Melancholic', 'Suspenseful', 'Dreamy'
  ];

  const presets = [
    {
      title: 'Neon Cyberpunk Pursuit',
      genre: 'Cyberpunk',
      mood: 'Energetic',
      bpm: 135,
      prompt: 'High-octane cyberpunk chase scene with aggressive distorted synth bass, fast breakbeats, and glitchy arpeggios',
      instrumental: true
    },
    {
      title: 'Epic Fantasy Odyssey',
      genre: 'Cinematic Orchestral',
      mood: 'Epic & Majestic',
      bpm: 88,
      prompt: 'Sweeping orchestral fantasy soundtrack with soaring brass, lush cello sections, and triumphant timpani rolls',
      instrumental: true
    },
    {
      title: 'Midnight Lofi Study Cafe',
      genre: 'Lofi Hip Hop',
      mood: 'Chill & Relaxing',
      bpm: 82,
      prompt: 'Warm dusty vinyl lofi beat with gentle Rhodes piano chords, mellow jazz bass, and relaxing ambient rain textures',
      instrumental: true
    },
    {
      title: 'Commercial Luxury Groove',
      genre: 'Synthwave',
      mood: 'Uplifting',
      bpm: 120,
      prompt: 'Sleek premium brand commercial music with melodic house percussion, punchy funk bass, and shimmering guitar strums',
      instrumental: true
    }
  ];

  // Fetch initial tracks
  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    try {
      const res = await fetch('/api/music/tracks');
      if (res.ok) {
        const data = await res.json();
        if (data.tracks && data.tracks.length > 0) {
          setTrackHistory(data.tracks);
          if (!activeTrack) {
            setActiveTrack(data.tracks[0]);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load music tracks:', e);
    }
  };

  const handleGenerate = async () => {
    if (!params.prompt.trim()) {
      onNotify?.('请输入音乐创作提示词 (Prompt)', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/music/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Generation failed' }));
        throw new Error(err.error || 'Failed to generate music');
      }

      const data = await res.json();
      if (data.track) {
        setActiveTrack(data.track);
        setTrackHistory(prev => [data.track, ...prev.filter(t => t.id !== data.track.id)]);
        onNotify?.(`音乐创作成功！耗时 ${(data.track.latency_ms / 1000).toFixed(2)}s`, 'success');
        
        // Auto play
        if (audioRef.current) {
          audioRef.current.src = data.track.audio_url;
          audioRef.current.play().catch(() => {});
          setIsPlaying(true);
        }
      }
    } catch (err: any) {
      onNotify?.(err.message || '生成失败，请检查设置', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      if (stemAudioRef.current) stemAudioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      if (stemAudioRef.current && activeStemSolo !== 'master') {
        stemAudioRef.current.play().catch(() => {});
      }
      setIsPlaying(true);
    }
  };

  const handleStemChange = (stem: 'master' | 'drums' | 'bass' | 'melody' | 'vocals') => {
    setActiveStemSolo(stem);
    if (!activeTrack) return;

    if (stem === 'master') {
      if (audioRef.current) {
        audioRef.current.src = activeTrack.audio_url;
        if (isPlaying) audioRef.current.play().catch(() => {});
      }
    } else if (activeTrack.stems) {
      const stemUrl = stem === 'drums' ? activeTrack.stems.drums_url :
                      stem === 'bass' ? activeTrack.stems.bass_url :
                      stem === 'melody' ? activeTrack.stems.melody_url :
                      activeTrack.stems.vocals_url;

      if (stemUrl && audioRef.current) {
        audioRef.current.src = stemUrl;
        if (isPlaying) audioRef.current.play().catch(() => {});
      }
    }
  };

  return (
    <div className="space-y-6" id="music-studio-container">
      {/* Hidden Audio Elements */}
      <audio 
        ref={audioRef} 
        onTimeUpdate={() => {
          if (audioRef.current) {
            const pct = (audioRef.current.currentTime / (audioRef.current.duration || 1)) * 100;
            setCurrentProgress(pct);
          }
        }}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/40 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 shadow-inner">
            <Music2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">ElevenLabs Music Studio</h2>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                Music v2 Engine
              </span>
            </div>
            <p className="text-sm text-slate-300 mt-0.5">
              端到端多轨立体声 AI 音乐生成与分轨伴奏分离系统 (Stem Separation & Arrangement)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>44.1kHz Studio Master</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-900/60 border border-indigo-700/50 text-xs text-indigo-200">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>分轨提取 (Drums/Bass/Melody)</span>
          </div>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Music Composer Parameters (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h3 className="font-semibold text-slate-900 text-base">音乐创作提示词 (Prompt & Lyrics)</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">模型版本:</span>
                <select
                  value={params.model_id}
                  onChange={(e) => setParams({ ...params, model_id: e.target.value as any })}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="music_v2">Eleven Music v2 (多轨高保真)</option>
                  <option value="music_v1">Eleven Music v1 (经典版)</option>
                </select>
              </div>
            </div>

            {/* Prompt Textarea */}
            <div>
              <textarea
                value={params.prompt}
                onChange={(e) => setParams({ ...params, prompt: e.target.value })}
                rows={3}
                placeholder="描述你想要生成的音乐风格、乐器配器、旋律走向与情绪氛围..."
                className="w-full p-3.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none shadow-inner"
              />
            </div>

            {/* Quick Inspiration Presets */}
            <div>
              <div className="text-xs font-medium text-slate-500 mb-2">💡 灵感预设 (一键载入):</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {presets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setParams({
                        ...params,
                        prompt: preset.prompt,
                        genre: preset.genre,
                        mood: preset.mood,
                        tempo_bpm: preset.bpm,
                        is_instrumental: preset.instrumental
                      });
                      onNotify?.(`已载入「${preset.title}」预设`, 'info');
                    }}
                    className="p-2.5 text-left rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-indigo-50/80 hover:border-indigo-200 transition-all group"
                  >
                    <div className="text-xs font-semibold text-slate-800 group-hover:text-indigo-700 truncate">
                      {preset.title}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                      <span>{preset.genre}</span>
                      <span>•</span>
                      <span>{preset.bpm} BPM</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Style & Arrangement Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              {/* Genre Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">音乐流派 (Genre)</label>
                <select
                  value={params.genre}
                  onChange={(e) => setParams({ ...params, genre: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {genres.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Mood Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">情绪色彩 (Mood)</label>
                <select
                  value={params.mood}
                  onChange={(e) => setParams({ ...params, mood: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {moods.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Duration Slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                  <span>生成时长 (Duration)</span>
                  <span className="text-indigo-600 font-mono">{params.duration_seconds} 秒</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={120}
                  step={5}
                  value={params.duration_seconds}
                  onChange={(e) => setParams({ ...params, duration_seconds: Number(e.target.value) })}
                  className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>10s 短曲</span>
                  <span>60s 标准</span>
                  <span>120s 完整段落</span>
                </div>
              </div>

              {/* Tempo / BPM Slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                  <span>节拍速度 (Tempo)</span>
                  <span className="text-indigo-600 font-mono">{params.tempo_bpm} BPM</span>
                </div>
                <input
                  type="range"
                  min={60}
                  max={180}
                  step={2}
                  value={params.tempo_bpm}
                  onChange={(e) => setParams({ ...params, tempo_bpm: Number(e.target.value) })}
                  className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>60 舒缓</span>
                  <span>120 流行</span>
                  <span>180 激昂</span>
                </div>
              </div>
            </div>

            {/* Vocal / Instrumental & Stems Options */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Disc className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-semibold text-slate-800">纯音乐伴奏模式 (Instrumental)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setParams({ ...params, is_instrumental: !params.is_instrumental })}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    params.is_instrumental ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                </button>
              </div>

              {!params.is_instrumental && (
                <div className="pt-2 border-t border-slate-200/60">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    AI 歌词唱词输入 (Custom Lyrics)
                  </label>
                  <textarea
                    value={params.lyrics || ''}
                    onChange={(e) => setParams({ ...params, lyrics: e.target.value })}
                    rows={2}
                    placeholder="[Verse 1] Neon lights shining bright in the dark..."
                    className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="text-xs font-semibold text-slate-800">自动分轨分离 (Stems Slicing)</span>
                    <p className="text-[11px] text-slate-500">生成独立的鼓组、贝斯、旋律与人声分轨以供后期混音</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={params.stems_enabled}
                  onChange={(e) => setParams({ ...params, stems_enabled: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>正在合成多轨高保真音乐 ({params.genre} • {params.tempo_bpm} BPM)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>生成 AI 音乐伴奏 (Generate Music)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Audio Master Player & Stems Mixer (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {activeTrack ? (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
              {/* Track Title & Metadata */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-100 text-indigo-700">
                      {activeTrack.genre}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {activeTrack.bpm} BPM • {activeTrack.key_signature || 'A Minor'}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mt-1">
                    {activeTrack.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                    {activeTrack.prompt}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                  <Disc className={`w-6 h-6 ${isPlaying ? 'animate-spin' : ''}`} />
                </div>
              </div>

              {/* Master Waveform Simulation & Progress Bar */}
              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>当前回放: {activeStemSolo.toUpperCase()}</span>
                  <span className="font-mono">{Math.floor((currentProgress / 100) * activeTrack.duration_seconds)}s / {activeTrack.duration_seconds}s</span>
                </div>

                {/* Animated Waveform Visualizer */}
                <div className="flex items-end gap-1 h-12 py-1 px-2 bg-slate-950/60 rounded-lg overflow-hidden">
                  {Array.from({ length: 36 }).map((_, i) => {
                    const barHeight = isPlaying 
                      ? Math.sin((i * 0.4) + (currentProgress * 0.1)) * 40 + 50 
                      : 20 + ((i % 5) * 12);
                    const isPassed = (i / 36) * 100 <= currentProgress;
                    return (
                      <div
                        key={i}
                        className={`flex-1 rounded-full transition-all duration-75 ${
                          isPassed ? 'bg-indigo-400' : 'bg-slate-700'
                        }`}
                        style={{ height: `${Math.max(10, barHeight)}%` }}
                      />
                    );
                  })}
                </div>

                {/* Main Transport Controls */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="w-10 h-10 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white flex items-center justify-center transition-all shadow-md cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>

                  <div className="flex items-center gap-2">
                    <a
                      href={activeTrack.audio_url}
                      download={`${activeTrack.title}.wav`}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>下载母带 (Master WAV)</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Stems Slicer & Mixer Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">分轨混音器 (Stems Mixer)</h4>
                  </div>
                  <span className="text-[11px] text-slate-400">独立试听与导出</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Master Track Button */}
                  <button
                    type="button"
                    onClick={() => handleStemChange('master')}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      activeStemSolo === 'master'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="text-xs font-semibold">全曲母带 (Master)</span>
                    </div>
                    {activeStemSolo === 'master' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    )}
                  </button>

                  {/* Drums Stem Button */}
                  <button
                    type="button"
                    onClick={() => handleStemChange('drums')}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      activeStemSolo === 'drums'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Disc className="w-3.5 h-3.5 text-rose-500" />
                      <span className="text-xs font-semibold">鼓组分轨 (Drums)</span>
                    </div>
                    {activeStemSolo === 'drums' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    )}
                  </button>

                  {/* Bass Stem Button */}
                  <button
                    type="button"
                    onClick={() => handleStemChange('bass')}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      activeStemSolo === 'bass'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs font-semibold">贝斯低音 (Bass)</span>
                    </div>
                    {activeStemSolo === 'bass' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    )}
                  </button>

                  {/* Melody Stem Button */}
                  <button
                    type="button"
                    onClick={() => handleStemChange('melody')}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      activeStemSolo === 'melody'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Music className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-xs font-semibold">主旋律 (Melody)</span>
                    </div>
                    {activeStemSolo === 'melody' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Music className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-slate-800 text-sm">暂无当前播放音轨</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                在左侧输入风格提示词或点击灵感预设，即可体验由 ElevenLabs Music 驱动的 AI 编曲生成。
              </p>
            </div>
          )}

          {/* Generated History Tracks List */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListMusic className="w-4 h-4 text-slate-700" />
                <h4 className="text-xs font-bold text-slate-900 uppercase">历史生成曲目 ({trackHistory.length})</h4>
              </div>
              <button
                type="button"
                onClick={fetchTracks}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                刷新
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {trackHistory.map((track) => (
                <div
                  key={track.id}
                  onClick={() => {
                    setActiveTrack(track);
                    if (audioRef.current) {
                      audioRef.current.src = track.audio_url;
                      audioRef.current.play().catch(() => {});
                      setIsPlaying(true);
                    }
                  }}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    activeTrack?.id === track.id
                      ? 'bg-indigo-50/70 border-indigo-300 shadow-sm'
                      : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                      {activeTrack?.id === track.id && isPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 ml-0.5" />
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-slate-900 truncate">{track.title}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span>{track.genre}</span>
                        <span>•</span>
                        <span>{track.duration_seconds}s</span>
                        <span>•</span>
                        <span className="font-mono">{track.bpm} BPM</span>
                      </div>
                    </div>
                  </div>

                  <a
                    href={track.audio_url}
                    download={`${track.title}.wav`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white transition-all shrink-0"
                    title="下载音频"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
