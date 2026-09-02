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
    <div id="dubbing_studio_container" className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Film className="h-5 w-5 text-gray-900" />
            <span>{t.dubbing_title}</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">{t.dubbing_desc}</p>
        </div>

        <button
          onClick={fetchDubbings}
          disabled={loadingList}
          className="p-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 rounded-lg transition"
        >
          <RefreshCw className={`h-4 w-4 ${loadingList ? 'animate-spin text-black' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Create Dubbing Job */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{t.dubbing_new_job_title}</h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{t.dubbing_project_name}</label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. 商业发布会视频配音"
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-black"
                />
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 hover:border-gray-400 bg-gray-50 hover:bg-gray-100/60 rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-1.5"
              >
                <Upload className="h-6 w-6 text-gray-400" />
                <div className="text-xs font-medium text-gray-700">
                  {selectedFile ? selectedFile.name : (language === 'zh' ? '选择视频或音频源文件' : 'Select video or audio file')}
                </div>
                <p className="text-[10px] text-gray-400">MP4, MKV, MOV, MP3 (Max 500MB)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*,audio/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t.dubbing_source_lang}</label>
                  <select
                    value={sourceLang}
                    onChange={(e) => setSourceLang(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-black"
                  >
                    <option value="auto">{t.dubbing_lang_auto}</option>
                    <option value="en">English</option>
                    <option value="zh">中文</option>
                    <option value="ja">日本語</option>
                    <option value="ko">한국어</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t.dubbing_target_lang}</label>
                  <select
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-black"
                  >
                    <option value="zh">中文 (Chinese)</option>
                    <option value="en">English (US)</option>
                    <option value="ja">日本語 (Japanese)</option>
                    <option value="de">Deutsch (German)</option>
                    <option value="es">Español (Spanish)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !projectName.trim()}
                className="w-full bg-black hover:bg-gray-800 text-white font-medium text-xs py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>{t.dubbing_submitting}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>{t.dubbing_btn_create}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Projects List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 shadow-sm h-full flex flex-col justify-between">
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{t.dubbing_list_title}</h3>

            {projects.length === 0 ? (
              <div className="my-auto py-12 text-center text-gray-400 space-y-2">
                <Video className="h-8 w-8 mx-auto stroke-1" />
                <p className="text-xs">{t.dubbing_empty}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {projects.map((p) => (
                  <div
                    key={p.dubbing_id}
                    className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-semibold text-gray-900">{p.name}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500">
                        <span>{p.source_lang.toUpperCase()} ➔ {p.target_lang.toUpperCase()}</span>
                        <span>•</span>
                        <span className="capitalize">{p.status}</span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-gray-200 text-gray-800">
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
