import React, { useState, useEffect } from 'react';
import {
  Globe,
  Search,
  Play,
  Pause,
  Plus,
  Star,
  CheckCircle2,
  Users,
  Sparkles,
  Volume2,
  Bookmark,
  Check
} from 'lucide-react';
import { SharedVoice, Voice } from '../types';

interface SharedVoiceMarketTabProps {
  language: 'zh' | 'en';
  t: any;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
  onImportVoice?: (voice: Voice) => void;
}

export const SharedVoiceMarketTab: React.FC<SharedVoiceMarketTabProps> = ({
  language,
  t,
  apiFetch,
  onImportVoice
}) => {
  const [voices, setVoices] = useState<SharedVoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioElem, setAudioElem] = useState<HTMLAudioElement | null>(null);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchSharedVoices = async () => {
      try {
        const res = await apiFetch('/api/shared-voices');
        if (res.ok) {
          const data = await res.json();
          setVoices(data.voices || []);
        }
      } catch (err) {
        console.error('Failed fetching shared voices:', err);
      }
    };
    fetchSharedVoices();
  }, []);

  const playPreview = (url?: string, id?: string) => {
    if (!url || !id) return;
    if (audioElem) {
      audioElem.pause();
    }
    if (playingId === id) {
      setPlayingId(null);
      return;
    }
    const a = new Audio(url);
    setAudioElem(a);
    setPlayingId(id);
    a.play();
    a.onended = () => setPlayingId(null);
  };

  const handleImport = (voice: SharedVoice) => {
    setImportedIds(prev => new Set([...prev, voice.voice_id]));
    if (onImportVoice) {
      onImportVoice({
        voice_id: voice.voice_id,
        name: voice.name,
        category: voice.category || 'community',
        description: voice.description,
        labels: {
          accent: voice.accent || 'neutral',
          gender: voice.gender || 'neutral',
          age: voice.age || 'middle_aged'
        },
        preview_url: voice.preview_url
      });
    }
  };

  const filtered = voices.filter(v => {
    const term = searchTerm.toLowerCase();
    return (
      v.name.toLowerCase().includes(term) ||
      (v.description && v.description.toLowerCase().includes(term)) ||
      (v.accent && v.accent.toLowerCase().includes(term)) ||
      (v.category && v.category.toLowerCase().includes(term))
    );
  });

  return (
    <div id="shared_voice_market_container" className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Globe className="h-5 w-5 text-gray-900" />
            <span>{t.market_title}</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">{t.market_desc}</p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.market_search_placeholder}
            className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black transition"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(v => {
          const isImported = importedIds.has(v.voice_id);
          const isPlaying = playingId === v.voice_id;

          return (
            <div
              key={v.voice_id}
              className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 flex flex-col justify-between hover:border-gray-300 transition"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs text-gray-800">
                      {v.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">{v.name}</h4>
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider">{v.category}</span>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-gray-500 font-medium">
                    ★ {v.rating?.toFixed(1) || '4.9'}
                  </span>
                </div>

                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                  {v.description || 'Community contributed high fidelity voice model.'}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {v.accent && (
                    <span className="px-2 py-0.5 rounded bg-gray-50 border border-gray-200 text-[10px] text-gray-600">
                      {v.accent}
                    </span>
                  )}
                  {v.gender && (
                    <span className="px-2 py-0.5 rounded bg-gray-50 border border-gray-200 text-[10px] text-gray-600">
                      {v.gender}
                    </span>
                  )}
                  {v.use_case && (
                    <span className="px-2 py-0.5 rounded bg-gray-50 border border-gray-200 text-[10px] text-gray-600">
                      {v.use_case}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100 gap-2">
                <button
                  type="button"
                  onClick={() => playPreview(v.preview_url, v.voice_id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                    isPlaying
                      ? 'bg-black text-white'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
                >
                  {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  <span>{isPlaying ? (language === 'zh' ? '暂停' : 'Pause') : (language === 'zh' ? '试听' : 'Sample')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleImport(v)}
                  disabled={isImported}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                    isImported
                      ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-default'
                      : 'bg-black hover:bg-gray-800 text-white'
                  }`}
                >
                  {isImported ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Plus className="h-3.5 w-3.5" />}
                  <span>{isImported ? (language === 'zh' ? '已添加' : 'Added') : (language === 'zh' ? '添加至音色库' : 'Add Voice')}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
