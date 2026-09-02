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
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

export const MusicStudioTab: React.FC<MusicStudioTabProps> = ({ onNotify, apiKeyConfigured, apiFetch }) => {
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
    }
  ];

  const handleGenerate = async () => {
    if (!params.prompt.trim()) return;
    try {
      setIsGenerating(true);
      const res = await apiFetch('/api/music/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (res.ok) {
        const data = await res.json();
        setActiveTrack(data.track);
        setTrackHistory(prev => [data.track, ...prev]);
        if (onNotify) onNotify('音乐生成完成！', 'success');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  return (
    <div id="music_studio_container" className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      <audio
        ref={audioRef}
        src={activeTrack?.audio_url}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentProgress((audioRef.current.currentTime / audioRef.current.duration) * 100 || 0);
          }
        }}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />

      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <Music2 className="h-5 w-5 text-gray-900" />
          <span>AI 音乐与原声生成 (Music Studio)</span>
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          根据自然语言提示词生成全声道立体声管弦乐、电子乐或独立分轨伴奏。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                音乐描述提示词 (Music Prompt)
              </label>
              <textarea
                rows={3}
                value={params.prompt}
                onChange={e => setParams({ ...params, prompt: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-lg p-3 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black resize-none leading-relaxed"
                placeholder="Describe genre, instruments, atmosphere, tempo..."
              />
            </div>

            {/* Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-gray-500">快速预设灵感:</span>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setParams({
                      ...params,
                      prompt: preset.prompt,
                      genre: preset.genre,
                      mood: preset.mood,
                      tempo_bpm: preset.bpm,
                      is_instrumental: preset.instrumental
                    })}
                    className="px-2.5 py-1 rounded-md text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 transition"
                  >
                    {preset.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Selectors Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">音乐流派</label>
                <select
                  value={params.genre}
                  onChange={e => setParams({ ...params, genre: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-black"
                >
                  {genres.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">情绪色彩</label>
                <select
                  value={params.mood}
                  onChange={e => setParams({ ...params, mood: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-black"
                >
                  {moods.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                  <span>时长 (秒)</span>
                  <span className="font-mono">{params.duration_seconds}s</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={120}
                  step={5}
                  value={params.duration_seconds}
                  onChange={e => setParams({ ...params, duration_seconds: Number(e.target.value) })}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                  <span>节奏 (BPM)</span>
                  <span className="font-mono">{params.tempo_bpm} BPM</span>
                </div>
                <input
                  type="range"
                  min={60}
                  max={180}
                  step={2}
                  value={params.tempo_bpm}
                  onChange={e => setParams({ ...params, tempo_bpm: Number(e.target.value) })}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !params.prompt.trim()}
              className="w-full bg-black hover:bg-gray-800 text-white font-medium text-xs py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>正在合成多轨高保真音乐 ({params.genre} • {params.tempo_bpm} BPM)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>开始生成音乐 (Generate Track)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Player & Stems */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm h-full flex flex-col justify-between">
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">音乐输出与分轨控制</h3>

            {activeTrack ? (
              <div className="space-y-4 my-auto">
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-1">
                  <h4 className="text-sm font-semibold text-gray-900">{activeTrack.title}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
                    <span>{activeTrack.genre}</span>
                    <span>•</span>
                    <span>{activeTrack.tempo_bpm} BPM</span>
                    <span>•</span>
                    <span>{activeTrack.duration_seconds}s</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <audio src={activeTrack.audio_url} controls className="w-full" />
                </div>

                <a
                  href={activeTrack.audio_url}
                  download={`elevenlabs-music-${activeTrack.id}.mp3`}
                  className="w-full bg-black hover:bg-gray-800 text-white font-medium text-xs py-2.5 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span>下载完整母带音频 (Master Audio)</span>
                </a>
              </div>
            ) : (
              <div className="my-auto py-12 text-center text-gray-400 space-y-2">
                <Disc className="h-8 w-8 mx-auto stroke-1" />
                <p className="text-xs">配置参数并点击生成以在此预览音乐</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
