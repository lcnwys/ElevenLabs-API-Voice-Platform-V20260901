import React, { useState } from 'react';
import {
  Wand2,
  Sparkles,
  Play,
  Pause,
  Download,
  Sliders,
  Volume2,
  Clock,
  Zap,
  RotateCcw,
  AudioWaveform
} from 'lucide-react';
import { SoundEffectItem } from '../types';

interface SoundEffectsTabProps {
  language: 'zh' | 'en';
  t: any;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

export const SoundEffectsTab: React.FC<SoundEffectsTabProps> = ({ language, t, apiFetch }) => {
  const [prompt, setPrompt] = useState(
    language === 'zh'
      ? '电影级重金属舱门在太空中缓缓关闭，伴随低频气阀释放'
      : 'Cinematic heavy metal airlock closing in space with sub-bass decompression'
  );
  const [duration, setDuration] = useState(3.5);
  const [promptInfluence, setPromptInfluence] = useState(0.3);
  const [generating, setGenerating] = useState(false);
  const [history, setHistory] = useState<SoundEffectItem[]>([]);
  const [activeAudioUrl, setActiveAudioUrl] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioElem, setAudioElem] = useState<HTMLAudioElement | null>(null);

  const presets = language === 'zh' ? [
    { label: '🚀 太空舱门关闭', text: '电影级重金属舱门在太空中缓缓关闭，伴随低频气阀释放与机械回响' },
    { label: '⚡ 高能激光充能', text: '科幻粒子加速武器高能充能与瞬时冲击波爆发音效' },
    { label: '🍂 森林落叶漫步', text: '秋日阳光下踩在干燥松脆落叶上的清脆脚步声与微风' },
    { label: '✨ 奇幻魔法治愈', text: '清澈如水晶般的水滴回响与轻柔闪烁的治愈魔法咒语辉光' },
    { label: '🏎️ 超跑极速漂移', text: '超跑赛车轮胎在湿滑柏油路面上高速过弯漂移的摩擦尖叫' }
  ] : [
    { label: '🚀 Sci-fi Airlock', text: 'Cinematic heavy metal airlock closing in space with sub-bass decompression' },
    { label: '⚡ Plasma Blaster', text: 'Sci-fi energy weapon charging up followed by explosive laser pulse' },
    { label: '🍂 Autumn Steps', text: 'Gentle footsteps crunching on crisp autumn dry leaves in a serene forest' },
    { label: '✨ Magical Shimmer', text: 'Sparkling celestial magic healing spell with crystalline harmonic resonance' },
    { label: '🏎️ Supercar Drift', text: 'High-speed supercar tire screeching drift on asphalt corner with engine roar' }
  ];

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || generating) return;

    try {
      setGenerating(true);
      const res = await apiFetch('/api/sound-effects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: prompt,
          duration_seconds: duration,
          prompt_influence: promptInfluence
        })
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const newItem: SoundEffectItem = {
          id: `sfx_${Date.now()}`,
          text: prompt,
          duration_seconds: duration,
          audioUrl: url,
          created_at: Date.now()
        };
        setHistory(prev => [newItem, ...prev]);
        setActiveAudioUrl(url);
        playAudio(url, newItem.id);
      }
    } catch (err) {
      console.error('Failed generating sound effect:', err);
    } finally {
      setGenerating(false);
    }
  };

  const playAudio = (url: string, id: string) => {
    if (audioElem) {
      audioElem.pause();
    }
    const a = new Audio(url);
    setAudioElem(a);
    setPlayingId(id);
    a.play();
    a.onended = () => setPlayingId(null);
  };

  const stopAudio = () => {
    if (audioElem) {
      audioElem.pause();
    }
    setPlayingId(null);
  };

  return (
    <div id="sfx_studio_container" className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2.5">
          <Wand2 className="h-5 w-5 text-emerald-400" />
          <span>{t.sfx_title}</span>
        </h2>
        <p className="text-slate-400 text-xs mt-1">{t.sfx_desc}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls */}
        <form onSubmit={handleGenerate} className="lg:col-span-7 space-y-5 bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
          {/* Preset chips */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              {t.sfx_presets_label}
            </span>
            <div className="flex flex-wrap gap-2">
              {presets.map((p, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setPrompt(p.text)}
                  className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-300 rounded-xl transition cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt textarea */}
          <div>
            <label className="block text-xs font-semibold text-white mb-2 flex items-center justify-between">
              <span>{t.sfx_prompt_label}</span>
              <span className="text-[11px] text-slate-500 font-normal">{prompt.length} chars</span>
            </label>
            <textarea
              rows={3}
              required
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={t.sfx_prompt_placeholder}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Sliders: Duration & Prompt Influence */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{t.sfx_duration_label}</span>
                </span>
                <span className="font-mono text-emerald-400 font-bold">{duration.toFixed(1)} {t.sfx_duration_sec}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="15.0"
                step="0.5"
                value={duration}
                onChange={e => setDuration(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0.5s</span>
                <span>7.5s</span>
                <span>15.0s</span>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-850 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{t.sfx_influence_label}</span>
                </span>
                <span className="font-mono text-emerald-400 font-bold">{Math.round(promptInfluence * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={promptInfluence}
                onChange={e => setPromptInfluence(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Creativity (10%)</span>
                <span>Strict (100%)</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={generating}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:scale-[0.99] text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-950/20 disabled:opacity-50"
          >
            <Sparkles className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
            <span>{generating ? (language === 'zh' ? '正在渲染高拟真音效...' : 'Synthesizing Sound Effect...') : t.sfx_generate_btn}</span>
          </button>
        </form>

        {/* Right Column: Generation History & Playback */}
        <div className="lg:col-span-5 bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-emerald-400" />
              <span>{language === 'zh' ? '已生成的音效库' : 'Generated FX Library'} ({history.length})</span>
            </span>
          </h3>

          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 space-y-2 text-center">
              <Wand2 className="h-8 w-8 text-slate-700" />
              <p className="text-xs">{language === 'zh' ? '输入提示词并点击生成，即刻在右侧试听与下载。' : 'Enter prompt and click generate to audition and download.'}</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {history.map(item => (
                <div
                  key={item.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2.5 transition hover:border-emerald-500/30"
                >
                  <p className="text-xs text-white font-medium line-clamp-2 leading-relaxed">
                    "{item.text}"
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-xs">
                    <span className="text-[11px] text-slate-500 font-mono">
                      {item.duration_seconds.toFixed(1)}s • MP3 / WAV
                    </span>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => (playingId === item.id ? stopAudio() : playAudio(item.audioUrl, item.id))}
                        className="px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-500/25 transition"
                      >
                        {playingId === item.id ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 fill-current" />}
                        <span>{playingId === item.id ? 'Pause' : 'Play'}</span>
                      </button>

                      <a
                        href={item.audioUrl}
                        download={`sound_effect_${item.id}.wav`}
                        className="p-1.5 bg-slate-900 border border-slate-800 hover:text-emerald-400 text-slate-400 rounded-lg transition"
                        title="Download Audio"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
