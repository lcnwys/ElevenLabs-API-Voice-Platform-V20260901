import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Upload,
  Music,
  Play,
  Pause,
  Download,
  CheckCircle2,
  AlertCircle,
  FileAudio,
  Radio,
  Sliders,
  Scissors
} from 'lucide-react';
import { AudioIsolationResult } from '../types';

interface AudioIsolationTabProps {
  language: 'zh' | 'en';
  t: any;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

export const AudioIsolationTab: React.FC<AudioIsolationTabProps> = ({ language, t, apiFetch }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isolating, setIsolating] = useState(false);
  const [result, setResult] = useState<AudioIsolationResult | null>(null);
  const [playingOriginal, setPlayingOriginal] = useState(false);
  const [playingIsolated, setPlayingIsolated] = useState(false);
  const originalAudioRef = useRef<HTMLAudioElement | null>(null);
  const isolatedAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
      setResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
      setResult(null);
    }
  };

  const handleIsolate = async () => {
    if (!selectedFile || isolating) return;

    try {
      setIsolating(true);
      const formData = new FormData();
      formData.append('audio', selectedFile);

      const res = await apiFetch('/api/audio-isolation', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const blob = await res.blob();
        const isolatedUrl = URL.createObjectURL(blob);
        setResult({
          id: `iso_${Date.now()}`,
          filename: selectedFile.name,
          isolatedAudioUrl: isolatedUrl,
          created_at: Date.now(),
          originalSize: selectedFile.size
        });
      }
    } catch (err) {
      console.error('Failed audio isolation:', err);
    } finally {
      setIsolating(false);
    }
  };

  return (
    <div id="audio_isolation_container" className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2.5">
          <Scissors className="h-5 w-5 text-emerald-400" />
          <span>{t.isolation_title}</span>
        </h2>
        <p className="text-slate-400 text-xs mt-1">{t.isolation_desc}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload & Run */}
        <div className="lg:col-span-6 space-y-4">
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 bg-slate-900/40 hover:bg-slate-900/70 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition space-y-3"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="audio/*"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">{selectedFile ? selectedFile.name : t.isolation_upload_label}</p>
              <p className="text-[11px] text-slate-500 mt-1">{t.isolation_drag_tip}</p>
            </div>
            {selectedFile && (
              <span className="text-[10px] px-2.5 py-1 bg-emerald-500/15 text-emerald-400 rounded-full font-mono">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type || 'audio/mpeg'}
              </span>
            )}
          </div>

          {selectedFile && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">{language === 'zh' ? '原音频试听' : 'Original Audio Preview'}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (originalAudioRef.current) {
                      if (playingOriginal) {
                        originalAudioRef.current.pause();
                        setPlayingOriginal(false);
                      } else {
                        originalAudioRef.current.play();
                        setPlayingOriginal(true);
                      }
                    }
                  }}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5"
                >
                  {playingOriginal ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 fill-current" />}
                  <span>{playingOriginal ? 'Pause' : 'Play Original'}</span>
                </button>
              </div>
              {filePreviewUrl && (
                <audio
                  ref={originalAudioRef}
                  src={filePreviewUrl}
                  onEnded={() => setPlayingOriginal(false)}
                  className="hidden"
                />
              )}

              <button
                onClick={handleIsolate}
                disabled={isolating}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow disabled:opacity-50"
              >
                <Sparkles className={`h-4 w-4 ${isolating ? 'animate-spin' : ''}`} />
                <span>{isolating ? (language === 'zh' ? '正在执行高精人声分离...' : 'Separating dry vocal stems...') : t.isolation_btn}</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Isolated Vocal Output */}
        <div className="lg:col-span-6 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
            <Radio className="h-4 w-4 text-emerald-400" />
            <span>{language === 'zh' ? '纯净干声音频输出 (Isolated Dry Vocals)' : 'Isolated Vocal Master'}</span>
          </h3>

          {result ? (
            <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-5 space-y-4 animate-in fade-in">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
                  <Music className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{result.filename}</h4>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>{language === 'zh' ? '人声已纯净剥离 • 去噪去混响完成' : 'Vocal extracted • Zero noise floor'}</span>
                  </span>
                </div>
              </div>

              {/* Player */}
              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (isolatedAudioRef.current) {
                      if (playingIsolated) {
                        isolatedAudioRef.current.pause();
                        setPlayingIsolated(false);
                      } else {
                        isolatedAudioRef.current.play();
                        setPlayingIsolated(true);
                      }
                    }
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition"
                >
                  {playingIsolated ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
                  <span>{playingIsolated ? 'Pause Stem' : 'Play Isolated Vocal'}</span>
                </button>

                <a
                  href={result.isolatedAudioUrl}
                  download={`isolated_vocal_${result.filename}`}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold rounded-xl text-xs flex items-center gap-2 transition"
                >
                  <Download className="h-4 w-4 text-emerald-400" />
                  <span>{t.isolation_download_clean}</span>
                </a>
              </div>

              <audio
                ref={isolatedAudioRef}
                src={result.isolatedAudioUrl}
                onEnded={() => setPlayingIsolated(false)}
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-center space-y-2">
              <Scissors className="h-8 w-8 text-slate-700" />
              <p className="text-xs">{language === 'zh' ? '在左侧上传音频并启动，在此获取高质量人声伴奏分离音轨。' : 'Upload audio and start isolation to receive studio-grade dry vocal stems.'}</p>
            </div>
          )}

          <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl text-[11px] text-slate-400 leading-relaxed">
            <span className="text-emerald-400 font-bold">Pro Tip: </span>
            {language === 'zh'
              ? '提取出来的纯净人声可以直接导入「极速声音克隆」模块作为参考音频，克隆保真度提升 40% 以上。'
              : 'Isolated dry vocals can be directly imported into Instant Voice Cloning for up to 40% higher acoustic fidelity.'}
          </div>
        </div>
      </div>
    </div>
  );
};
