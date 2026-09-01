import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Play,
  Pause,
  Download,
  CheckCircle2,
  Clock,
  Globe,
  Sparkles,
  FileCode,
  Copy,
  Check
} from 'lucide-react';
import { SpeechToTextResult } from '../types';

interface ScribeStudioTabProps {
  language: 'zh' | 'en';
  t: any;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

export const ScribeStudioTab: React.FC<ScribeStudioTabProps> = ({ language, t, apiFetch }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetLang, setTargetLang] = useState<string>('auto');
  const [transcribing, setTranscribing] = useState(false);
  const [result, setResult] = useState<SpeechToTextResult | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleTranscribe = async () => {
    if (!selectedFile || transcribing) return;

    try {
      setTranscribing(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('model_id', 'scribe_v1');
      if (targetLang !== 'auto') {
        formData.append('language_code', targetLang);
      }

      const res = await apiFetch('/api/speech-to-text', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setResult({
          id: `scribe_${Date.now()}`,
          text: data.text,
          language_code: data.language_code || 'eng',
          language_probability: data.language_probability || 0.98,
          words: data.words || [],
          created_at: Date.now()
        });
      }
    } catch (err) {
      console.error('Failed STT transcription:', err);
    } finally {
      setTranscribing(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportSRT = () => {
    if (!result || !result.words) return;
    let srtContent = '';
    const words = result.words;
    // Chunk words into subtitle segments (approx 5 words each)
    let chunk: any[] = [];
    let srtIndex = 1;

    const formatTime = (seconds: number) => {
      const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
      const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
      const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
      const ms = Math.floor((seconds % 1) * 1000).toString().padStart(3, '0');
      return `${hrs}:${mins}:${secs},${ms}`;
    };

    for (let i = 0; i < words.length; i++) {
      chunk.push(words[i]);
      if (chunk.length >= 6 || i === words.length - 1) {
        const start = formatTime(chunk[0].start);
        const end = formatTime(chunk[chunk.length - 1].end);
        const text = chunk.map(w => w.text).join(' ');
        srtContent += `${srtIndex}\n${start} --> ${end}\n${text}\n\n`;
        srtIndex++;
        chunk = [];
      }
    }

    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subtitles_${result.id}.srt`;
    a.click();
  };

  const exportJSON = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcription_${result.id}.json`;
    a.click();
  };

  return (
    <div id="scribe_stt_container" className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2.5">
          <FileText className="h-5 w-5 text-emerald-400" />
          <span>{t.scribe_title}</span>
        </h2>
        <p className="text-slate-400 text-xs mt-1">{t.scribe_desc}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload & Options */}
        <div className="lg:col-span-5 space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 bg-slate-900/40 hover:bg-slate-900/70 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition space-y-2"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="audio/*,video/*"
              className="hidden"
            />
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Upload className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold text-white">{selectedFile ? selectedFile.name : t.scribe_upload_label}</p>
            <p className="text-[10px] text-slate-500">MP3, WAV, M4A, FLAC, MP4 up to 500MB</p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white mb-1.5 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-emerald-400" />
                <span>{t.scribe_lang_label}</span>
              </label>
              <select
                value={targetLang}
                onChange={e => setTargetLang(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="auto">{language === 'zh' ? '✨ 自动侦测多语种 (Auto Detect)' : '✨ Auto Detect Multilingual'}</option>
                <option value="eng">English (EN)</option>
                <option value="cmn">Chinese Mandarin (中文普通话)</option>
                <option value="jpn">Japanese (日本語)</option>
                <option value="spa">Spanish (Español)</option>
                <option value="fra">French (Français)</option>
                <option value="deu">German (Deutsch)</option>
              </select>
            </div>

            <button
              onClick={handleTranscribe}
              disabled={!selectedFile || transcribing}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <Sparkles className={`h-4 w-4 ${transcribing ? 'animate-spin' : ''}`} />
              <span>{transcribing ? (language === 'zh' ? '正在执行毫米级语音识别...' : 'Transcribing audio streams...') : t.scribe_transcribe_btn}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Transcription & Timestamp Display */}
        <div className="lg:col-span-7 bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileCode className="h-4 w-4 text-emerald-400" />
              <span>{t.scribe_result_title}</span>
            </h3>

            {result && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={copyToClipboard}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 transition"
                  title="Copy full text"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={exportSRT}
                  className="px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-emerald-500/25 transition"
                >
                  <Download className="h-3 w-3" />
                  <span>SRT</span>
                </button>
                <button
                  onClick={exportJSON}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 transition"
                >
                  <Download className="h-3 w-3" />
                  <span>JSON</span>
                </button>
              </div>
            )}
          </div>

          {result ? (
            <div className="space-y-4">
              {/* Full Text Card */}
              <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 text-xs text-slate-200 leading-relaxed max-h-48 overflow-y-auto">
                {result.text}
              </div>

              {/* Word Timestamps Grid */}
              {result.words && result.words.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    {language === 'zh' ? '单词与时间戳切片 (Word Alignment)' : 'Word Alignment & Timestamps'}
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-2 bg-slate-950 border border-slate-850 rounded-xl">
                    {result.words.map((w, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center space-x-1 px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[11px] hover:border-emerald-500/40 transition cursor-default"
                        title={`${w.start.toFixed(2)}s - ${w.end.toFixed(2)}s`}
                      >
                        <span className="text-white font-medium">{w.text}</span>
                        <span className="text-[9px] text-slate-500 font-mono">[{w.start.toFixed(1)}s]</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-56 text-slate-500 text-center space-y-2">
              <FileText className="h-8 w-8 text-slate-700" />
              <p className="text-xs">{language === 'zh' ? '上传音视频文件并启动转录，在此实时查看多语种高精文本与词级对齐。' : 'Upload audio/video and transcribe to view aligned text and export subtitles.'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
