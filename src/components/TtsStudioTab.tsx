import React from 'react';
import {
  Sparkles,
  Layers,
  Play,
  Download,
  Share2,
  Star,
  Sliders,
  RefreshCw,
  SlidersHorizontal,
  Volume2,
  RotateCcw,
  Activity,
  Check
} from 'lucide-react';
import { Voice, VoiceModel, VoiceSettings, ComparisonResult, HistoryItem } from '../types';

interface TtsStudioTabProps {
  language: 'zh' | 'en';
  t: any;
  voices: Voice[];
  models: VoiceModel[];
  selectedVoiceId: string;
  setSelectedVoiceId: (id: string) => void;
  selectedModelId: string;
  setSelectedModelId: (id: string) => void;
  text: string;
  setText: (text: string) => void;
  voiceSettings: VoiceSettings;
  setVoiceSettings: (settings: VoiceSettings) => void;
  isGenerating: boolean;
  isComparing: boolean;
  comparisonModels: string[];
  setComparisonModels: React.Dispatch<React.SetStateAction<string[]>>;
  handleGenerateTTS: () => void;
  handleCompareModels: () => void;
  currentAudioUrl: string | null;
  historyItems: HistoryItem[];
  comparisonResults: ComparisonResult[];
  handleUpdateComparisonRating: (modelId: string, rating: number) => void;
  handleUpdateComparisonComment: (modelId: string, comment: string) => void;
  exportComparisonReport: () => void;
  applyPreset: (preset: any) => void;
  promptPresets: any[];
}

export const TtsStudioTab: React.FC<TtsStudioTabProps> = ({
  language,
  t,
  voices,
  models,
  selectedVoiceId,
  setSelectedVoiceId,
  selectedModelId,
  setSelectedModelId,
  text,
  setText,
  voiceSettings,
  setVoiceSettings,
  isGenerating,
  isComparing,
  comparisonModels,
  setComparisonModels,
  handleGenerateTTS,
  handleCompareModels,
  currentAudioUrl,
  comparisonResults,
  handleUpdateComparisonRating,
  handleUpdateComparisonComment,
  exportComparisonReport,
  applyPreset,
  promptPresets
}) => {
  // Toggle individual model in comparison matrix
  const toggleModelSelection = (modelId: string) => {
    if (comparisonModels.includes(modelId)) {
      // Keep at least one selected
      if (comparisonModels.length > 1) {
        setComparisonModels(comparisonModels.filter(id => id !== modelId));
      }
    } else {
      setComparisonModels([...comparisonModels, modelId]);
    }
  };

  // Reset to recommended official settings
  const handleResetRecommendedSettings = () => {
    setVoiceSettings({
      stability: 45,
      similarity_boost: 80,
      style: 15,
      use_speaker_boost: true
    });
  };

  return (
    <div id="tts_studio_container" className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      
      {/* Title Bar & Quick Presets */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-gray-900" />
            <span>{t.tts_title}</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">{t.tts_desc}</p>
        </div>

        {/* Presets Button Selector */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[11px] text-gray-400 font-medium">{t.preset_label}</span>
          {promptPresets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(preset)}
              className="px-2.5 py-1 text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-md transition font-medium flex items-center gap-1"
              title={language === 'zh' ? `点击应用【${preset.label}】模板与预设参数` : `Apply ${preset.label} preset`}
            >
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Textarea Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
            {t.text_content_label}
          </label>
          <span className="text-[11px] text-gray-400 font-mono">
            {text.length} / 1000 {t.text_count || '字'}
          </span>
        </div>

        <textarea
          id="tts_textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={1000}
          placeholder={t.text_placeholder}
          rows={3}
          className="w-full bg-white border border-gray-200 rounded-lg p-3.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black transition resize-none leading-relaxed shadow-inner"
        />

        <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
          <span>{t.text_specs}</span>
          <span className="font-mono">{text.length} / 1000 {t.text_count || '字'}</span>
        </div>
      </div>

      {/* Two-Column Side-by-Side Generation Cards (Single Express vs Multi-Model Comparison) in Black & White */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Card: 单次极速语音生成 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-gray-900 shrink-0" />
              <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                {t.single_gen_title}
              </h3>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              {t.single_gen_desc}
            </p>

            {/* Target Voice Selection */}
            <div className="pt-2">
              <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                {t.target_voice}
              </label>
              <select
                id="voice_select_single"
                value={selectedVoiceId}
                onChange={(e) => setSelectedVoiceId(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-black font-medium"
              >
                {voices.map(voice => (
                  <option key={voice.voice_id} value={voice.voice_id}>
                    {voice.name} ({voice.category === 'cloned' ? t.voice_cloned : voice.category === 'designed' ? t.voice_designed : t.voice_official})
                  </option>
                ))}
              </select>
            </div>

            {/* Target Model Selection */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                {t.target_model}
              </label>
              <select
                id="model_select_single"
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-black font-medium"
              >
                {models.map(model => (
                  <option key={model.model_id} value={model.model_id}>
                    {model.name} ({model.quality || 'HD'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Button: 立即生成单次语音 (Pure Black) */}
          <div className="pt-2">
            <button
              id="btn_generate_single"
              onClick={handleGenerateTTS}
              disabled={isGenerating || isComparing || !text.trim()}
              className="w-full bg-black hover:bg-gray-800 text-white font-bold text-xs py-3 px-4 rounded-xl transition duration-150 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-white" />
                  <span>{t.generating}</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current text-white" />
                  <span>{t.btn_generate_single}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Card: 多模型横向对比矩阵 (TEAM EVAL) */}
        <div className="bg-white border border-gray-300 rounded-xl p-5 shadow-sm flex flex-col justify-between space-y-4 relative">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-gray-900 shrink-0" />
              <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                {t.compare_title}
              </h3>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              {t.compare_desc}
            </p>

            {/* Models Multi-Select Checklist */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider">
                  {t.select_compare_models}
                </label>
                <span className="text-[10px] text-gray-700 font-mono font-semibold">
                  {comparisonModels.length} / {models.length} {language === 'zh' ? '已选' : 'selected'}
                </span>
              </div>

              {/* Scrollable Model Checkboxes */}
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 border border-gray-200 rounded-lg p-1.5 bg-gray-50/70">
                {models.map(model => {
                  const isChecked = comparisonModels.includes(model.model_id);
                  return (
                    <div
                      key={model.model_id}
                      onClick={() => toggleModelSelection(model.model_id)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg border transition cursor-pointer select-none ${
                        isChecked
                          ? 'bg-white border-black text-gray-900 shadow-xs'
                          : 'bg-white/70 border-gray-200 text-gray-500 hover:bg-white hover:text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center transition ${
                            isChecked
                              ? 'bg-black text-white'
                              : 'border border-gray-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                        <span className="text-xs font-semibold">{model.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-gray-400">
                        {model.speed || 'Fast'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Button: 生成并对比 (Black & White High-Contrast) */}
          <div className="pt-2">
            <button
              id="btn_compare_models"
              onClick={handleCompareModels}
              disabled={isGenerating || isComparing || !text.trim() || comparisonModels.length === 0}
              className="w-full bg-white hover:bg-gray-100 text-gray-900 border-2 border-gray-900 font-bold text-xs py-3 px-4 rounded-xl transition duration-150 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {isComparing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-gray-900" />
                  <span>{t.comparing}</span>
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4 text-gray-900" />
                  <span>{t.btn_compare} ({comparisonModels.length})</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Voice Parameter Controls & Current Audio Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        
        {/* Voice Parameters Slider Panel */}
        <div className="lg:col-span-7 bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-gray-700" />
              <span>{t.voice_settings_title}</span>
            </h3>
            <button
              onClick={handleResetRecommendedSettings}
              className="text-[11px] text-gray-500 hover:text-black flex items-center gap-1 transition"
              title={t.voice_settings_reset_btn || '恢复官方推荐默认参数'}
            >
              <RotateCcw className="h-3 w-3" />
              <span>{language === 'zh' ? '推荐默认' : 'Reset'}</span>
            </button>
          </div>

          <div className="space-y-4">
            {/* Stability */}
            <div>
              <div className="flex justify-between text-xs font-medium text-gray-800 mb-1">
                <span>{t.param_stability}:</span>
                <span className="font-mono font-semibold">{voiceSettings.stability}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={voiceSettings.stability}
                onChange={(e) => setVoiceSettings({ ...voiceSettings, stability: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>{t.param_stability_low || '更富情感 (0%)'}</span>
                <span className="text-gray-500 font-medium">{t.param_stability_rec || '推荐 35%~50%'}</span>
                <span>{t.param_stability_high || '平稳一致 (100%)'}</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{t.param_stability_desc}</p>
            </div>

            {/* Similarity Boost */}
            <div>
              <div className="flex justify-between text-xs font-medium text-gray-800 mb-1">
                <span>{t.param_clarity}:</span>
                <span className="font-mono font-semibold">{voiceSettings.similarity_boost}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={voiceSettings.similarity_boost}
                onChange={(e) => setVoiceSettings({ ...voiceSettings, similarity_boost: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>{t.param_clarity_low || '平滑 (0%)'}</span>
                <span className="text-gray-500 font-medium">{t.param_clarity_rec || '推荐 75%~85%'}</span>
                <span>{t.param_clarity_high || '极限吻合 (100%)'}</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{t.param_clarity_desc}</p>
            </div>

            {/* Style Exaggeration */}
            <div>
              <div className="flex justify-between text-xs font-medium text-gray-800 mb-1">
                <span>{t.param_style}:</span>
                <span className="font-mono font-semibold">{voiceSettings.style}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={voiceSettings.style}
                onChange={(e) => setVoiceSettings({ ...voiceSettings, style: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>{t.param_style_low || '自然平实 (0%)'}</span>
                <span>{t.param_style_high || '戏剧张力 (100%)'}</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{t.param_style_desc}</p>
            </div>

            {/* Speaker Boost Toggle */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-gray-800 block">{t.param_speaker_boost}</span>
                <span className="text-[10px] text-gray-400 block">{t.param_speaker_boost_desc}</span>
              </div>
              <input
                type="checkbox"
                checked={voiceSettings.use_speaker_boost}
                onChange={(e) => setVoiceSettings({ ...voiceSettings, use_speaker_boost: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black accent-black cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Current Single Audio Output Player */}
        <div className="lg:col-span-5 flex flex-col justify-start space-y-4">
          {currentAudioUrl ? (
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <Volume2 className="h-4 w-4 text-gray-900" />
                  <span>{t.preview_player_title}</span>
                </span>
                <a
                  href={currentAudioUrl}
                  download={`elevenlabs-speech-${Date.now()}.mp3`}
                  className="text-xs text-gray-700 hover:text-black font-medium transition flex items-center gap-1 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-md"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{t.download_audio}</span>
                </a>
              </div>
              <audio src={currentAudioUrl} controls className="w-full" />
            </div>
          ) : (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-6 text-center text-gray-400 space-y-2 h-full flex flex-col items-center justify-center">
              <Volume2 className="h-8 w-8 text-gray-300" />
              <p className="text-xs text-gray-500">
                {language === 'zh' ? '点击左侧【立即生成单次语音】或右侧【生成并对比】即可在此收听生成的音频。' : 'Click synthesize to listen to synthesized audio here.'}
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Comparison Matrix Results Section (Black & White Style) */}
      {comparisonResults.length > 0 && (
        <div className="space-y-4 pt-2 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Layers className="h-4 w-4 text-gray-900" />
                <span>{t.matrix_title}</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">{t.matrix_sub_desc}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportComparisonReport}
                className="bg-black hover:bg-gray-800 text-white rounded-lg py-2 px-3.5 text-xs font-medium flex items-center gap-1.5 transition shadow-sm"
                title={language === 'zh' ? '导出包含延迟、音频大小与团队评分的 JSON 报告' : 'Export JSON evaluation report'}
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>{t.export_json}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {comparisonResults.map((result, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 flex flex-col justify-between hover:border-black transition shadow-sm"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-gray-900" />
                      <span>{result.model_name}</span>
                    </h4>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-900 border border-gray-300 rounded text-[10px] font-mono font-bold">
                      ⚡ {result.latency}ms
                    </span>
                  </div>

                  <audio src={result.audioUrl} controls className="w-full" />

                  {/* Rating */}
                  <div className="space-y-1 pt-1">
                    <span className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{t.team_rating}</span>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleUpdateComparisonRating(result.model_id, star)}
                          className="transition hover:scale-110 p-0.5"
                          title={`${star} ${language === 'zh' ? '星' : 'Stars'}`}
                        >
                          <Star
                            className={`h-4 w-4 ${
                              star <= result.rating
                                ? 'fill-gray-900 text-gray-900'
                                : 'text-gray-200 hover:text-gray-400'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Commentary */}
                  <div>
                    <textarea
                      value={result.comment}
                      onChange={(e) => handleUpdateComparisonComment(result.model_id, e.target.value)}
                      placeholder={t.evaluation_notes_placeholder}
                      rows={2}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-black resize-none leading-relaxed"
                    />
                  </div>
                </div>

                <div className="text-[10px] text-gray-400 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                  <span className="font-medium text-gray-600">{result.voice_name}</span>
                  <span className="font-mono">{result.fileSize} KB</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
