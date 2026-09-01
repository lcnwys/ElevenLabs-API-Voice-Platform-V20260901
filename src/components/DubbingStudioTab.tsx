import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Upload,
  Globe,
  Sparkles,
  Play,
  Pause,
  CheckCircle2,
  Clock,
  Layers,
  Film,
  Plus,
  RefreshCw,
  Download
} from 'lucide-react';
import { DubbingProject } from '../types';

interface DubbingStudioTabProps {
  language: 'zh' | 'en';
  t: any;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

export const DubbingStudioTab: React.FC<DubbingStudioTabProps> = ({ language, t, apiFetch }) => {
  const [projects, setProjects] = useState<DubbingProject[]>([]);
  const [projectName, setProjectName] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('zh');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchDubbings = async () => {
    try {
      setLoadingList(true);
      const res = await apiFetch('/api/dubbing');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.dubbings || []);
      }
    } catch (e) {
      console.error('Failed fetching dubbings:', e);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchDubbings();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      if (!projectName) {
        setProjectName(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || submitting) return;

    try {
      setSubmitting(true);
      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      formData.append('name', projectName);
      formData.append('source_lang', sourceLang);
      formData.append('target_lang', targetLang);

      const res = await apiFetch('/api/dubbing', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        setSelectedFile(null);
        setProjectName('');
        await fetchDubbings();
      }
    } catch (err) {
      console.error('Failed creating dubbing job:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="dubbing_studio_container" className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2.5">
            <Film className="h-5 w-5 text-emerald-400" />
            <span>{t.dubbing_title}</span>
          </h2>
          <p className="text-slate-400 text-xs mt-1">{t.dubbing_desc}</p>
        </div>
        <button
          onClick={fetchDubbings}
          className="p-2 bg-slate-900 border border-slate-800 hover:text-emerald-400 text-slate-400 rounded-xl transition"
          title="Refresh List"
        >
          <RefreshCw className={`h-4 w-4 ${loadingList ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Create Dubbing Project */}
        <form onSubmit={handleSubmit} className="lg:col-span-5 bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
            <Plus className="h-4 w-4 text-emerald-400" />
            <span>{t.dubbing_create_btn}</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-white mb-1.5">{t.dubbing_project_name}</label>
            <input
              type="text"
              required
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              placeholder="e.g. Q3 Product Keynote Spanish & Mandarin Localization"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-white mb-1.5">{t.dubbing_source_lang}</label>
              <select
                value={sourceLang}
                onChange={e => setSourceLang(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="auto">Auto Detect</option>
                <option value="en">English (EN)</option>
                <option value="zh">Chinese (中文)</option>
                <option value="ja">Japanese (日本語)</option>
                <option value="es">Spanish (ES)</option>
                <option value="de">German (DE)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1.5">{t.dubbing_target_langs}</label>
              <select
                value={targetLang}
                onChange={e => setTargetLang(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="zh">Chinese (中文普通话)</option>
                <option value="es">Spanish (Español)</option>
                <option value="ja">Japanese (日本語)</option>
                <option value="fr">French (Français)</option>
                <option value="de">German (Deutsch)</option>
                <option value="pt">Portuguese (Português)</option>
                <option value="en">English (EN)</option>
              </select>
            </div>
          </div>

          {/* File Upload Box */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 bg-slate-950 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition space-y-2"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="video/*,audio/*"
              className="hidden"
            />
            <Video className="h-5 w-5 text-emerald-400" />
            <span className="text-xs font-semibold text-white">
              {selectedFile ? selectedFile.name : t.dubbing_upload_video}
            </span>
            <span className="text-[10px] text-slate-500">Supports MP4, MOV, MKV, MP3, WAV</span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <Sparkles className={`h-4 w-4 ${submitting ? 'animate-spin' : ''}`} />
            <span>{submitting ? 'Submitting to Dubbing Engine...' : t.dubbing_submit_btn}</span>
          </button>
        </form>

        {/* Right Column: Active Dubbing Projects */}
        <div className="lg:col-span-7 bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-400" />
              <span>{language === 'zh' ? '多语言配音项目流水线' : 'Dubbing Localization Pipelines'} ({projects.length})</span>
            </span>
          </h3>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {projects.map(proj => (
              <div
                key={proj.dubbing_id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 transition hover:border-emerald-500/30"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">{proj.name}</h4>
                    <span className="text-[10px] font-mono text-slate-500">ID: {proj.dubbing_id}</span>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1 ${
                      proj.status === 'dubbed'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse'
                    }`}
                  >
                    {proj.status === 'dubbed' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    <span>{proj.status === 'dubbed' ? t.dubbing_status_dubbed : t.dubbing_status_dubbing}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">Target Languages:</span>
                  <div className="flex gap-1.5">
                    {proj.target_languages.map(lang => (
                      <span key={lang} className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-[11px] font-mono text-emerald-400 uppercase">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>

                {proj.status === 'dubbed' && (
                  <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">Master Rendered with Voice Clone</span>
                    <button
                      onClick={() => alert(`Downloading localized media master for ${proj.name}`)}
                      className="px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 text-emerald-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>{language === 'zh' ? '下载多语种母带' : 'Download Localized Media'}</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
