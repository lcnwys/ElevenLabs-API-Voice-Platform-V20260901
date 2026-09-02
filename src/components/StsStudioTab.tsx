import React from 'react';
import {
  CloudLightning,
  Mic,
  Upload,
  X,
  Check,
  Download,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { Voice } from '../types';

interface StsStudioTabProps {
  language: 'zh' | 'en';
  t: any;
  voices: Voice[];
  stsVoiceId: string;
  setStsVoiceId: (id: string) => void;
  stsModelId: string;
  setStsModelId: (id: string) => void;
  isStsRecording: boolean;
  stsRecordSeconds: number;
  stsRecordUrl: string | null;
  stsFile: File | null;
  setStsFile: (file: File | null) => void;
  setStsRecordUrl: (url: string | null) => void;
  startStsRecording: () => void;
  stopStsRecording: () => void;
  isStsTransforming: boolean;
  handleStsTransform: () => void;
  stsResultUrl: string | null;
  formatTime: (seconds: number) => string;
}

export const StsStudioTab: React.FC<StsStudioTabProps> = ({
  language,
  t,
  voices,
  stsVoiceId,
  setStsVoiceId,
  stsModelId,
  setStsModelId,
  isStsRecording,
  stsRecordSeconds,
  stsRecordUrl,
  stsFile,
  setStsFile,
  setStsRecordUrl,
  startStsRecording,
  stopStsRecording,
  isStsTransforming,
  handleStsTransform,
  stsResultUrl,
  formatTime
}) => {
  return (
    <div id="sts_studio_container" className="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <CloudLightning className="h-5 w-5 text-gray-900" />
          <span>{t.sts_title}</span>
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">{t.sts_desc}</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
            {t.sts_source_audio}
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mic Record */}
            <div className="border border-gray-200 bg-gray-50 rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-gray-900 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500"></span>
                  {t.clone_mic_method}
                </h4>
                <p className="text-[11px] text-gray-500 leading-normal">
                  {t.clone_mic_desc}
                </p>
              </div>

              <div className="space-y-2 bg-white p-3 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{t.clone_recording_time}</span>
                  <span className={`font-mono text-xs ${isStsRecording ? 'text-red-600 font-bold' : ''}`}>
                    {formatTime(stsRecordSeconds)} / 00:30
                  </span>
                </div>

                {stsRecordUrl && !isStsRecording && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 font-medium">{t.sts_recorded_preview}:</span>
                    <audio src={stsRecordUrl} controls className="w-full h-8" />
                  </div>
                )}

                <div className="flex gap-2">
                  {!isStsRecording ? (
                    <button
                      type="button"
                      onClick={startStsRecording}
                      className="flex-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-medium text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 transition"
                    >
                      <Mic className="h-3.5 w-3.5 text-red-500" />
                      <span>{t.sts_start_record}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => stopStsRecording()}
                      className="flex-1 bg-red-600 text-white font-semibold text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 animate-pulse transition"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>{t.sts_stop_record}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* File Upload */}
            <div className="border border-gray-200 bg-gray-50 rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-gray-900 flex items-center gap-2">
                  <Upload className="h-4 w-4 text-gray-700" />
                  {t.clone_upload_method}
                </h4>
                <p className="text-[11px] text-gray-500 leading-normal">
                  {t.clone_upload_desc}
                </p>
              </div>

              <div className="space-y-2 bg-white p-3 rounded-lg border border-gray-200">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setStsFile(e.target.files[0]);
                      setStsRecordUrl(null);
                    }
                  }}
                  className="w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-800 hover:file:bg-gray-200 file:cursor-pointer"
                />
                {stsFile && (
                  <p className="text-[11px] text-gray-500 font-mono">
                    {stsFile.name} ({(stsFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Parameters Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t.target_voice}
            </label>
            <select
              value={stsVoiceId}
              onChange={(e) => setStsVoiceId(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-black"
            >
              {voices.map(voice => (
                <option key={voice.voice_id} value={voice.voice_id}>
                  {voice.name} ({voice.category === 'cloned' ? t.voice_cloned : voice.category === 'designed' ? t.voice_designed : t.voice_official})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t.target_model}
            </label>
            <select
              value={stsModelId}
              onChange={(e) => setStsModelId(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-black"
            >
              <option value="eleven_multilingual_sts_v2">Eleven Multilingual STS v2</option>
              <option value="eleven_english_sts_v2">Eleven English STS v2 (Legacy)</option>
            </select>
          </div>
        </div>

        {/* Transform Button */}
        <div className="pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={handleStsTransform}
            disabled={isStsTransforming || (!stsFile && !stsRecordUrl)}
            className="w-full bg-black hover:bg-gray-800 text-white font-medium text-xs py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isStsTransforming ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>{t.sts_transforming}</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>{t.sts_btn_transform}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Output Preview */}
      {stsResultUrl && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600" />
              <h4 className="text-xs font-semibold text-gray-900">
                {voices.find(v => v.voice_id === stsVoiceId)?.name} • Speech-to-Speech Output
              </h4>
            </div>
            <a
              href={stsResultUrl}
              download={`elevenlabs-sts-${Date.now()}.mp3`}
              className="text-xs text-gray-500 hover:text-black transition flex items-center gap-1 font-medium"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{t.download_audio}</span>
            </a>
          </div>

          <audio src={stsResultUrl} controls className="w-full" />
        </div>
      )}
    </div>
  );
};
