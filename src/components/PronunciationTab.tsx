import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Search,
  Code2,
  FileCheck,
  Save
} from 'lucide-react';
import { PronunciationDictionary } from '../types';

interface PronunciationTabProps {
  language: 'zh' | 'en';
  t: any;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

export const PronunciationTab: React.FC<PronunciationTabProps> = ({ language, t, apiFetch }) => {
  const [dictionaries, setDictionaries] = useState<PronunciationDictionary[]>([]);
  const [selectedDict, setSelectedDict] = useState<PronunciationDictionary | null>(null);
  const [newRuleWord, setNewRuleWord] = useState('');
  const [newRuleReplacement, setNewRuleReplacement] = useState('');
  const [newRuleType, setNewRuleType] = useState<'alias' | 'phoneme'>('alias');
  const [testText, setTestText] = useState('ElevenLabs supports high precision TTS with PostgreSQL and K8s.');
  const [testResult, setTestResult] = useState('');

  const fetchDictionaries = async () => {
    try {
      const res = await apiFetch('/api/pronunciation-dictionaries');
      if (res.ok) {
        const data = await res.json();
        setDictionaries(data.dictionaries || []);
        if (data.dictionaries && data.dictionaries.length > 0) {
          setSelectedDict(data.dictionaries[0]);
        }
      }
    } catch (err) {
      console.error('Failed fetching pronunciation dictionaries:', err);
    }
  };

  useEffect(() => {
    fetchDictionaries();
  }, []);

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleWord.trim() || !newRuleReplacement.trim() || !selectedDict) return;
    alert(language === 'zh'
      ? '当前只读取 ElevenLabs 官方词典；规则写入接口尚未接入，未保存本地修改。'
      : 'Only official ElevenLabs dictionaries are read; rule writes are not connected and no local change was saved.');
  };

  const handleTestPhonemes = () => {
    if (!selectedDict) return;
    let replaced = testText;
    selectedDict.rules.forEach(r => {
      const regex = new RegExp(`\\b${r.string_to_replace}\\b`, 'gi');
      replaced = replaced.replace(regex, `[${r.replacement}]`);
    });
    setTestResult(replaced);
  };

  return (
    <div id="pronunciation_dictionaries_container" className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-gray-900" />
          <span>{t.dict_title}</span>
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">{t.dict_desc}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Rules & Add Form */}
        <div className="lg:col-span-7 space-y-5">
          {/* Add Rule Form */}
          <form onSubmit={handleAddRule} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              {t.dict_add_rule}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{t.dict_original_word}</label>
                <input
                  type="text"
                  required
                  value={newRuleWord}
                  onChange={(e) => setNewRuleWord(e.target.value)}
                  placeholder="e.g. PostgreSQL"
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{t.dict_replacement}</label>
                <input
                  type="text"
                  required
                  value={newRuleReplacement}
                  onChange={(e) => setNewRuleReplacement(e.target.value)}
                  placeholder="e.g. Postgres Q L"
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <label className="text-xs text-gray-600 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="rule_type"
                    checked={newRuleType === 'alias'}
                    onChange={() => setNewRuleType('alias')}
                    className="accent-black"
                  />
                  <span>文本别名 (Alias)</span>
                </label>
                <label className="text-xs text-gray-600 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="rule_type"
                    checked={newRuleType === 'phoneme'}
                    onChange={() => setNewRuleType('phoneme')}
                    className="accent-black"
                  />
                  <span>IPA 国际音标 (Phoneme)</span>
                </label>
              </div>

              <button
                type="submit"
                className="bg-black hover:bg-gray-800 text-white font-medium text-xs px-4 py-2 rounded-lg transition flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{t.dict_btn_add}</span>
              </button>
            </div>
          </form>

          {/* Rules List */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{t.dict_rules_list}</h3>

            {(!selectedDict || selectedDict.rules.length === 0) ? (
              <p className="text-xs text-gray-400 py-4 text-center">{t.dict_empty_rules}</p>
            ) : (
              <div className="space-y-2">
                {selectedDict.rules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{rule.string_to_replace}</span>
                      <span className="text-gray-400">➔</span>
                      <span className="font-mono text-gray-700">{rule.replacement}</span>
                      <span className="px-1.5 py-0.5 rounded bg-gray-200 text-[10px] font-medium text-gray-700">
                        {rule.rule_type}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        if (!selectedDict) return;
                        alert(language === 'zh'
                          ? '词典删除/修改请使用 ElevenLabs 官方词典接口，未执行本地删除。'
                          : 'Use the official ElevenLabs dictionary API to modify dictionaries; no local deletion was performed.');
                      }}
                      className="text-gray-400 hover:text-red-600 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Rule Test Simulator */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm h-full flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{language === 'zh' ? '发音词典预览' : 'Pronunciation dictionary preview'}</h3>
              <p className="text-xs text-gray-500">{language === 'zh' ? '仅展示已从 ElevenLabs 官方接口读取的词典规则。' : 'Only rules loaded from the official ElevenLabs API are shown.'}</p>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{t.dict_test_input}</label>
                <textarea
                  rows={3}
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg p-3 text-xs text-gray-900 focus:outline-none focus:border-black resize-none"
                />
              </div>

              <button
                onClick={handleTestPhonemes}
                className="w-full bg-black hover:bg-gray-800 text-white font-medium text-xs py-2.5 rounded-lg transition flex items-center justify-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{t.dict_btn_test}</span>
              </button>

              {testResult && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-1">
                  <span className="text-[11px] font-medium text-gray-500">{t.dict_output_preview}:</span>
                  <p className="font-mono text-xs text-gray-900">{testResult}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
