import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  Globe,
  Settings,
  Key,
  X,
  AlertCircle,
  SlidersHorizontal,
  Bot,
  ShieldCheck,
  RefreshCw,
  Terminal,
  Mic,
  CloudLightning,
  Sparkles,
  Music2,
  Wand2,
  Scissors,
  FileText,
  Film,
  BookOpen,
  ShoppingBag,
  History,
  Layers,
  ChevronRight,
  Database,
  Menu,
  Search,
  User,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { translations } from './translations';
import { ApiStatus, VoiceModel, Voice, VoiceSettings, HistoryItem, ComparisonResult, CloudHistoryItem, VoiceDesignParams } from './types';
import { SidebarNavigation, NavTabId } from './components/SidebarNavigation';
import { EnterpriseBillingTab } from './components/EnterpriseBillingTab';
import { AgentsStudioTab } from './components/AgentsStudioTab';
import { SoundEffectsTab } from './components/SoundEffectsTab';
import { AudioIsolationTab } from './components/AudioIsolationTab';
import { ScribeStudioTab } from './components/ScribeStudioTab';
import { DubbingStudioTab } from './components/DubbingStudioTab';
import { PronunciationTab } from './components/PronunciationTab';
import { SharedVoiceMarketTab } from './components/SharedVoiceMarketTab';
import { ApiWorkbenchTab } from './components/ApiWorkbenchTab';
import { HistoryTaskCenterTab } from './components/HistoryTaskCenterTab';
import { MusicStudioTab } from './components/MusicStudioTab';
import { VoiceCloningTab } from './components/VoiceCloningTab';
import { TtsStudioTab } from './components/TtsStudioTab';
import { StsStudioTab } from './components/StsStudioTab';
import { VoiceDesignTab } from './components/VoiceDesignTab';
import { VoiceLibraryTab } from './components/VoiceLibraryTab';

export default function App() {
  // Localization: 'zh' or 'en'
  const [language, setLanguage] = useState<'zh' | 'en'>(() => {
    const saved = localStorage.getItem('elevenlabs_lang');
    return (saved === 'zh' || saved === 'en') ? saved : 'zh';
  });

  const t = translations[language];

  const toggleLanguage = () => {
    const nextLang = language === 'zh' ? 'en' : 'zh';
    setLanguage(nextLang);
    localStorage.setItem('elevenlabs_lang', nextLang);
  };

  // Sidebar collapse & responsive mobile drawer state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('elevenlabs_sidebar_collapsed') === 'true';
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('elevenlabs_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Full Official ElevenLabs Tab Suite
  const [activeTab, setActiveTab] = useState<NavTabId>('tts');

  const handleSelectTab = (tab: NavTabId) => {
    setActiveTab(tab);
  };

  // Core States
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    configured: false,
    mode: 'unconfigured',
    message: 'Detecting...'
  });

  // Custom API Test Configuration States
  const [customBaseUrl, setCustomBaseUrl] = useState(() => {
    return localStorage.getItem('elevenlabs_custom_base_url') || '';
  });
  const [customApiKey, setCustomApiKey] = useState(() => {
    return localStorage.getItem('elevenlabs_custom_api_key') || '';
  });
  
  // Temporary input state variables for testing
  const [tempBaseUrl, setTempBaseUrl] = useState(customBaseUrl);
  const [tempApiKey, setTempApiKey] = useState(customApiKey);
  
  const [showSettings, setShowSettings] = useState(false);
  const [settingsSuccessMessage, setSettingsSuccessMessage] = useState<string | null>(null);

  // Custom wrapper around fetch to pass custom base URL and API key headers
  const apiFetch = (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    if (customBaseUrl) {
      headers.set('X-Custom-Base-URL', customBaseUrl);
    }
    if (customApiKey) {
      headers.set('X-Custom-API-Key', customApiKey);
    }
    return fetch(url, { ...options, headers });
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = tempBaseUrl.trim();
    const cleanKey = tempApiKey.trim();
    
    setCustomBaseUrl(cleanUrl);
    setCustomApiKey(cleanKey);
    
    if (cleanUrl) {
      localStorage.setItem('elevenlabs_custom_base_url', cleanUrl);
    } else {
      localStorage.removeItem('elevenlabs_custom_base_url');
    }
    
    if (cleanKey) {
      localStorage.setItem('elevenlabs_custom_api_key', cleanKey);
    } else {
      localStorage.removeItem('elevenlabs_custom_api_key');
    }

    setSettingsSuccessMessage(t.config_saved_success);
    
    setTimeout(() => {
      setSettingsSuccessMessage(null);
      setShowSettings(false);
    }, 2000);
  };

  const handleResetConfig = () => {
    setTempBaseUrl('');
    setTempApiKey('');
    setCustomBaseUrl('');
    setCustomApiKey('');
    localStorage.removeItem('elevenlabs_custom_base_url');
    localStorage.removeItem('elevenlabs_custom_api_key');
    
    setSettingsSuccessMessage(t.config_reset_success);
    setTimeout(() => {
      setSettingsSuccessMessage(null);
      setShowSettings(false);
    }, 2000);
  };

  const [voices, setVoices] = useState<Voice[]>([]);
  const [models, setModels] = useState<VoiceModel[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Local Evaluations Storage
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);

  // Cloud History logs fetched from ElevenLabs API
  const [cloudHistory, setCloudHistory] = useState<CloudHistoryItem[]>([]);
  const [loadingCloudHistory, setLoadingCloudHistory] = useState(false);

  // Text to Speech States
  const [text, setText] = useState<string>(() => {
    return language === 'zh'
      ? '您好！欢迎使用 ElevenLabs 声音平台。支持文本转语音、声音克隆以及多模型横向对比。'
      : 'Hello! Welcome to ElevenLabs voice development platform. Experience ultra-realistic generative audio with unmatched emotional fidelity.';
  });
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');
  const [selectedModelId, setSelectedModelId] = useState<string>('eleven_multilingual_v2');
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    stability: 45,
    similarity_boost: 75,
    style: 15,
    use_speaker_boost: true
  });

  // Comparison State
  const [comparisonModels, setComparisonModels] = useState<string[]>([
    'eleven_multilingual_v2',
    'eleven_flash_v2_5',
    'eleven_turbo_v2_5'
  ]);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult[]>([]);

  // Generation Loading States
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentGenerationUrl, setCurrentGenerationUrl] = useState<string | null>(null);

  // Speech to Speech States
  const [stsFile, setStsFile] = useState<File | null>(null);
  const [stsVoiceId, setStsVoiceId] = useState<string>('');
  const [stsModelId, setStsModelId] = useState<string>('eleven_multilingual_sts_v2');
  const [isStsTransforming, setIsStsTransforming] = useState(false);
  const [stsResultUrl, setStsResultUrl] = useState<string | null>(null);
  
  // Speech to Speech Mic State
  const [isStsRecording, setIsStsRecording] = useState(false);
  const [stsRecordSeconds, setStsRecordSeconds] = useState(0);
  const [stsRecorder, setStsRecorder] = useState<MediaRecorder | null>(null);
  const [stsRecordUrl, setStsRecordUrl] = useState<string | null>(null);
  const stsRecordTimer = useRef<NodeJS.Timeout | null>(null);

  // Voice Design States
  const [designParams, setDesignParams] = useState<VoiceDesignParams>({
    gender: 'female',
    accent: 'american',
    age: 'young',
    accent_strength: 1.0,
    text: 'Hello, this is a live test of my brand new custom designed voice accent coordinates.'
  });
  const [isDesigning, setIsDesigning] = useState(false);
  const [designedAudioUrl, setDesignedAudioUrl] = useState<string | null>(null);
  const [tempDesignToken, setTempDesignToken] = useState<string | null>(null);
  const [designSaveName, setDesignSaveName] = useState('');
  const [designSaveDesc, setDesignSaveDesc] = useState('');
  const [isSavingDesign, setIsSavingDesign] = useState(false);
  const [designSaveSuccess, setDesignSaveSuccess] = useState(false);

  // Presets
  const promptPresets = [
    {
      label: '新闻播报 (News)',
      text_zh: '根据最新消息，科技巨头今天发布了全新一代端到端语音大模型，该模型在延迟、情感表达以及多语种连贯性上达到了行业领先水平。',
      text_en: 'According to the latest reports, researchers released a next-generation end-to-end voice model with industry-leading metrics in latency and coherence.',
      style: { stability: 65, similarity_boost: 85, style: 5, use_speaker_boost: true }
    },
    {
      label: '有声书 (Audiobook)',
      text_zh: '深夜里，风悄悄吹拂着窗帘。他独自坐在书桌旁，看着那张泛黄的照片，心中涌起无限的思念。',
      text_en: 'Late at night, the wind gently rustled the curtains. Sitting alone at his desk, a wave of nostalgia washed over him.',
      style: { stability: 35, similarity_boost: 70, style: 45, use_speaker_boost: true }
    },
    {
      label: '商业广告 (Advert)',
      text_zh: '震撼大促来啦！即日起，全场商品限时五折起，更有超值优惠券等你来抢！立即体验前所未有的视听盛宴！',
      text_en: 'The biggest sale of the season is here! Unlock premium creative superpowers and take your workflow to the next level today.',
      style: { stability: 45, similarity_boost: 75, style: 60, use_speaker_boost: true }
    },
    {
      label: '低语 (Whisper)',
      text_zh: '嘘…… 别说话。闭上眼睛，深呼吸。让所有的疲惫和压力都随着呼吸慢慢飘走。好好睡吧……',
      text_en: 'Shh... close your eyes and breathe deep. Let all your stress drift away into the quiet evening.',
      style: { stability: 25, similarity_boost: 65, style: 30, use_speaker_boost: true }
    }
  ];

  // Fetch Core System Assets
  const loadSystemData = async () => {
    try {
      setLoadingStatus(true);
      const statusRes = await apiFetch('/api/status');
      const statusData: ApiStatus = await statusRes.json();
      setApiStatus(statusData);

      const modelsRes = await apiFetch('/api/models');
      const modelsData = modelsRes.ok ? await modelsRes.json() : [];
      setModels(Array.isArray(modelsData) ? modelsData : []);

      const voicesRes = await apiFetch('/api/voices');
      const voicesData = voicesRes.ok ? await voicesRes.json() : { voices: [] };
      const loadedVoices = voicesData.voices || [];
      setVoices(loadedVoices);

      if (loadedVoices.length > 0) {
        setSelectedVoiceId(loadedVoices[0].voice_id);
        setStsVoiceId(loadedVoices[0].voice_id);
      }

    } catch (err) {
      console.error('Failed load core data:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    loadSystemData();
  }, [customBaseUrl, customApiKey]);

  // Fetch Cloud Saved History logs
  const fetchCloudHistory = async () => {
    try {
      setLoadingCloudHistory(true);
      const res = await apiFetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setCloudHistory(data.history || []);
      }
    } catch (err) {
      console.error('Failed to fetch ElevenLabs cloud history:', err);
    } finally {
      setLoadingCloudHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchCloudHistory();
    }
  }, [activeTab]);

  // Sync state with storage
  const saveHistoryToStorage = (updatedHistory: HistoryItem[]) => {
    setHistoryItems(updatedHistory);
  };

  // 1. TTS Synthesis Handler
  const handleGenerateTTS = async () => {
    if (!text.trim()) return;
    setIsGenerating(true);
    setCurrentGenerationUrl(null);

    const startTime = Date.now();
    try {
      const response = await apiFetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice_id: selectedVoiceId,
          model_id: selectedModelId,
          voice_settings: {
            stability: voiceSettings.stability / 100,
            similarity_boost: voiceSettings.similarity_boost / 100,
            style: voiceSettings.style / 100,
            use_speaker_boost: voiceSettings.use_speaker_boost
          }
        })
      });

      if (!response.ok) {
        throw new Error('Speech synthesis endpoint failure');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const latency = Date.now() - startTime;
      
      setCurrentGenerationUrl(audioUrl);

      const voiceObj = voices.find(v => v.voice_id === selectedVoiceId);
      const modelObj = models.find(m => m.model_id === selectedModelId);
      
      const newHistoryItem: HistoryItem = {
        id: 'hist_' + Math.random().toString(36).substring(2, 11),
        text: text,
        voice_id: selectedVoiceId,
        voice_name: voiceObj ? voiceObj.name : 'Unknown Voice',
        model_id: selectedModelId,
        model_name: modelObj ? modelObj.name : selectedModelId,
        voice_settings: { ...voiceSettings },
        timestamp: Date.now(),
        audioUrl: audioUrl,
        latency: latency,
        fileSize: (audioBlob.size / 1024).toFixed(1),
        rating: 0,
        comment: '',
        source: 'tts'
      };

      saveHistoryToStorage([newHistoryItem, ...historyItems]);
    } catch (err) {
      console.error(err);
      alert(language === 'zh' ? '生成语音出错，请检查接口配置！' : 'Speech synthesis failed. Check API configuration.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Parallel Models Matrix Evaluation
  const handleCompareModels = async () => {
    if (!text.trim() || comparisonModels.length === 0) return;
    setIsComparing(true);
    setComparisonResults([]);

    const activeVoiceObj = voices.find(v => v.voice_id === selectedVoiceId);
    const voiceName = activeVoiceObj ? activeVoiceObj.name : 'Selected Voice';

    const promises = comparisonModels.map(async (modelId) => {
      const modelObj = models.find(m => m.model_id === modelId);
      const modelName = modelObj ? modelObj.name : modelId;
      const startTime = Date.now();

      try {
        const response = await apiFetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            voice_id: selectedVoiceId,
            model_id: modelId,
            voice_settings: {
              stability: voiceSettings.stability / 100,
              similarity_boost: voiceSettings.similarity_boost / 100,
              style: voiceSettings.style / 100,
              use_speaker_boost: voiceSettings.use_speaker_boost
            }
          })
        });

        if (!response.ok) {
          throw new Error(`Model ${modelId} execution failed`);
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const latency = Date.now() - startTime;
        const fileSize = (audioBlob.size / 1024).toFixed(1);

        const newHistoryItem: HistoryItem = {
          id: 'hist_' + Math.random().toString(36).substring(2, 11),
          text: text,
          voice_id: selectedVoiceId,
          voice_name: voiceName,
          model_id: modelId,
          model_name: modelName,
          voice_settings: { ...voiceSettings },
          timestamp: Date.now(),
          audioUrl: audioUrl,
          latency: latency,
          fileSize: fileSize,
          rating: 0,
          comment: `[${language === 'zh' ? '多模型横向对比评估组' : 'Multi-Model Comparative Evaluation'}]`,
          source: 'tts'
        };

        return {
          model_id: modelId,
          model_name: modelName,
          voice_id: selectedVoiceId,
          voice_name: voiceName,
          audioUrl: audioUrl,
          latency: latency,
          fileSize: `${fileSize} KB`,
          rating: 0,
          comment: '',
          voice_settings: { ...voiceSettings },
          text: text,
          historyItem: newHistoryItem
        };
      } catch (err) {
        console.error(`Error comparing model ${modelId}:`, err);
        return {
          model_id: modelId,
          model_name: modelName,
          voice_id: selectedVoiceId,
          voice_name: voiceName,
          audioUrl: '',
          latency: 0,
          fileSize: '0 KB',
          rating: 0,
          comment: 'Failed',
          voice_settings: { ...voiceSettings },
          text: text,
          error: true
        };
      }
    });

    const results = await Promise.all(promises);
    const validResults = results.filter(r => !r.error) as any[];
    
    setComparisonResults(validResults);
    setIsComparing(false);

    const successfulHistories = validResults.map(r => r.historyItem);
    if (successfulHistories.length > 0) {
      saveHistoryToStorage([...successfulHistories, ...historyItems]);
    }
  };

  // 3. Speech to Speech handler
  const handleStsTransform = async () => {
    if (!stsFile) {
      alert(language === 'zh' ? '请先录制或上传原始声音音频' : 'Please provide a source vocal audio file first');
      return;
    }
    setIsStsTransforming(true);
    setStsResultUrl(null);

    const startTime = Date.now();
    try {
      const formData = new FormData();
      formData.append('file', stsFile);
      formData.append('voice_id', stsVoiceId);
      formData.append('model_id', stsModelId);
      formData.append('voice_settings', JSON.stringify({
        stability: voiceSettings.stability / 100,
        similarity_boost: voiceSettings.similarity_boost / 100,
        style: voiceSettings.style / 100,
        use_speaker_boost: voiceSettings.use_speaker_boost
      }));

      const res = await apiFetch('/api/sts', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        throw new Error('STS conversion returned error');
      }

      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      setStsResultUrl(audioUrl);

      const voiceObj = voices.find(v => v.voice_id === stsVoiceId);
      const newHistoryItem: HistoryItem = {
        id: 'hist_sts_' + Math.random().toString(36).substring(2, 11),
        text: `[STS: ${stsFile.name}]`,
        voice_id: stsVoiceId,
        voice_name: voiceObj ? voiceObj.name : 'Unknown Voice',
        model_id: stsModelId,
        model_name: stsModelId === 'eleven_multilingual_sts_v2' ? 'Eleven Multilingual STS v2' : stsModelId,
        voice_settings: { ...voiceSettings },
        timestamp: Date.now(),
        audioUrl: audioUrl,
        latency: Date.now() - startTime,
        fileSize: (audioBlob.size / 1024).toFixed(1),
        rating: 0,
        comment: '[Speech-to-Speech Output]',
        source: 'sts'
      };

      saveHistoryToStorage([newHistoryItem, ...historyItems]);
    } catch (err) {
      console.error(err);
      alert(language === 'zh' ? '转换音色失败，请重试' : 'Speech-to-Speech transformation failed. Please retry.');
    } finally {
      setIsStsTransforming(false);
    }
  };

  // STS Microphone live recording
  const startStsRecording = async () => {
    setStsRecordUrl(null);
    setStsFile(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setStsRecordUrl(url);
        
        const file = new File([blob], "recorded_speech_sts.wav", { type: "audio/wav" });
        setStsFile(file);

        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setStsRecorder(recorder);
      setIsStsRecording(true);
      setStsRecordSeconds(0);

      stsRecordTimer.current = setInterval(() => {
        setStsRecordSeconds(p => {
          if (p >= 30) {
            stopStsRecording(recorder);
            return 30;
          }
          return p + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Mic access error for STS:', err);
      alert(language === 'zh' ? '未能调取麦克风，请检查网页麦克风权限' : 'Microphone access denied. Please check permissions.');
    }
  };

  const stopStsRecording = (activeRec?: MediaRecorder) => {
    const r = activeRec || stsRecorder;
    if (r && r.state !== 'inactive') {
      r.stop();
    }
    if (stsRecordTimer.current) {
      clearInterval(stsRecordTimer.current);
      stsRecordTimer.current = null;
    }
    setIsStsRecording(false);
  };

  // 4. Custom Voice Design synthesis handler
  const handleVoiceDesignGenerate = async () => {
    setIsDesigning(true);
    setDesignedAudioUrl(null);
    setTempDesignToken(null);
    setDesignSaveSuccess(false);

    try {
      const res = await apiFetch('/api/voice-design/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: designParams.text,
          model_id: 'eleven_multilingual_ttv_v2',
          voice_description: `${designParams.gender} voice, ${designParams.age}, ${designParams.accent} accent with accent strength ${designParams.accent_strength}`
        })
      });

      if (!res.ok) {
        throw new Error('Voice Design generation failed');
      }

      const genToken = res.headers.get('x-generated-voice-id') || res.headers.get('X-Generated-Voice-Id');
      if (genToken) {
        setTempDesignToken(genToken);
      }

      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      setDesignedAudioUrl(audioUrl);
    } catch (err) {
      console.error(err);
      alert(language === 'zh' ? '设计音色生成失败' : 'Failed to generate designed voice formulation.');
    } finally {
      setIsDesigning(false);
    }
  };

  const handleSaveDesignedVoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempDesignToken || !designSaveName.trim()) return;
    setIsSavingDesign(true);

    try {
      const res = await apiFetch('/api/voice-design/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voice_name: designSaveName,
          voice_description: designSaveDesc || `Designed ${designParams.gender} voice with ${designParams.accent} accent.`,
          generated_voice_id: tempDesignToken
        })
      });

      if (!res.ok) {
        throw new Error('Failed to save designed voice');
      }

      const data = await res.json();
      const savedVoice: Voice = data.voice || data;
      setVoices(prev => [savedVoice, ...prev]);
      setSelectedVoiceId(savedVoice.voice_id);
      
      setDesignSaveSuccess(true);
      setDesignSaveName('');
      setDesignSaveDesc('');
      setTempDesignToken(null);
      setDesignedAudioUrl(null);

      setTimeout(() => {
        setActiveTab('library');
        setDesignSaveSuccess(false);
      }, 2000);
    } catch (err) {
      console.error(err);
      alert(language === 'zh' ? '保存设计声音失败' : 'Failed to register your custom designed speaker.');
    } finally {
      setIsSavingDesign(false);
    }
  };

  // 5. Delete custom voice (cloned or designed)
  const handleDeleteVoice = async (voiceId: string) => {
    const confirmMsg = language === 'zh' 
      ? '确定要从声音库中删除这个自定义声音吗？' 
      : 'Are you sure you want to delete this custom voice from your library?';
    if (!confirm(confirmMsg)) return;

    try {
      const response = await apiFetch(`/api/voices/${voiceId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setVoices(prev => prev.filter(v => v.voice_id !== voiceId));
        if (selectedVoiceId === voiceId) {
          const remaining = voices.filter(v => v.voice_id !== voiceId);
          if (remaining.length > 0) {
            setSelectedVoiceId(remaining[0].voice_id);
          }
        }
      } else {
        alert(language === 'zh' ? '删除声音失败' : 'Failed to delete voice.');
      }
    } catch (err) {
      console.error('Failed to delete voice:', err);
    }
  };

  const handleUpdateComparisonRating = (modelId: string, rating: number) => {
    setComparisonResults(prev => prev.map(res => {
      if (res.model_id === modelId) {
        return { ...res, rating };
      }
      return res;
    }));
  };

  const handleUpdateComparisonComment = (modelId: string, comment: string) => {
    setComparisonResults(prev => prev.map(res => {
      if (res.model_id === modelId) {
        return { ...res, comment };
      }
      return res;
    }));
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const exportComparisonReport = () => {
    const reportData = {
      evaluation_date: new Date().toISOString(),
      prompt_text: text,
      voice_tested: voices.find(v => v.voice_id === selectedVoiceId)?.name || selectedVoiceId,
      voice_settings: voiceSettings,
      evaluations: comparisonResults.map(r => ({
        model_id: r.model_id,
        model_name: r.model_name,
        latency_ms: r.latency,
        file_size: r.fileSize,
        score: r.rating,
        feedback: r.comment
      }))
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `elevenlabs-evaluation-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const applyPreset = (preset: typeof promptPresets[0]) => {
    setText(language === 'zh' ? preset.text_zh : preset.text_en);
    setVoiceSettings({
      stability: preset.style.stability,
      similarity_boost: preset.style.similarity_boost,
      style: preset.style.style,
      use_speaker_boost: preset.style.use_speaker_boost
    });
  };

  return (
    <div id="elevenlabs_app_container" className="min-h-screen bg-[#fafafa] text-gray-900 flex font-sans antialiased">
      
      {/* LEFT SIDEBAR NAVIGATION (Collapsible & Mobile Drawer) */}
      <SidebarNavigation
        language={language}
        t={t}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        toggleLanguage={toggleLanguage}
        onOpenSettings={() => {
          setShowSettings(true);
          setTempBaseUrl(customBaseUrl);
          setTempApiKey(customApiKey);
        }}
        apiStatus={apiStatus}
        customBaseUrl={customBaseUrl}
        customApiKey={customApiKey}
      />

      {/* RIGHT MAIN WORKSPACE COLUMN */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* TOP HEADER BAR */}
        <header id="header_section" className="h-14 border-b border-gray-200 bg-white sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-xs">
          
          {/* Left: Mobile hamburger menu & active tab title / breadcrumb */}
          <div className="flex items-center space-x-3 min-w-0">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-black transition"
              title="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Desktop Quick Expand Icon when collapsed */}
            {isSidebarCollapsed && (
              <button
                onClick={toggleSidebarCollapse}
                className="hidden lg:flex p-1.5 hover:bg-gray-100 rounded-md text-gray-500 hover:text-black transition"
                title={language === 'zh' ? '展开左侧导航栏' : 'Expand sidebar'}
              >
                <PanelLeftOpen className="h-4 w-4" />
              </button>
            )}

            {/* Tab Breadcrumb / Title */}
            <div className="flex items-center space-x-2 text-xs font-semibold text-gray-800 truncate">
              <span className="text-gray-400 font-normal hidden sm:inline">ElevenLabs</span>
              <span className="text-gray-300 hidden sm:inline">/</span>
              <span className="text-gray-900 font-bold truncate">
                {activeTab === 'tts' && t.tab_tts}
                {activeTab === 'sts' && t.tab_sts}
                {activeTab === 'cloning' && t.tab_cloning}
                {activeTab === 'design' && t.tab_design}
                {activeTab === 'music' && t.tab_music}
                {activeTab === 'sfx' && t.tab_sfx}
                {activeTab === 'isolation' && t.tab_isolation}
                {activeTab === 'scribe' && t.tab_scribe}
                {activeTab === 'dubbing' && t.tab_dubbing}
                {activeTab === 'dictionaries' && t.tab_dictionaries}
                {activeTab === 'market' && t.tab_market}
                {activeTab === 'library' && t.tab_library}
                {activeTab === 'agents' && t.tab_agents}
                {activeTab === 'enterprise' && t.tab_enterprise}
                {activeTab === 'history' && t.tab_history}
                {activeTab === 'workbench' && t.tab_workbench}
              </span>
            </div>
          </div>

          {/* Center: Search Box (Responsive, matches ElevenLabs Search bar) */}
          <div className="hidden md:flex items-center max-w-xs w-full mx-4">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                readOnly
                placeholder={language === 'zh' ? '搜索声音、模型或工具...' : 'Search everything...'}
                className="w-full bg-gray-50 hover:bg-gray-100/80 border border-gray-200 rounded-lg pl-8 pr-8 py-1.5 text-xs text-gray-700 placeholder-gray-400 focus:outline-none transition cursor-pointer"
              />
              <kbd className="absolute right-2 top-2 px-1.5 py-0.5 text-[9px] font-mono text-gray-400 bg-white border border-gray-200 rounded">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Language Switch */}
            <button
              id="lang_toggle_btn"
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium transition shadow-xs"
              title="Switch Language / 切换双语"
            >
              <Globe className="h-3.5 w-3.5 text-gray-500" />
              <span className="hidden sm:inline">{language === 'zh' ? 'English' : '中文'}</span>
            </button>

            {/* API Key Settings Button */}
            <button
              id="custom_config_toggle_btn"
              onClick={() => {
                setShowSettings(!showSettings);
                setTempBaseUrl(customBaseUrl);
                setTempApiKey(customApiKey);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition border shadow-xs ${
                showSettings || customBaseUrl || customApiKey
                  ? 'bg-black text-white border-black'
                  : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
              }`}
              title="API Key Configuration"
            >
              <Settings className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{language === 'zh' ? '配置 Key' : 'API Keys'}</span>
            </button>

            {/* Status Badge */}
            <div className="flex items-center space-x-1.5 bg-white py-1.5 px-2.5 border border-gray-200 rounded-lg text-xs shadow-xs">
              <div className={`h-2 w-2 rounded-full ${
                customBaseUrl
                  ? 'bg-blue-500'
                  : apiStatus.configured
                  ? 'bg-emerald-500'
                  : 'bg-amber-500'
              }`} />
              <span className="text-[11px] font-medium text-gray-600 hidden sm:inline">
                {customBaseUrl
                  ? t.mode_custom_proxy
                  : apiStatus.configured
                  ? t.mode_official_direct
                  : language === 'zh' ? '未配置 API Key' : 'API key required'}
              </span>
            </div>
          </div>
        </header>

        {/* CUSTOM CONFIG PANEL */}
        {showSettings && (
          <div id="custom_config_panel" className="bg-white border-b border-gray-200 p-6 shadow-sm animate-in fade-in duration-200 shrink-0">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Key className="h-4 w-4 text-gray-700" />
                    <span>{t.custom_config_title}</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {t.custom_config_desc}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="p-1 hover:bg-gray-100 rounded text-gray-500 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {settingsSuccessMessage && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium">
                  {settingsSuccessMessage}
                </div>
              )}

              <form onSubmit={handleSaveConfig} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {t.custom_url_label}
                  </label>
                  <input
                    type="url"
                    value={tempBaseUrl}
                    onChange={(e) => setTempBaseUrl(e.target.value)}
                    placeholder={t.custom_url_placeholder}
                    className="w-full text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {t.custom_key_label}
                  </label>
                  <input
                    type="password"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder={t.custom_key_placeholder}
                    className="w-full text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black font-mono"
                  />
                </div>

                <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 mt-2 pt-4 border-t border-gray-100">
                  <div className="text-[11px] text-gray-500">
                    {language === 'zh' 
                      ? '* 本地配置仅保存在当前浏览器 LocalStorage 中，服务端代理安全转发。' 
                      : '* Configurations stored locally in LocalStorage & securely proxied.'}
                  </div>
                  <div className="flex items-center space-x-2">
                    {(customBaseUrl || customApiKey) && (
                      <button
                        type="button"
                        onClick={handleResetConfig}
                        className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-medium transition"
                      >
                        {t.btn_reset_config}
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-black hover:bg-gray-800 text-white font-medium rounded-lg text-xs transition"
                    >
                      {t.btn_save_config}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MAIN SCROLLABLE DISPLAY REGION */}
        <main id="main_panel_content" className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {loadingStatus ? (
            <div className="h-96 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="h-6 w-6 text-gray-400 animate-spin" />
              <p className="text-gray-500 text-xs">Loading ElevenLabs voice environment...</p>
            </div>
          ) : (
            <>
              {/* TTS */}
              {activeTab === 'tts' && (
                <TtsStudioTab
                  language={language}
                  t={t}
                  voices={voices}
                  models={models}
                  selectedVoiceId={selectedVoiceId}
                  setSelectedVoiceId={setSelectedVoiceId}
                  selectedModelId={selectedModelId}
                  setSelectedModelId={setSelectedModelId}
                  text={text}
                  setText={setText}
                  voiceSettings={voiceSettings}
                  setVoiceSettings={setVoiceSettings}
                  isGenerating={isGenerating}
                  isComparing={isComparing}
                  comparisonModels={comparisonModels}
                  setComparisonModels={setComparisonModels}
                  handleGenerateTTS={handleGenerateTTS}
                  handleCompareModels={handleCompareModels}
                  currentAudioUrl={currentGenerationUrl}
                  historyItems={historyItems}
                  comparisonResults={comparisonResults}
                  handleUpdateComparisonRating={handleUpdateComparisonRating}
                  handleUpdateComparisonComment={handleUpdateComparisonComment}
                  exportComparisonReport={exportComparisonReport}
                  applyPreset={applyPreset}
                  promptPresets={promptPresets}
                />
              )}

              {/* STS */}
              {activeTab === 'sts' && (
                <StsStudioTab
                  language={language}
                  t={t}
                  voices={voices}
                  stsVoiceId={stsVoiceId}
                  setStsVoiceId={setStsVoiceId}
                  stsModelId={stsModelId}
                  setStsModelId={setStsModelId}
                  isStsRecording={isStsRecording}
                  stsRecordSeconds={stsRecordSeconds}
                  stsRecordUrl={stsRecordUrl}
                  stsFile={stsFile}
                  setStsFile={setStsFile}
                  setStsRecordUrl={setStsRecordUrl}
                  startStsRecording={startStsRecording}
                  stopStsRecording={stopStsRecording}
                  isStsTransforming={isStsTransforming}
                  handleStsTransform={handleStsTransform}
                  stsResultUrl={stsResultUrl}
                  formatTime={formatTime}
                />
              )}

              {/* Voice Cloning */}
              {activeTab === 'cloning' && (
                <VoiceCloningTab
                  language={language}
                  t={t}
                  apiFetch={apiFetch}
                  apiStatus={apiStatus}
                  onVoiceAdded={(newVoice) => {
                    setVoices(prev => {
                      if (prev.some(v => v.voice_id === newVoice.voice_id)) return prev;
                      return [newVoice, ...prev];
                    });
                    setSelectedVoiceId(newVoice.voice_id);
                    setStsVoiceId(newVoice.voice_id);
                  }}
                />
              )}

              {/* Voice Design */}
              {activeTab === 'design' && (
                <VoiceDesignTab
                  language={language}
                  t={t}
                  designParams={designParams}
                  setDesignParams={setDesignParams}
                  isDesigning={isDesigning}
                  handleVoiceDesignGenerate={handleVoiceDesignGenerate}
                  designedAudioUrl={designedAudioUrl}
                  tempDesignToken={tempDesignToken}
                  designSaveName={designSaveName}
                  setDesignSaveName={setDesignSaveName}
                  designSaveDesc={designSaveDesc}
                  setDesignSaveDesc={setDesignSaveDesc}
                  isSavingDesign={isSavingDesign}
                  handleSaveDesignedVoice={handleSaveDesignedVoice}
                  designSaveSuccess={designSaveSuccess}
                />
              )}

              {/* Music */}
              {activeTab === 'music' && (
                <MusicStudioTab
                  apiFetch={apiFetch}
                  apiKeyConfigured={apiStatus.configured || !!customApiKey}
                  onNotify={(msg, type) => {
                    if (type === 'error') alert(msg);
                  }}
                />
              )}

              {/* SFX */}
              {activeTab === 'sfx' && (
                <SoundEffectsTab
                  language={language}
                  t={t}
                  apiFetch={apiFetch}
                />
              )}

              {/* Isolation */}
              {activeTab === 'isolation' && (
                <AudioIsolationTab
                  language={language}
                  t={t}
                  apiFetch={apiFetch}
                />
              )}

              {/* Scribe */}
              {activeTab === 'scribe' && (
                <ScribeStudioTab
                  language={language}
                  t={t}
                  apiFetch={apiFetch}
                />
              )}

              {/* Dubbing */}
              {activeTab === 'dubbing' && (
                <DubbingStudioTab
                  language={language}
                  t={t}
                  apiFetch={apiFetch}
                />
              )}

              {/* Dictionaries */}
              {activeTab === 'dictionaries' && (
                <PronunciationTab
                  language={language}
                  t={t}
                  apiFetch={apiFetch}
                />
              )}

              {/* Market */}
              {activeTab === 'market' && (
                <SharedVoiceMarketTab
                  language={language}
                  t={t}
                  apiFetch={apiFetch}
                  onImportVoice={(newVoice) => {
                    setVoices(prev => {
                      if (prev.some(v => v.voice_id === newVoice.voice_id)) return prev;
                      return [newVoice, ...prev];
                    });
                  }}
                />
              )}

              {/* Library */}
              {activeTab === 'library' && (
                <VoiceLibraryTab
                  language={language}
                  t={t}
                  voices={voices}
                  onSelectVoice={(voiceId) => {
                    setSelectedVoiceId(voiceId);
                    setStsVoiceId(voiceId);
                    setActiveTab('tts');
                  }}
                  onDeleteVoice={handleDeleteVoice}
                />
              )}

              {/* History */}
              {activeTab === 'history' && (
                <HistoryTaskCenterTab
                  language={language}
                  t={t}
                  apiFetch={apiFetch}
                  models={models}
                  voices={voices}
                  historyItems={historyItems}
                  setHistoryItems={saveHistoryToStorage}
                  cloudHistory={cloudHistory}
                  loadingCloudHistory={loadingCloudHistory}
                  fetchCloudHistory={fetchCloudHistory}
                />
              )}

              {/* Agents */}
              {activeTab === 'agents' && (
                <AgentsStudioTab
                  language={language}
                  t={t}
                  apiFetch={apiFetch}
                  voices={voices}
                  models={models}
                />
              )}

              {/* Enterprise */}
              {activeTab === 'enterprise' && (
                <EnterpriseBillingTab
                  language={language}
                  t={t}
                  apiFetch={apiFetch}
                  apiStatus={apiStatus}
                  onOpenSettings={() => setShowSettings(true)}
                  onNavigateToTab={(tab) => handleSelectTab(tab as any)}
                />
              )}

              {/* Workbench */}
              {activeTab === 'workbench' && (
                <ApiWorkbenchTab
                  language={language}
                  t={t}
                  apiFetch={apiFetch}
                  apiStatus={apiStatus}
                  voices={voices}
                  models={models}
                />
              )}
            </>
          )}
        </main>

        {/* FOOTER */}
        <footer id="footer_section" className="border-t border-gray-200 bg-white px-6 py-3 text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p>{t.footer_text}</p>
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1.5"><Database className="h-3.5 w-3.5 text-gray-400" /> {t.footer_models_loaded}</span>
            <span>{t.footer_status_normal}</span>
          </div>
        </footer>

      </div>

    </div>
  );
}
