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
import { PronunciationDictionary, PronunciationRule } from '../types';

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

    const newRule: PronunciationRule = {
      string_to_replace: newRuleWord.trim(),
      rule_type: newRuleType,
      replacement: newRuleReplacement.trim(),
      alphabet: newRuleType === 'phoneme' ? 'ipa' : undefined
    };

    const updated = {
      ...selectedDict,
      rules: [newRule, ...selectedDict.rules]
    };

    setSelectedDict(updated);
    setDictionaries(prev => prev.map(d => (d.id === updated.id ? updated : d)));
    setNewRuleWord('');
    setNewRuleReplacement('');
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
    <div id="pronunciation_dictionaries_container" className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2.5">
          <BookOpen className="h-5 w-5 text-emerald-400" />
          <span>{t.dict_title}</span>
        </h2>
        <p className="text-slate-400 text-xs mt-1">{t.dict_desc}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Rules & Add Form */}
        <div className="lg:col-span-7 space-y-5">
          {/* Add Rule Form */}
          <form onSubmit={handleAddRule} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <Plus className="h-4 w-4 text-emerald-400" />
              <span>{t.dict_add_rule}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">{t.dict_word_to_replace}</label>
                <input
                  type="text"
                  required
                  value={newRuleWord}
                  onChange={e => setNewRuleWord(e.target.value)}
                  placeholder="e.g. ElevenLabs"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">{t.dict_rule_type}</label>
                <select
                  value={newRuleType}
                  onChange={e => setNewRuleType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="alias">{t.dict_type_alias}</option>
                  <option value="phoneme">{t.dict_type_phoneme}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">{t.dict_replacement}</label>
                <input
                  type="text"
                  required
                  value={newRuleReplacement}
                  onChange={e => setNewRuleReplacement(e.target.value)}
                  placeholder={newRuleType === 'alias' ? 'e.g. 11-Labs' : 'e.g. ɪˈlɛv.ən.læbz'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition"
            >
              <Save className="h-4 w-4" />
              <span>{language === 'zh' ? '保存规则至字典' : 'Save Rule to Dictionary'}</span>
            </button>
          </form>

          {/* Active Rules List */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-emerald-400" />
                <span>{selectedDict?.name || 'Active Dictionary'} ({selectedDict?.rules.length || 0} Rules)</span>
              </span>
            </h3>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {selectedDict?.rules.map((rule, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 border border-slate-850 rounded-xl p-3 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-semibold text-white">{rule.string_to_replace}</span>
                    <span className="text-slate-500 font-mono">→</span>
                    <span className="font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {rule.replacement}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono px-2 py-0.5 bg-slate-900 rounded">
                    {rule.rule_type} {rule.alphabet ? `(${rule.alphabet})` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Rule Phoneme Tester */}
        <div className="lg:col-span-5 bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
            <Code2 className="h-4 w-4 text-emerald-400" />
            <span>{language === 'zh' ? '发音字典匹配测试器' : 'Phoneme Match Sandbox'}</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-white mb-2">{language === 'zh' ? '测试原始语句' : 'Test Input Sentence'}</label>
            <textarea
              rows={3}
              value={testText}
              onChange={e => setTestText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            onClick={handleTestPhonemes}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition"
          >
            <Sparkles className="h-4 w-4" />
            <span>{language === 'zh' ? '执行规则解析与替换' : 'Evaluate Phonetic Replacement'}</span>
          </button>

          {testResult && (
            <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-4 space-y-2">
              <span className="text-[10px] text-emerald-400 font-mono uppercase font-bold">Resolved Pronunciation Mapping:</span>
              <p className="text-xs text-white font-mono leading-relaxed bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                {testResult}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
