import React, { useState, useEffect } from 'react';
import {
  Wand2,
  Sparkles,
  Play,
  Pause,
  Download,
  Volume2,
  Clock,
  Zap,
  RotateCcw,
  AudioWaveform,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Layers,
  Flame,
  Radio,
  Music,
  Share2
} from 'lucide-react';
import { SoundEffectItem } from '../types';

interface SoundEffectsTabProps {
  language: 'zh' | 'en';
  t: any;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

interface TestSample {
  id: string;
  category: string;
  name: string;
  desc: string;
  prompt: string;
  duration: number;
  influence: number;
}

export const SoundEffectsTab: React.FC<SoundEffectsTabProps> = ({ language, t, apiFetch }) => {
  const [prompt, setPrompt] = useState(
    language === 'zh'
      ? '科幻粒子加速武器高能充能与瞬时冲击波爆发音效'
      : 'Sci-fi energy weapon charging up followed by explosive laser pulse'
  );
  const [duration, setDuration] = useState(3.5);
  const [promptInfluence, setPromptInfluence] = useState(0.3);
  const [generating, setGenerating] = useState(false);
  const [history, setHistory] = useState<SoundEffectItem[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioElem, setAudioElem] = useState<HTMLAudioElement | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Pre-rendered test sound effect library for instant testing
  const testSamples: TestSample[] = [
    {
      id: 'test_scifi_door',
      category: language === 'zh' ? '科幻机械' : 'Sci-Fi',
      name: language === 'zh' ? '🚀 太空舱门气动关闭' : '🚀 Sci-Fi Airlock Close',
      desc: language === 'zh' ? '重金属舱门液压闭合与低频减压回声' : 'Heavy metal door closing with hydraulic sub decompression',
      prompt: language === 'zh' ? '电影级重金属舱门在太空中缓缓关闭，伴随低频气阀释放与机械回响' : 'Cinematic heavy metal airlock closing in space with sub-bass decompression',
      duration: 3.5,
      influence: 0.35,
    },
    {
      id: 'test_laser_pulse',
      category: language === 'zh' ? '科幻机械' : 'Sci-Fi',
      name: language === 'zh' ? '⚡ 高能激光充能爆发' : '⚡ Plasma Blaster Pulse',
      desc: language === 'zh' ? '粒子加速武器蓄力蜂鸣与光束发射' : 'Energy weapon charging hum followed by concentrated laser burst',
      prompt: language === 'zh' ? '科幻粒子加速武器高能充能与瞬时冲击波爆发音效' : 'Sci-fi energy weapon charging up followed by explosive laser pulse',
      duration: 2.5,
      influence: 0.4,
    },
    {
      id: 'test_forest_walk',
      category: language === 'zh' ? '自然环境' : 'Nature & Foley',
      name: language === 'zh' ? '🍂 森林落叶漫步脚步' : '🍂 Autumn Forest Steps',
      desc: language === 'zh' ? '脚踩干燥松脆落叶的清脆沙沙声' : 'Gentle footsteps crunching on dry autumn foliage',
      prompt: language === 'zh' ? '秋日阳光下踩在干燥松脆落叶上的清脆脚步声与微风' : 'Gentle footsteps crunching on crisp autumn dry leaves in a serene forest',
      duration: 4.0,
      influence: 0.3,
    },
    {
      id: 'test_magic_heal',
      category: language === 'zh' ? '奇幻魔法' : 'Magic & Fantasy',
      name: language === 'zh' ? '✨ 奇幻水晶治愈辉光' : '✨ Celestial Magic Shimmer',
      desc: language === 'zh' ? '清澈水滴泛音与治愈魔法和声' : 'Sparkling harmonic resonance and soothing magic chimes',
      prompt: language === 'zh' ? '清澈如水晶般的水滴回响与轻柔闪烁的治愈魔法咒语辉光' : 'Sparkling celestial magic healing spell with crystalline harmonic resonance',
      duration: 3.0,
      influence: 0.45,
    },
    {
      id: 'test_car_drift',
      category: language === 'zh' ? '载具竞速' : 'Vehicles',
      name: language === 'zh' ? '🏎️ 超跑极速沥青漂移' : '🏎️ Supercar Asphalt Drift',
      desc: language === 'zh' ? '赛车轮胎过弯强烈摩擦声与引擎轰鸣' : 'High-speed tire screech and roaring turbocharged engine',
      prompt: language === 'zh' ? '超跑赛车轮胎在湿滑柏油路面上高速过弯漂移的摩擦尖叫' : 'High-speed supercar tire screeching drift on asphalt corner with engine roar',
      duration: 3.5,
      influence: 0.3,
    },
    {
      id: 'test_ocean_wave',
      category: language === 'zh' ? '自然环境' : 'Nature & Foley',
      name: language === 'zh' ? '🌊 礁石深海拍击巨浪' : '🌊 Ocean Wave Rock Crash',
      desc: language === 'zh' ? '深邃海浪撞击岸边礁石与水花飞溅' : 'Heavy ocean swell crashing against sea rocks with foam spray',
      prompt: language === 'zh' ? '深邃海浪拍击岸边岩石的低频轰鸣与泡沫消散立体声音效' : 'Deep ocean waves crashing against rocky shoreline with foam resonance',
      duration: 4.5,
      influence: 0.3,
    },
    {
      id: 'test_ui_chime',
      category: language === 'zh' ? 'UI 交互' : 'UI & Digital',
      name: language === 'zh' ? '🔔 未来科技交互确认' : '🔔 Futuristic UI Confirm',
      desc: language === 'zh' ? '清脆高科技界面点击完成反馈' : 'Crisp minimalist tech interface success chime',
      prompt: language === 'zh' ? '未来科技全息界面成功确认与操作反馈微音效' : 'Modern minimalist holographic UI positive confirmation chime',
      duration: 1.2,
      influence: 0.5,
    }
  ];

  const stopAllAudio = () => {
    if (audioElem) {
      audioElem.pause();
      setAudioElem(null);
    }
    setPlayingId(null);
  };

  const playAudioUrl = (url: string, id: string) => {
    stopAllAudio();
    if (playingId === id) {
      return;
    }
    const a = new Audio(url);
    setAudioElem(a);
    setPlayingId(id);
    a.play().catch(e => console.error('Audio play error:', e));
    a.onended = () => setPlayingId(null);
  };

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
        playAudioUrl(url, newItem.id);
      }
    } catch (err) {
      console.error('Failed generating sound effect:', err);
    } finally {
      setGenerating(false);
    }
  };

  const applyPreset = (sample: TestSample) => {
    setPrompt(sample.prompt);
    setDuration(sample.duration);
    setPromptInfluence(sample.influence);
  };

  // Safe localized labels
  const titleText = t?.sfx_title || (language === 'zh' ? 'AI 影视音效生成中心 (Sound Effects Studio)' : 'AI Sound Effects Studio');
  const descText = t?.sfx_desc || (language === 'zh' ? '利用 ElevenLabs 自然语言音频生成大模型，输入音效描述文字生成电影级、科幻、自然界或 UI 交互拟真音效。' : 'Generate cinematic, sci-fi, organic, or ambient Foley sound effects from natural language text prompts.');
  const promptLabel = t?.sfx_prompt_label || (language === 'zh' ? '音效描述提示词 (Prompt)' : 'Sound Effect Prompt');
  const promptPlaceholder = t?.sfx_prompt_placeholder || (language === 'zh' ? '例如：电影级重金属舱门在太空中关闭伴随低频气阀释放、科幻高能激光武器充能冲击波...' : 'e.g. Cinematic heavy metal vault door closing in space, sci-fi laser recharge...');
  const durationLabel = t?.sfx_duration || t?.sfx_duration_label || (language === 'zh' ? '音效目标时长' : 'Target Duration');
  const influenceLabel = t?.sfx_prompt_influence || t?.sfx_influence_label || (language === 'zh' ? '提示词遵循权重' : 'Prompt Influence');
  const presetsTitle = t?.sfx_presets_title || t?.sfx_presets_label || (language === 'zh' ? '推荐音效灵感模板 (点击套用)' : 'Sound FX Inspiration Presets (Click to Apply)');
  const generateBtnText = generating 
    ? (t?.sfx_btn_generating || (language === 'zh' ? '正在神经网络合成音效中...' : 'Synthesizing Sound Effect...'))
    : (t?.sfx_btn_generate || t?.sfx_generate_btn || (language === 'zh' ? '立即生成高品质影视音效' : 'Generate High-Fidelity Sound Effect'));
  const testSectionTitle = t?.sfx_test_samples_title || (language === 'zh' ? '内置音效测试试听库 (无需等待即可秒级体验)' : 'Pre-rendered Test Sound FX Library');
  const historyTitle = t?.sfx_history_title || (language === 'zh' ? '音效生成历史与产物试听' : 'Sound Effects Generation History');

  const categories = language === 'zh' 
    ? ['全部', '科幻机械', '自然环境', '奇幻魔法', '载具竞速', 'UI 交互']
    : ['All', 'Sci-Fi', 'Nature & Foley', 'Magic & Fantasy', 'Vehicles', 'UI & Digital'];

  const filteredSamples = activeCategory === 'all' || activeCategory === '全部' || activeCategory === 'All'
    ? testSamples
    : testSamples.filter(s => s.category.toLowerCase().includes(activeCategory.toLowerCase()) || activeCategory.includes(s.category));

  return (
    <div id="sound_effects_studio_container" className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-gray-900" />
          <span>{titleText}</span>
        </h2>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{descText}</p>
      </div>

      {/* Main Generator Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5 shadow-sm">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                <Volume2 className="h-3.5 w-3.5 text-gray-700" />
                <span>{promptLabel}</span>
              </label>
              <span className="text-[11px] text-gray-400 font-mono">{prompt.length} 字符</span>
            </div>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={promptPlaceholder}
              className="w-full bg-white border border-gray-200 rounded-lg p-3 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black resize-none leading-relaxed transition"
            />
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-600 flex items-center gap-1">
                <Zap className="h-3 w-3 text-amber-500" />
                <span>{presetsTitle}:</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {testSamples.slice(0, 5).map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => applyPreset(sample)}
                  className="px-3 py-1.5 rounded-lg text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 transition flex items-center gap-1.5 hover:border-gray-300 shadow-2xs"
                >
                  <span>{sample.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-gray-100">
            <div className="bg-gray-50/70 border border-gray-100 rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center text-xs font-medium text-gray-700">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-gray-500" />
                  <span>{durationLabel}:</span>
                </span>
                <span className="font-mono text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200 font-semibold">{duration}s</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="22"
                step="0.5"
                value={duration}
                onChange={(e) => setDuration(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
              />
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>0.5s (短音效)</span>
                <span>10s</span>
                <span>22s (超长环境音)</span>
              </div>
            </div>

            <div className="bg-gray-50/70 border border-gray-100 rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center text-xs font-medium text-gray-700">
                <span className="flex items-center gap-1">
                  <Sliders className="h-3.5 w-3.5 text-gray-500" />
                  <span>{influenceLabel}:</span>
                </span>
                <span className="font-mono text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200 font-semibold">{Math.round(promptInfluence * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={promptInfluence}
                onChange={(e) => setPromptInfluence(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
              />
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>10% (自由发挥)</span>
                <span>30% (官方推荐)</span>
                <span>100% (强提示词对齐)</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={generating || !prompt.trim()}
            className="w-full bg-black hover:bg-gray-800 text-white font-semibold text-xs py-3.5 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            {generating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>{generateBtnText}</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>{generateBtnText}</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Instant Test Samples Section (Instant Audio Playground) */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <AudioWaveform className="h-4 w-4 text-gray-700" />
              <span>{testSectionTitle}</span>
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {language === 'zh' ? '点击“试听”直接播放预渲染音效波形，点击“套用”可将该提示词填入上方' : 'Click "Play" to listen immediately or "Apply" to load prompt into editor'}
            </p>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap gap-1">
            {categories.map((cat, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                  (activeCategory === cat || (idx === 0 && activeCategory === 'all'))
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredSamples.map((sample) => {
            const isPlaying = playingId === sample.id;
            return (
              <div
                key={sample.id}
                className={`border rounded-lg p-3.5 transition flex flex-col justify-between gap-2.5 ${
                  isPlaying ? 'bg-amber-50/50 border-amber-300' : 'bg-gray-50/50 border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900">{sample.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-200/60 text-gray-600">
                      {sample.category} • {sample.duration}s
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 line-clamp-1">{sample.desc}</p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-gray-200/50">
                  <button
                    type="button"
                    onClick={() => setPrompt(sample.prompt)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                      isPlaying
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-black hover:bg-gray-800 text-white'
                    }`}
                  >
                    {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    <span>{isPlaying ? (language === 'zh' ? '暂停' : 'Pause') : (language === 'zh' ? '试听测试' : 'Play Test')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset(sample)}
                    className="px-2.5 py-1.5 rounded-md text-xs bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 font-medium transition flex items-center gap-1"
                  >
                    <Wand2 className="h-3 w-3 text-gray-500" />
                    <span>{language === 'zh' ? '套用此配置' : 'Apply Preset'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Generated Audio History */}
      {history.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-gray-500" />
            <span>{historyTitle}</span>
          </h3>
          <div className="space-y-2">
            {history.map((item) => {
              const isPlaying = playingId === item.id;
              return (
                <div
                  key={item.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:border-gray-300 transition"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-900 line-clamp-1">{item.text}</p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                      <span>{item.duration_seconds}s</span>
                      <span>•</span>
                      <span>{new Date(item.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => playAudioUrl(item.audioUrl, item.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                        isPlaying ? 'bg-black text-white' : 'bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800'
                      }`}
                    >
                      {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                      <span>{isPlaying ? (language === 'zh' ? '暂停' : 'Pause') : (language === 'zh' ? '播放' : 'Play')}</span>
                    </button>

                    <a
                      href={item.audioUrl}
                      download={`elevenlabs-sfx-${item.id}.mp3`}
                      className="p-1.5 text-gray-400 hover:text-black transition"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
