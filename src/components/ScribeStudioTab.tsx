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
  Check,
  RefreshCw
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

  return (
    <div id="scribe_studio_container" className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-900" />
          <span>{t.scribe_title}</span>
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">{t.scribe_desc}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{t.scribe_upload_label}</h3>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 hover:border-gray-400 bg-gray-50 hover:bg-gray-100/60 rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2"
            >
              <Upload className="h-7 w-7 text-gray-400" />
              <div className="text-xs font-medium text-gray-700">
                {selectedFile ? selectedFile.name : (language === 'zh' ? '点击选择音频或视频文件' : 'Click to select audio/video')}
              </div>
              <p className="text-[11px] text-gray-400">MP3, WAV, MP4, MOV (Max 100MB)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{t.scribe_language_label}</label>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-black"
              >
                <option value="auto">{t.scribe_lang_auto}</option>
                <option value="zh">中文 (Chinese)</option>
                <option value="eng">English</option>
                <option value="spa">Español</option>
                <option value="fra">Français</option>
                <option value="deu">Deutsch</option>
                <option value="jpn">日本語</option>
              </select>
            </div>

            <button
              onClick={handleTranscribe}
              disabled={!selectedFile || transcribing}
              className="w-full bg-black hover:bg-gray-800 text-white font-medium text-xs py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {transcribing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>{t.scribe_processing}</span>
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  <span>{t.scribe_btn_transcribe}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Transcription Output */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm h-full flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{t.scribe_result_label}</h3>

              {result && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="p-1.5 text-xs text-gray-500 hover:text-black transition flex items-center gap-1 font-medium"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? (language === 'zh' ? '已复制' : 'Copied') : (language === 'zh' ? '复制' : 'Copy')}</span>
                  </button>

                  <button
                    onClick={exportSRT}
                    className="p-1.5 text-xs text-gray-500 hover:text-black transition flex items-center gap-1 font-medium"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>SRT</span>
                  </button>
                </div>
              )}
            </div>

            {result ? (
              <div className="space-y-4 my-auto">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 leading-relaxed max-h-72 overflow-y-auto whitespace-pre-wrap">
                  {result.text}
                </div>

                <div className="flex items-center gap-3 text-[11px] text-gray-500">
                  <span>语言: <strong className="text-gray-900 uppercase">{result.language_code}</strong></span>
                  <span>•</span>
                  <span>置信度: <strong className="text-gray-900">{Math.round(result.language_probability * 100)}%</strong></span>
                  <span>•</span>
                  <span>词数: <strong className="text-gray-900">{result.words?.length || 0}</strong></span>
                </div>
              </div>
            ) : (
              <div className="my-auto py-12 text-center text-gray-400 space-y-2">
                <FileText className="h-8 w-8 mx-auto stroke-1" />
                <p className="text-xs">{language === 'zh' ? '转录结果与逐字时间戳将在此显示' : 'Transcription results and timestamps will appear here'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
