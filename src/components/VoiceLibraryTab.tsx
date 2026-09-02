import React from 'react';
import {
  Layers,
  Play,
  Trash2
} from 'lucide-react';
import { Voice } from '../types';

interface VoiceLibraryTabProps {
  language: 'zh' | 'en';
  t: any;
  voices: Voice[];
  onSelectVoice: (voiceId: string) => void;
  onDeleteVoice: (voiceId: string) => void;
}

export const VoiceLibraryTab: React.FC<VoiceLibraryTabProps> = ({
  language,
  t,
  voices,
  onSelectVoice,
  onDeleteVoice
}) => {
  return (
    <div id="voice_library_container" className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-200">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <Layers className="h-5 w-5 text-gray-900" />
          <span>{t.library_title}</span>
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">{t.library_desc}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {voices.map((voice) => (
          <div
            key={voice.voice_id}
            className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 flex flex-col justify-between hover:border-gray-300 transition shadow-sm"
          >
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{voice.name}</h3>
                  <span className="text-[10px] text-gray-400 font-mono">ID: {voice.voice_id}</span>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700 uppercase">
                  {voice.category === 'cloned' ? t.voice_cloned : voice.category === 'designed' ? t.voice_designed : t.voice_official}
                </span>
              </div>

              <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                {voice.description || t.voice_default_desc}
              </p>

              {voice.labels && Object.keys(voice.labels).length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {Object.entries(voice.labels).map(([key, val]) => (
                    <span key={key} className="px-2 py-0.5 bg-gray-50 border border-gray-200 rounded text-[10px] text-gray-600">
                      {key}: {val}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
              {voice.preview_url ? (
                <a
                  href={voice.preview_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-gray-600 hover:text-black transition flex items-center gap-1 font-medium"
                >
                  <Play className="h-3 w-3" />
                  <span>{t.voice_preview_original}</span>
                </a>
              ) : (
                <span className="text-[11px] text-gray-400">{t.voice_preview_custom}</span>
              )}

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onSelectVoice(voice.voice_id)}
                  className="px-3 py-1.5 bg-black hover:bg-gray-800 text-white font-medium text-xs rounded-lg transition"
                >
                  {t.voice_apply}
                </button>

                {(voice.category === 'cloned' || voice.category === 'designed') && (
                  <button
                    onClick={() => onDeleteVoice(voice.voice_id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition"
                    title={t.voice_delete_confirm}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
