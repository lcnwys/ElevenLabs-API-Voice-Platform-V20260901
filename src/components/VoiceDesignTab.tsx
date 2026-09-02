import React from 'react';
import {
  Sparkles,
  Sliders,
  Check,
  Save,
  RefreshCw
} from 'lucide-react';
import { VoiceDesignParams } from '../types';

interface VoiceDesignTabProps {
  language: 'zh' | 'en';
  t: any;
  designParams: VoiceDesignParams;
  setDesignParams: (params: VoiceDesignParams) => void;
  isDesigning: boolean;
  handleVoiceDesignGenerate: () => void;
  designedAudioUrl: string | null;
  tempDesignToken: string | null;
  designSaveName: string;
  setDesignSaveName: (name: string) => void;
  designSaveDesc: string;
  setDesignSaveDesc: (desc: string) => void;
  isSavingDesign: boolean;
  handleSaveDesignedVoice: (e: React.FormEvent) => void;
  designSaveSuccess: boolean;
}

export const VoiceDesignTab: React.FC<VoiceDesignTabProps> = ({
  language,
  t,
  designParams,
  setDesignParams,
  isDesigning,
  handleVoiceDesignGenerate,
  designedAudioUrl,
  tempDesignToken,
  designSaveName,
  setDesignSaveName,
  designSaveDesc,
  setDesignSaveDesc,
  isSavingDesign,
  handleSaveDesignedVoice,
  designSaveSuccess
}) => {
  return (
    <div id="voice_design_container" className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-gray-900" />
          <span>{t.design_title}</span>
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">{t.design_desc}</p>
      </div>

      {designSaveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-4 flex items-start gap-3">
          <Check className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <h4 className="font-semibold text-xs text-emerald-950">{t.clone_success_banner}</h4>
            <p className="text-[11px] text-emerald-800 mt-0.5">
              {t.design_add_to_library}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Parameters Box */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-gray-100">
            <Sliders className="h-3.5 w-3.5" />
            <span>{t.design_params_title}</span>
          </h3>

          {/* Gender */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t.design_gender}</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDesignParams({ ...designParams, gender: 'female' })}
                className={`py-2 px-3 text-xs rounded-lg border font-medium transition ${
                  designParams.gender === 'female'
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {t.design_gender_female}
              </button>
              <button
                type="button"
                onClick={() => setDesignParams({ ...designParams, gender: 'male' })}
                className={`py-2 px-3 text-xs rounded-lg border font-medium transition ${
                  designParams.gender === 'male'
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {t.design_gender_male}
              </button>
            </div>
          </div>

          {/* Accent */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t.design_accent}</label>
            <select
              value={designParams.accent}
              onChange={(e) => setDesignParams({ ...designParams, accent: e.target.value as any })}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-black"
            >
              <option value="american">{t.design_accent_us}</option>
              <option value="british">{t.design_accent_uk}</option>
              <option value="australian">{t.design_accent_au}</option>
              <option value="african">{t.design_accent_african}</option>
              <option value="indian">{t.design_accent_indian}</option>
            </select>
          </div>

          {/* Age */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t.design_age}</label>
            <select
              value={designParams.age}
              onChange={(e) => setDesignParams({ ...designParams, age: e.target.value as any })}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-black"
            >
              <option value="young">{t.design_age_young}</option>
              <option value="middle_aged">{t.design_age_middle}</option>
              <option value="old">{t.design_age_old}</option>
            </select>
          </div>

          {/* Accent Strength */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-xs font-medium text-gray-700">
              <span>{t.design_accent_strength}</span>
              <span className="font-mono">{designParams.accent_strength}x</span>
            </div>
            <input
              type="range"
              min="30"
              max="200"
              value={designParams.accent_strength * 100}
              onChange={(e) => setDesignParams({ ...designParams, accent_strength: parseFloat((parseInt(e.target.value) / 100).toFixed(2)) })}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
            />
          </div>
        </div>

        {/* Text Input Box */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-sm">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-700">
              {t.design_text_label}
            </label>
            <textarea
              value={designParams.text}
              onChange={(e) => setDesignParams({ ...designParams, text: e.target.value })}
              placeholder={t.design_text_placeholder}
              maxLength={500}
              rows={5}
              className="w-full bg-white border border-gray-200 rounded-lg p-3 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black resize-none leading-relaxed"
            />
          </div>

          <button
            type="button"
            onClick={handleVoiceDesignGenerate}
            disabled={isDesigning || !designParams.text.trim()}
            className="w-full bg-black hover:bg-gray-800 text-white font-medium text-xs py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDesigning ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>{t.design_generating}</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>{t.design_btn_generate}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result Audio & Save */}
      {designedAudioUrl && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4 animate-in fade-in">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Check className="h-4 w-4 text-emerald-600" />
            <div>
              <h4 className="text-xs font-semibold text-gray-900">{t.design_success}</h4>
              <p className="text-[10px] text-gray-400 font-mono">Token: {tempDesignToken}</p>
            </div>
          </div>

          <audio src={designedAudioUrl} controls className="w-full" />

          <form onSubmit={handleSaveDesignedVoice} className="bg-gray-50 p-4 border border-gray-200 rounded-lg space-y-3">
            <span className="block text-xs font-semibold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <Save className="h-3.5 w-3.5" />
              <span>{t.design_add_to_library}</span>
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{t.design_save_name}</label>
                <input
                  type="text"
                  required
                  value={designSaveName}
                  onChange={(e) => setDesignSaveName(e.target.value)}
                  placeholder={t.design_save_name_placeholder}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{t.clone_desc_label}</label>
                <input
                  type="text"
                  value={designSaveDesc}
                  onChange={(e) => setDesignSaveDesc(e.target.value)}
                  placeholder={t.clone_desc_placeholder}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-black"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingDesign || !designSaveName.trim()}
              className="w-full bg-black hover:bg-gray-800 text-white font-medium text-xs py-2.5 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isSavingDesign ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>{t.design_saving}</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>{t.design_save_btn}</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
