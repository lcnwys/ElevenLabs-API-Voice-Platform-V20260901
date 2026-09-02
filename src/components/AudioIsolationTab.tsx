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
  Scissors,
  RefreshCw
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
    <div id="audio_isolation_container" className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <Scissors className="h-5 w-5 text-gray-900" />
          <span>{t.isolation_title}</span>
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">{t.isolation_desc}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{t.isolation_upload_label}</h3>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 hover:border-gray-400 bg-gray-50 hover:bg-gray-100/60 rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2"
            >
              <Upload className="h-7 w-7 text-gray-400" />
              <div className="text-xs font-medium text-gray-700">
                {selectedFile ? selectedFile.name : (language === 'zh' ? '拖拽音频至此，或点击浏览文件' : 'Click or drag audio file here')}
              </div>
              <p className="text-[11px] text-gray-400">MP3, WAV, FLAC, M4A (Max 50MB)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {filePreviewUrl && (
              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] font-medium text-gray-500">{t.isolation_preview_original}:</span>
                <audio src={filePreviewUrl} controls className="w-full h-8" />
              </div>
            )}

            <button
              onClick={handleIsolate}
              disabled={!selectedFile || isolating}
              className="w-full bg-black hover:bg-gray-800 text-white font-medium text-xs py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isolating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>{t.isolation_processing}</span>
                </>
              ) : (
                <>
                  <Scissors className="h-4 w-4" />
                  <span>{t.isolation_btn_isolate}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Output */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm h-full flex flex-col justify-between">
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{t.isolation_output_label}</h3>

            {result ? (
              <div className="space-y-4 my-auto">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{t.isolation_success}</span>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-medium text-gray-700">{t.isolation_isolated_vocal}:</span>
                  <audio src={result.isolatedAudioUrl} controls className="w-full" />
                </div>

                <a
                  href={result.isolatedAudioUrl}
                  download={`isolated-vocal-${result.id}.mp3`}
                  className="w-full bg-black hover:bg-gray-800 text-white font-medium text-xs py-2.5 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span>{t.download_audio}</span>
                </a>
              </div>
            ) : (
              <div className="my-auto py-12 text-center text-gray-400 space-y-2">
                <Music className="h-8 w-8 mx-auto stroke-1" />
                <p className="text-xs">{language === 'zh' ? '上传混音音频后提取纯净人声干音' : 'Upload mixed audio to isolate clean vocals'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
