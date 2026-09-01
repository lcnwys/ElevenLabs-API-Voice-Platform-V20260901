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
  Bookmark
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
    <div id="shared_voice_market_container" className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2.5">
            <Globe className="h-5 w-5 text-emerald-400" />
            <span>{t.market_title}</span>
          </h2>
          <p className="text-slate-400 text-xs mt-1">{t.market_desc}</p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={t.market_search_placeholder}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>
      </div>

      {/* Voice Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(v => (
          <div
            key={v.voice_id}
            className="bg-slate-900/40 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-4.5 flex flex-col justify-between space-y-4 transition"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white leading-tight">{v.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {v.accent && (
                      <span className="px-2 py-0.5 bg-slate-950 text-emerald-400 border border-slate-800 rounded text-[10px] uppercase font-mono">
                        {v.accent}
                      </span>
                    )}
                    {v.gender && (
                      <span className="px-2 py-0.5 bg-slate-950 text-slate-300 border border-slate-800 rounded text-[10px] capitalize">
                        {v.gender}
                      </span>
                    )}
                    {v.category && (
                      <span className="px-2 py-0.5 bg-slate-950 text-slate-400 border border-slate-800 rounded text-[10px] capitalize">
                        {v.category}
                      </span>
                    )}
                  </div>
                </div>

                {v.rate && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                    <Star className="h-3 w-3 fill-current" />
                    <span>{v.rate}</span>
                  </span>
                )}
              </div>

              {v.description && (
                <p className="text-xs text-slate-400 mt-2.5 line-clamp-2 leading-relaxed">
                  {v.description}
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                <Users className="h-3 w-3" />
                <span>{(v.usage_characters_count || 5000000).toLocaleString()} {t.text_count}</span>
              </span>

              <button
                onClick={() => handleImport(v)}
                disabled={importedIds.has(v.voice_id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                  importedIds.has(v.voice_id)
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 hover:bg-emerald-600 hover:text-slate-950 text-white'
                }`}
              >
                {importedIds.has(v.voice_id) ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{language === 'zh' ? '已添加到工作空间' : 'Imported'}</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    <span>{t.market_use_voice}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
