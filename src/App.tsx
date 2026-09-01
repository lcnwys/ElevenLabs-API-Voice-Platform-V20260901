import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Upload,
  Play,
  Pause,
  Sliders,
  Database,
  Trash2,
  Download,
  Sparkles,
  Plus,
  Volume2,
  Layers,
  Activity,
  Check,
  AlertCircle,
  X,
  Settings,
  Search,
  Star,
  FileText,
  Share2,
  History,
  SlidersHorizontal,
  RefreshCw,
  ChevronRight,
  Info,
  Calendar,
  MessageSquare,
  Award,
  HelpCircle,
  Globe,
  Save,
  CloudLightning,
  ShieldCheck,
  Bot,
  CreditCard,
  PieChart,
  Key,
  Wand2,
  Scissors,
  Film,
  BookOpen,
  Terminal,
  Music2
} from 'lucide-react';
import { translations } from './translations';
import { ApiStatus, VoiceModel, Voice, VoiceSettings, HistoryItem, ComparisonResult, CloudHistoryItem, VoiceDesignParams } from './types';
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

  // 3 Major Top-Level Category Modules: 'api' | 'agents' | 'enterprise'
  const [topCategory, setTopCategory] = useState<'api' | 'agents' | 'enterprise'>('api');

  // Full Official ElevenLabs Tab Suite
  const [activeTab, setActiveTab] = useState<
    'workbench' | 'tts' | 'sts' | 'cloning' | 'design' | 'music' | 'sfx' | 'isolation' | 'scribe' | 'dubbing' | 'dictionaries' | 'market' | 'agents' | 'enterprise' | 'library' | 'history'
  >('workbench');

  // Synchronize topCategory when activeTab changes
  const handleSelectTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab === 'agents') {
      setTopCategory('agents');
    } else if (tab === 'enterprise') {
      setTopCategory('enterprise');
    } else {
      setTopCategory('api');
    }
  };

  const handleSelectCategory = (cat: 'api' | 'agents' | 'enterprise') => {
    setTopCategory(cat);
    if (cat === 'agents') {
      setActiveTab('agents');
    } else if (cat === 'enterprise') {
      setActiveTab('enterprise');
    } else {
      if (activeTab === 'agents' || activeTab === 'enterprise') {
        setActiveTab('tts');
      }
    }
  };


  // Core States
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    configured: false,
    mode: 'simulator',
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
  const [historySearch, setHistorySearch] = useState('');
  const [historyModelFilter, setHistoryModelFilter] = useState('all');
  const [historyVoiceFilter, setHistoryVoiceFilter] = useState('all');

  // Cloud History logs fetched from ElevenLabs API
  const [cloudHistory, setCloudHistory] = useState<CloudHistoryItem[]>([]);
  const [loadingCloudHistory, setLoadingCloudHistory] = useState(false);

  // Text to Speech States
  const [text, setText] = useState<string>(() => {
    return language === 'zh'
      ? '您好！欢迎使用 ElevenLabs 声音平台。这是一个面向团队的声音评估与优化工具，支持文本转语音、声音克隆以及多模型横向对比。'
      : 'Hello! Welcome to the ElevenLabs voice development platform. This is a collaborative team evaluation sandbox for speech synthesis and custom voice cloning.';
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
  const [comparisonModels, setComparisonModels] = useState<string[]>(['eleven_flash_v2_5', 'eleven_turbo_v2_5', 'eleven_multilingual_v2']);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult[]>([]);

  // Generation Loading States
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentGenerationUrl, setCurrentGenerationUrl] = useState<string | null>(null);
  const [generationLatency, setGenerationLatency] = useState<number | null>(null);

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

  // Voice Cloning States
  const [cloneName, setCloneName] = useState('');
  const [cloneDescription, setCloneDescription] = useState('');
  const [cloneFile, setCloneFile] = useState<File | null>(null);
  const [isCloning, setIsCloning] = useState(false);
  const [cloneSuccess, setCloneSuccess] = useState(false);

  // Live Cloning Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);

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
      label: '新闻播报 (News Broadcast)',
      text_zh: '根据最新消息，科技巨头今天发布了全新一代端到端语音大模型，该模型在延迟、情感表达以及多语种连贯性上达到了行业领先水平，预计将广泛应用于实时客服和内容创作领域。',
      text_en: 'According to the latest reports, tech giants today released a next-generation end-to-end voice model. This neural system achieves industry-leading metrics in latency, emotional resonance, and multilingual coherence.',
      style: { stability: 65, similarity_boost: 85, style: 5, use_speaker_boost: true }
    },
    {
      label: '情感有声书 (Emotional Audiobook)',
      text_zh: '深夜里，风悄悄吹拂着窗帘。他独自坐在书桌旁，看着那张泛黄的照片，心中涌起无限的思念。他低声对自己说：“如果时间能重来，我一定会做出不一样的选择。”',
      text_en: 'Late at night, the wind gently rustled the curtains. Sitting alone at his desk, staring at the yellowed photograph, a wave of nostalgia washed over him. He whispered softly, "If only time could turn back."',
      style: { stability: 35, similarity_boost: 70, style: 45, use_speaker_boost: true }
    },
    {
      label: '快节奏广告 (Fast-paced Advert)',
      text_zh: '史无前例的超震撼大促来啦！即日起，全场商品限时五折起，更有超值优惠券等你来抢！立即下载应用，抢先体验前所未有的视听盛宴，绝对不容错过！',
      text_en: 'The biggest flash sale in history is here! Starting today, everything is up to fifty percent off. Grab your exclusive discount coupons now! Download the app and plunge into a stunning auditory feast today!',
      style: { stability: 45, similarity_boost: 75, style: 60, use_speaker_boost: true }
    },
    {
      label: '温柔悄悄话 (ASMR Whisper)',
      text_zh: '嘘…… 别说话。闭上眼睛，深呼吸。让所有的疲惫和压力都随着呼吸慢慢飘走。现在，整个世界都安静了下来，只有我的声音陪伴着你，好好睡吧……',
      text_en: 'Shh... quiet. Close your eyes and breathe deep. Let all your exhaustion and stress drift away with every breath. Right now, the world has fallen completely silent, and there is only my voice by your side.',
      style: { stability: 25, similarity_boost: 65, style: 30, use_speaker_boost: true }
    }
  ];

  // Fetch Core System Assets
  const loadSystemData = async () => {
    try {
      setLoadingStatus(true);
      // 1. Get status
      const statusRes = await apiFetch('/api/status');
      const statusData: ApiStatus = await statusRes.json();
      setApiStatus(statusData);

      // 2. Get models
      const modelsRes = await apiFetch('/api/models');
      const modelsData = await modelsRes.json();
      setModels(modelsData);

      // 3. Get voices
      const voicesRes = await apiFetch('/api/voices');
      const voicesData = await voicesRes.json();
      const loadedVoices = voicesData.voices || [];
      setVoices(loadedVoices);

      if (loadedVoices.length > 0) {
        setSelectedVoiceId(loadedVoices[0].voice_id);
        setStsVoiceId(loadedVoices[0].voice_id);
      }

      // 4. Load local logs history from LocalStorage
      const savedHistory = localStorage.getItem('elevenlabs_history_v2');
      if (savedHistory) {
        try {
          setHistoryItems(JSON.parse(savedHistory));
        } catch (e) {
          console.error('Failed parsing history logs:', e);
        }
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
    localStorage.setItem('elevenlabs_history_v2', JSON.stringify(updatedHistory));
  };

  // 1. TTS Synthesis Handler
  const handleGenerateTTS = async () => {
    if (!text.trim()) return;
    setIsGenerating(true);
    setCurrentGenerationUrl(null);
    setGenerationLatency(null);

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
      setGenerationLatency(latency);

      // Create evaluation item
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
      alert(language === 'zh' ? '生成语音出错，请检查接口或网络设置！' : 'Speech synthesis failed. Check key config or network.');
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
          comment: language === 'zh' ? '生成失败 / Failed' : 'Generation failed',
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

  const toggleComparisonModel = (modelId: string) => {
    if (comparisonModels.includes(modelId)) {
      if (comparisonModels.length > 1) {
        setComparisonModels(comparisonModels.filter(id => id !== modelId));
      }
    } else {
      setComparisonModels([...comparisonModels, modelId]);
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

      // Create history evaluation log for STS
      const voiceObj = voices.find(v => v.voice_id === stsVoiceId);
      const newHistoryItem: HistoryItem = {
        id: 'hist_sts_' + Math.random().toString(36).substring(2, 11),
        text: `[Speech to Speech Conversion File: ${stsFile.name}]`,
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
        comment: '[Speech-to-Speech Conversion Output]',
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
        body: JSON.stringify(designParams)
      });

      if (!res.ok) {
        throw new Error('Voice Design generation failed');
      }

      // Check for temporary generation token passed from back-end response header
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
      
      // Add custom voice directly to frontend voice state list
      const savedVoice: Voice = data.voice;
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

  // 5. Microphone recording for Voice Cloning
  const startRecording = async () => {
    setRecordedUrl(null);
    setCloneFile(null);
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
        setRecordedUrl(url);
        
        const file = new File([blob], "cloned_voice_recording.wav", { type: "audio/wav" });
        setCloneFile(file);

        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimer.current = setInterval(() => {
        setRecordingSeconds(prev => {
          if (prev >= 30) {
            stopRecording(recorder);
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone for cloning:', err);
      alert(language === 'zh' ? '未能调取麦克风，请确认麦克风权限' : 'Microphone access failed. Please confirm permissions.');
    }
  };

  const stopRecording = (activeRecorder?: MediaRecorder) => {
    const r = activeRecorder || mediaRecorder;
    if (r && r.state !== 'inactive') {
      r.stop();
    }
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
      recordingTimer.current = null;
    }
    setIsRecording(false);
  };

  // 6. Voice Cloning submit handler
  const handleCloneVoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloneName.trim()) {
      alert(language === 'zh' ? '请输入克隆声音名称' : 'Please input clone voice name');
      return;
    }
    if (!cloneFile) {
      alert(language === 'zh' ? '请上传音频文件或使用麦克风录制样本' : 'Please record or upload a speech sample file');
      return;
    }

    setIsCloning(true);
    setCloneSuccess(false);

    try {
      const formData = new FormData();
      formData.append('name', cloneName);
      formData.append('description', cloneDescription);
      formData.append('file', cloneFile);

      const response = await apiFetch('/api/voices/add', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Voice cloning registration failed');
      }

      const data = await response.json();
      const newlyAddedVoice: Voice = data.voice;
      
      setVoices(prev => [newlyAddedVoice, ...prev]);
      setSelectedVoiceId(newlyAddedVoice.voice_id);
      
      setCloneSuccess(true);
      setCloneName('');
      setCloneDescription('');
      setCloneFile(null);
      setRecordedUrl(null);

      setTimeout(() => {
        setActiveTab('tts');
        setCloneSuccess(false);
      }, 2000);
    } catch (err) {
      console.error(err);
      alert(language === 'zh' ? '克隆声音特征提取失败，请检查文件格式大小' : 'Vocal feature extraction failed. Ensure file duration is 10-30s.');
    } finally {
      setIsCloning(false);
    }
  };

  // 7. Delete custom voice (cloned or designed)
  const handleDeleteVoice = async (voiceId: string) => {
    const confirmMsg = language === 'zh' 
      ? '确定要从声音库中彻底删除这个自定义声音吗？此操作无法撤销。' 
      : 'Are you sure you want to delete this custom voice from your library? This action is irreversible.';
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
        alert(language === 'zh' ? '自定义声音已成功删除' : 'Custom speaker deleted successfully.');
      } else {
        alert(language === 'zh' ? '删除声音失败' : 'Failed to delete voice from registry.');
      }
    } catch (err) {
      console.error('Failed to delete voice:', err);
      alert('Error during voice deletion.');
    }
  };

  // 8. Delete Cloud ElevenLabs History Item
  const handleDeleteCloudHistoryItem = async (historyItemId: string) => {
    const confirmMsg = language === 'zh'
      ? '确定要从 ElevenLabs 云端存储中彻底删除此项生成吗？'
      : 'Are you sure you want to delete this generation from ElevenLabs cloud history?';
    if (!confirm(confirmMsg)) return;

    try {
      const res = await apiFetch(`/api/history/${historyItemId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setCloudHistory(prev => prev.filter(item => item.history_item_id !== historyItemId));
        alert(language === 'zh' ? '云端记录已彻底删除' : 'Cloud item deleted successfully.');
      } else {
        alert(language === 'zh' ? '删除云端记录失败' : 'Failed to delete cloud history item.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Local Evaluations helpers (Ratings / Feedback annotations)
  const handleUpdateRating = (id: string, rating: number) => {
    const updated = historyItems.map(item => item.id === id ? { ...item, rating } : item);
    saveHistoryToStorage(updated);
  };

  const handleUpdateComment = (id: string, comment: string) => {
    const updated = historyItems.map(item => item.id === id ? { ...item, comment } : item);
    saveHistoryToStorage(updated);
  };

  const handleDeleteHistoryItem = (id: string) => {
    const confirmMsg = language === 'zh' 
      ? '确定要从本地评测报告中删除这条生成记录吗？' 
      : 'Are you sure you want to delete this record from local evaluation logs?';
    if (confirm(confirmMsg)) {
      const updated = historyItems.filter(item => item.id !== id);
      saveHistoryToStorage(updated);
    }
  };

  const handleClearAllHistory = () => {
    if (confirm(t.clear_history_warn)) {
      saveHistoryToStorage([]);
    }
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

  // Rating & Comment updates in Model Comparison Matrix
  const handleUpdateComparisonRating = (modelId: string, rating: number) => {
    setComparisonResults(prev => prev.map(res => {
      if (res.model_id === modelId) {
        const match = historyItems.find(h => h.text === text && h.model_id === modelId);
        if (match) handleUpdateRating(match.id, rating);
        return { ...res, rating };
      }
      return res;
    }));
  };

  const handleUpdateComparisonComment = (modelId: string, comment: string) => {
    setComparisonResults(prev => prev.map(res => {
      if (res.model_id === modelId) {
        const match = historyItems.find(h => h.text === text && h.model_id === modelId);
        if (match) handleUpdateComment(match.id, comment);
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

  // Reports Exports
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

  const exportFullCsvLogs = () => {
    if (historyItems.length === 0) return;
    
    const headers = ['ID', 'Timestamp', 'Text', 'Voice Name', 'Voice ID', 'Model Name', 'Model ID', 'Stability', 'Similarity Boost', 'Style Exaggeration', 'Speaker Boost', 'Latency (ms)', 'Size (KB)', 'Rating', 'Team Comments', 'Source Type'];
    const rows = historyItems.map(item => [
      item.id,
      new Date(item.timestamp).toLocaleString(),
      `"${item.text.replace(/"/g, '""')}"`,
      item.voice_name,
      item.voice_id,
      item.model_name,
      item.model_id,
      item.voice_settings.stability,
      item.voice_settings.similarity_boost,
      item.voice_settings.style,
      item.voice_settings.use_speaker_boost ? 'TRUE' : 'FALSE',
      item.latency || 'N/A',
      item.fileSize || 'N/A',
      item.rating,
      `"${(item.comment || '').replace(/"/g, '""')}"`,
      item.source || 'tts'
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `elevenlabs-voice-evaluation-logs-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filters Local History List
  const filteredHistory = historyItems.filter(item => {
    const matchesSearch = item.text.toLowerCase().includes(historySearch.toLowerCase()) ||
                          item.comment.toLowerCase().includes(historySearch.toLowerCase());
    const matchesModel = historyModelFilter === 'all' || item.model_id === historyModelFilter;
    const matchesVoice = historyVoiceFilter === 'all' || item.voice_id === historyVoiceFilter;
    return matchesSearch && matchesModel && matchesVoice;
  });

  return (
    <div id="elevenlabs_app_container" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-slate-900">
      
      {/* TOP HEADER BAR (GLASSMORPHIC) */}
      <header id="header_section" className="border-b border-purple-500/20 bg-slate-950/60 backdrop-blur-xl sticky top-0 z-40 px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl shadow-purple-950/20">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="p-2.5 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-400/30 rounded-2xl text-purple-300 shadow-inner">
            <Volume2 className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>ElevenLabs</span>
              <span className="text-purple-300 text-[10px] font-bold px-2 py-0.5 bg-purple-500/15 border border-purple-400/30 rounded-full">STUDIO MATRIX</span>
            </h1>
            <p className="text-xs text-slate-400 font-light">{t.subtitle}</p>
          </div>
        </div>

        {/* 3 MAJOR TOP-LEVEL CATEGORIES NAVIGATION (GLASS PILL BAR) */}
        <div className="flex items-center p-1 bg-slate-900/70 border border-purple-500/25 rounded-2xl backdrop-blur-md shadow-inner">
          <button
            onClick={() => handleSelectCategory('api')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              topCategory === 'api'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/40 border border-purple-400/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>{t.cat_api}</span>
          </button>

          <button
            onClick={() => handleSelectCategory('agents')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              topCategory === 'agents'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/40 border border-purple-400/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <Bot className="h-3.5 w-3.5" />
            <span>{t.cat_agents}</span>
          </button>

          <button
            onClick={() => handleSelectCategory('enterprise')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              topCategory === 'enterprise'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/40 border border-purple-400/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>{t.cat_enterprise}</span>
          </button>
        </div>

        {/* CONTROLS AREA (LANGUAGE SELECTOR & API STATUS) */}
        <div className="flex items-center space-x-2.5 shrink-0 self-end sm:self-auto">
          {/* Bilingual Toggle Button */}
          <button
            id="lang_toggle_btn"
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/60 hover:bg-purple-900/20 border border-purple-500/20 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all backdrop-blur-sm"
            title="Switch Language / 切换双语"
          >
            <Globe className="h-3.5 w-3.5 text-purple-400" />
            <span>{language === 'zh' ? 'English' : '中文'}</span>
          </button>

          {/* Custom API Config Toggle Button */}
          <button
            id="custom_config_toggle_btn"
            onClick={() => {
              setShowSettings(!showSettings);
              setTempBaseUrl(customBaseUrl);
              setTempApiKey(customApiKey);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border backdrop-blur-sm ${
              showSettings || customBaseUrl || customApiKey
                ? 'bg-purple-500/15 border-purple-400/50 text-purple-300 hover:bg-purple-500/25'
                : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 text-slate-300 hover:text-white'
            }`}
            title="Custom API & Key Settings / 自定义接口配置"
          >
            <Settings className="h-3.5 w-3.5" />
            <span>{language === 'zh' ? '配置 Key' : 'API Keys'}</span>
            {(customBaseUrl || customApiKey) && (
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping ml-0.5" />
            )}
          </button>

          {/* API Status Badge with Mode Differentiation */}
          <div className="flex items-center space-x-2 bg-slate-950/70 py-1.5 px-3 border border-purple-500/20 rounded-xl text-xs backdrop-blur-sm">
            <div className={`h-2 w-2 rounded-full ${
              customBaseUrl
                ? 'bg-indigo-400 shadow-indigo-500/50 shadow'
                : apiStatus.configured
                ? 'bg-purple-400 shadow-purple-500/50 shadow'
                : 'bg-amber-400 shadow-amber-500/50 shadow'
            } animate-pulse`} />
            <span className="font-semibold text-slate-300">
              {customBaseUrl
                ? t.mode_custom_proxy
                : apiStatus.configured
                ? t.mode_official_direct
                : t.simulator_active}
            </span>
          </div>
        </div>
      </header>

      {/* CUSTOM CONFIGURATION PANEL (TESTING BOX) */}
      {showSettings && (
        <div id="custom_config_panel" className="bg-slate-950/85 backdrop-blur-2xl border-b border-purple-500/30 p-6 shadow-2xl transition-all duration-200 animate-in fade-in slide-in-from-top-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Key className="h-4 w-4 text-purple-400" />
                  {t.custom_config_title}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {t.custom_config_desc}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="p-1 hover:bg-purple-900/30 rounded-lg text-slate-400 hover:text-white transition-colors"
                title="Close / 关闭"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {settingsSuccessMessage && (
              <div className="mb-4 p-3 bg-purple-500/15 border border-purple-500/30 rounded-xl text-xs text-purple-300 font-medium">
                {settingsSuccessMessage}
              </div>
            )}

            <form onSubmit={handleSaveConfig} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <span>{t.custom_url_label}</span>
                  {(customBaseUrl || tempBaseUrl) && (
                    <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-purple-300 font-mono border border-purple-500/20">
                      {tempBaseUrl ? 'Customized' : 'Default'}
                    </span>
                  )}
                </label>
                <input
                  type="url"
                  value={tempBaseUrl}
                  onChange={(e) => setTempBaseUrl(e.target.value)}
                  placeholder={t.custom_url_placeholder}
                  className="w-full text-xs bg-slate-900/70 border border-purple-500/20 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>{t.custom_key_label}</span>
                  {tempApiKey && (
                    <span className="text-[10px] text-purple-300 font-semibold px-2 py-0.5 bg-purple-500/15 border border-purple-400/30 rounded-full">
                      xi-api-key Active
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  placeholder={t.custom_key_placeholder}
                  className="w-full text-xs bg-slate-900/70 border border-purple-500/20 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 font-mono"
                />
              </div>

              <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 mt-2 pt-4 border-t border-purple-500/20">
                <div className="text-[10px] text-slate-400">
                  {language === 'zh' 
                    ? '* 本地填入的密钥仅保存在当前浏览器的 LocalStorage 中，服务端代理转发至官方接口，绝不泄露。' 
                    : '* Configurations are stored in LocalStorage & local context. Credentials will not be exposed.'}
                </div>
                <div className="flex items-center space-x-3">
                  {(customBaseUrl || customApiKey) && (
                    <button
                      type="button"
                      onClick={handleResetConfig}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition-colors border border-slate-700/60"
                    >
                      {t.btn_reset_config}
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-purple-900/30"
                  >
                    {t.btn_save_config}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED INFORMATION AND BANNER FOR SIMULATOR MODE */}
      {!apiStatus.configured && (
        <div id="simulator_banner" className="bg-purple-950/20 border-b border-purple-500/20 px-6 py-3 text-xs text-purple-200/90 flex items-center justify-between backdrop-blur-sm">
          <div className="flex items-start space-x-2.5">
            <AlertCircle className="h-4.5 w-4.5 text-purple-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>{t.simulator_warning_title}</strong> {t.simulator_warning_body}
            </p>
          </div>
        </div>
      )}

      {/* CORE WORKSPACE */}
      <div id="core_workspace" className="flex-1 flex flex-col lg:flex-row">
        
        {/* SIDE BAR NAVIGATION */}
        <aside id="sidebar_nav" className="w-full lg:w-72 bg-slate-950/40 backdrop-blur-xl border-r border-purple-500/15 p-4 lg:p-5 space-y-4 flex-shrink-0">
          {/* Active Category Indicator Banner */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-900/20 to-indigo-950/30 border border-purple-500/25 text-xs">
            <span className="text-[10px] font-bold text-purple-400 tracking-wider uppercase block mb-1">
              {language === 'zh' ? '当前核心架构分区' : 'Current Category Domain'}
            </span>
            <div className="font-bold text-white flex items-center gap-1.5">
              {topCategory === 'api' && <SlidersHorizontal className="h-4 w-4 text-purple-400" />}
              {topCategory === 'agents' && <Bot className="h-4 w-4 text-purple-400" />}
              {topCategory === 'enterprise' && <ShieldCheck className="h-4 w-4 text-purple-400" />}
              <span>
                {topCategory === 'api' ? t.cat_api : topCategory === 'agents' ? t.cat_agents : t.cat_enterprise}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-normal font-light">
              {topCategory === 'api' ? t.cat_api_desc : topCategory === 'agents' ? t.cat_agents_desc : t.cat_enterprise_desc}
            </p>
          </div>

          {/* Sub-Tabs under Category 1: API */}
          {topCategory === 'api' && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase px-2 mb-1">
                {language === 'zh' ? '开发者套件 & 核心生成' : 'Developer & Audio APIs'}
              </p>

              {/* Tab Button 0: API Developer Workbench */}
              <button
                id="tab_btn_workbench"
                onClick={() => handleSelectTab('workbench')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'workbench'
                    ? 'bg-purple-500/20 text-purple-200 border border-purple-400/40 shadow-md shadow-purple-950/30 font-bold'
                    : 'text-slate-400 hover:bg-purple-950/20 hover:text-white border border-transparent'
                }`}
              >
                <Terminal className="h-4 w-4 shrink-0 text-purple-400" />
                <span>{t.tab_workbench}</span>
              </button>

              {/* Tab Button 1: TTS & Compare */}
              <button
                id="tab_btn_tts"
                onClick={() => handleSelectTab('tts')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'tts'
                    ? 'bg-purple-500/15 text-purple-300 border border-purple-400/30 shadow-md shadow-purple-950/30 font-bold'
                    : 'text-slate-400 hover:bg-purple-950/20 hover:text-white border border-transparent'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4 shrink-0" />
                <span>{t.tab_tts}</span>
              </button>

              {/* Tab Button 2: Speech-to-Speech */}
              <button
                id="tab_btn_sts"
                onClick={() => handleSelectTab('sts')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'sts'
                    ? 'bg-purple-500/15 text-purple-300 border border-purple-400/30 shadow-md shadow-purple-950/30 font-bold'
                    : 'text-slate-400 hover:bg-purple-950/20 hover:text-white border border-transparent'
                }`}
              >
                <CloudLightning className="h-4 w-4 shrink-0" />
                <span>{t.tab_sts}</span>
              </button>

              {/* Tab Button 3: Voice Cloning */}
              <button
                id="tab_btn_cloning"
                onClick={() => handleSelectTab('cloning')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'cloning'
                    ? 'bg-purple-500/15 text-purple-300 border border-purple-400/30 shadow-md shadow-purple-950/30 font-bold'
                    : 'text-slate-400 hover:bg-purple-950/20 hover:text-white border border-transparent'
                }`}
              >
                <Mic className="h-4 w-4 shrink-0" />
                <span>{t.tab_cloning}</span>
              </button>

              {/* Tab Button 4: Voice Design */}
              <button
                id="tab_btn_design"
                onClick={() => handleSelectTab('design')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'design'
                    ? 'bg-purple-500/15 text-purple-300 border border-purple-400/30 shadow-md shadow-purple-950/30 font-bold'
                    : 'text-slate-400 hover:bg-purple-950/20 hover:text-white border border-transparent'
                }`}
              >
                <Sparkles className="h-4 w-4 shrink-0" />
                <span>{t.tab_design}</span>
              </button>

              {/* Tab Button: AI Music Studio */}
              <button
                id="tab_btn_music"
                onClick={() => handleSelectTab('music')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'music'
                    ? 'bg-purple-500/15 text-purple-300 border border-purple-400/30 shadow-md shadow-purple-950/30 font-bold'
                    : 'text-slate-400 hover:bg-purple-950/20 hover:text-white border border-transparent'
                }`}
              >
                <Music2 className="h-4 w-4 shrink-0 text-indigo-400" />
                <span>{t.tab_music}</span>
              </button>

              {/* Tab Button: Sound Effects Studio */}
              <button
                id="tab_btn_sfx"
                onClick={() => handleSelectTab('sfx')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'sfx'
                    ? 'bg-purple-500/15 text-purple-300 border border-purple-400/30 shadow-md shadow-purple-950/30 font-bold'
                    : 'text-slate-400 hover:bg-purple-950/20 hover:text-white border border-transparent'
                }`}
              >
                <Wand2 className="h-4 w-4 shrink-0" />
                <span>{t.tab_sfx}</span>
              </button>

              <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase px-2 pt-3 mb-1">
                {language === 'zh' ? '处理与生产套件' : 'Processing & Production'}
              </p>

              {/* Tab Button: Audio Isolation */}
              <button
                id="tab_btn_isolation"
                onClick={() => handleSelectTab('isolation')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'isolation'
                    ? 'bg-purple-500/15 text-purple-300 border border-purple-400/30 shadow-md shadow-purple-950/30 font-bold'
                    : 'text-slate-400 hover:bg-purple-950/20 hover:text-white border border-transparent'
                }`}
              >
                <Scissors className="h-4 w-4 shrink-0" />
                <span>{t.tab_isolation}</span>
              </button>

              {/* Tab Button: Scribe STT */}
              <button
                id="tab_btn_scribe"
                onClick={() => handleSelectTab('scribe')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'scribe'
                    ? 'bg-purple-500/15 text-purple-300 border border-purple-400/30 shadow-md shadow-purple-950/30 font-bold'
                    : 'text-slate-400 hover:bg-purple-950/20 hover:text-white border border-transparent'
                }`}
              >
                <FileText className="h-4 w-4 shrink-0" />
                <span>{t.tab_scribe}</span>
              </button>

              {/* Tab Button: Dubbing Studio */}
              <button
                id="tab_btn_dubbing"
                onClick={() => handleSelectTab('dubbing')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'dubbing'
                    ? 'bg-purple-500/15 text-purple-300 border border-purple-400/30 shadow-md shadow-purple-950/30 font-bold'
                    : 'text-slate-400 hover:bg-purple-950/20 hover:text-white border border-transparent'
                }`}
              >
                <Film className="h-4 w-4 shrink-0" />
                <span>{t.tab_dubbing}</span>
              </button>

              {/* Tab Button: Pronunciation Dictionaries */}
              <button
                id="tab_btn_dictionaries"
                onClick={() => handleSelectTab('dictionaries')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'dictionaries'
                    ? 'bg-purple-500/15 text-purple-300 border border-purple-400/30 shadow-md shadow-purple-950/30 font-bold'
                    : 'text-slate-400 hover:bg-purple-950/20 hover:text-white border border-transparent'
                }`}
              >
                <BookOpen className="h-4 w-4 shrink-0" />
                <span>{t.tab_dictionaries}</span>
              </button>

              {/* Tab Button: Shared Voice Market */}
              <button
                id="tab_btn_market"
                onClick={() => handleSelectTab('market')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'market'
                    ? 'bg-purple-500/15 text-purple-300 border border-purple-400/30 shadow-md shadow-purple-950/30 font-bold'
                    : 'text-slate-400 hover:bg-purple-950/20 hover:text-white border border-transparent'
                }`}
              >
                <Globe className="h-4 w-4 shrink-0" />
                <span>{t.tab_market}</span>
              </button>

              {/* Tab Button: Voice Library */}
              <button
                id="tab_btn_library"
                onClick={() => handleSelectTab('library')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'library'
                    ? 'bg-purple-500/15 text-purple-300 border border-purple-400/30 shadow-md shadow-purple-950/30 font-bold'
                    : 'text-slate-400 hover:bg-purple-950/20 hover:text-white border border-transparent'
                }`}
              >
                <Layers className="h-4 w-4 shrink-0" />
                <span>{t.tab_library}</span>
              </button>

              {/* Tab Button: Evaluation logs & history */}
              <button
                id="tab_btn_history"
                onClick={() => handleSelectTab('history')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all relative ${
                  activeTab === 'history'
                    ? 'bg-purple-500/15 text-purple-300 border border-purple-400/30 shadow-md shadow-purple-950/30 font-bold'
                    : 'text-slate-400 hover:bg-purple-950/20 hover:text-white border border-transparent'
                }`}
              >
                <History className="h-4 w-4 shrink-0" />
                <span>{t.tab_history}</span>
                {historyItems.length > 0 && (
                  <span className="absolute right-3.5 top-2.5 px-1.5 py-0.5 text-[9px] font-extrabold bg-purple-500/30 text-purple-200 rounded-full border border-purple-400/40">
                    {historyItems.length}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Sub-Tabs under Category 2: Agents */}
          {topCategory === 'agents' && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase px-2 mb-1">
                {language === 'zh' ? 'Conversational AI 模块' : 'Conversational Modules'}
              </p>

              <button
                id="tab_btn_agents"
                onClick={() => handleSelectTab('agents')}
                className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-400/30 shadow-md shadow-purple-950/30 font-bold"
              >
                <Bot className="h-4 w-4 shrink-0" />
                <span>{t.tab_agents}</span>
              </button>
            </div>
          )}

          {/* Sub-Tabs under Category 3: Enterprise */}
          {topCategory === 'enterprise' && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase px-2 mb-1">
                {language === 'zh' ? '企业管理模块' : 'Management Modules'}
              </p>

              <button
                id="tab_btn_enterprise"
                onClick={() => handleSelectTab('enterprise')}
                className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-400/30 shadow-md shadow-purple-950/30 font-bold"
              >
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>{t.tab_enterprise}</span>
              </button>
            </div>
          )}


          <div className="pt-6 border-t border-slate-800 mt-6 space-y-4">
            <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase px-2">
              {t.export_title}
            </p>
            
            {/* Export CSV Logs Button */}
            <button
              id="export_csv_btn"
              onClick={exportFullCsvLogs}
              disabled={historyItems.length === 0}
              className="w-full flex items-center justify-between text-left px-3.5 py-2.5 text-xs font-medium rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/30 disabled:opacity-30 disabled:pointer-events-none transition"
            >
              <span className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-slate-500" />
                {t.export_csv}
              </span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          {/* SIDEBAR PARAMETER TUNING TIPS */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mt-8 space-y-2">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-emerald-400" />
              {t.guidance_title}
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {t.guidance_text}
            </p>
          </div>
        </aside>

        {/* MAIN DISPLAY REGION */}
        <main id="main_panel_content" className="flex-1 p-5 lg:p-8 overflow-y-auto">
          {loadingStatus ? (
            <div className="h-96 flex flex-col items-center justify-center space-y-4">
              <RefreshCw className="h-8 w-8 text-emerald-500 animate-spin" />
              <p className="text-slate-400 text-xs">Initializing core system data feeds...</p>
            </div>
          ) : (
            <>
              {/* TAB: DEVELOPER API WORKBENCH & CORE SCAFFOLDING */}
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

              {/* TAB 1: TEXT-TO-SPEECH & COMPONENT MATRIX */}
              {activeTab === 'tts' && (
                <div className="space-y-6">
                  {/* Title Bar with Preset selector */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <div>
                      <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                        {t.tts_title}
                      </h2>
                      <p className="text-slate-400 text-xs mt-0.5">{t.tts_desc}</p>
                    </div>

                    {/* Presets Button Selector */}
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-[11px] text-slate-500 font-bold uppercase">{t.preset_label}</span>
                      {promptPresets.map((preset, idx) => (
                        <button
                          key={idx}
                          onClick={() => applyPreset(preset)}
                          className="px-2.5 py-1 text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 rounded-lg transition"
                        >
                          {preset.label.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sandbox Layout */}
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Input Columns */}
                    <div className="xl:col-span-2 space-y-5">
                      {/* Prompts Input Box */}
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          {t.text_content_label}
                        </label>
                        <textarea
                          id="tts_textarea"
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                          maxLength={1000}
                          placeholder={t.text_placeholder}
                          className="w-full h-36 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all resize-none leading-relaxed"
                        />
                        <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium">
                          <span>{t.text_specs}</span>
                          <span>{text.length} / 1000 {t.text_count}</span>
                        </div>
                      </div>

                      {/* Control Option Cards (Single Generate vs Matrix Compare) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        
                        {/* Option A: Single Express voice generation */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                          <div>
                            <div className="flex items-center space-x-2 text-white font-bold mb-1">
                              <Sparkles className="h-4.5 w-4.5 text-emerald-400" />
                              <h3 className="text-xs uppercase tracking-wider">{t.single_gen_title}</h3>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                              {t.single_gen_desc}
                            </p>
                            
                            <div className="space-y-3">
                              {/* Voice selector */}
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">{t.target_voice}</label>
                                <select
                                  id="voice_select_single"
                                  value={selectedVoiceId}
                                  onChange={(e) => setSelectedVoiceId(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition cursor-pointer"
                                >
                                  {voices.map(voice => (
                                    <option key={voice.voice_id} value={voice.voice_id}>
                                      {voice.name} ({voice.category === 'cloned' ? t.voice_cloned : voice.category === 'designed' ? t.voice_designed : t.voice_official})
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Model Selection */}
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">{t.target_model}</label>
                                <select
                                  id="model_select_single"
                                  value={selectedModelId}
                                  onChange={(e) => setSelectedModelId(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition cursor-pointer"
                                >
                                  {models.map(model => (
                                    <option key={model.model_id} value={model.model_id}>
                                      {model.name} ({model.quality || 'HD'})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="pt-2">
                            <button
                              id="btn_generate_single"
                              onClick={handleGenerateTTS}
                              disabled={isGenerating || isComparing || !text.trim()}
                              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/20 disabled:opacity-45 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
                            >
                              {isGenerating ? (
                                <>
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                  <span>{t.generating}</span>
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4 fill-slate-950 text-slate-950" />
                                  <span>{t.btn_generate_single}</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Option B: Multi-Model Evaluation Comparison */}
                        <div className="bg-slate-900 border border-emerald-500/10 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                          <div>
                            <div className="flex items-center space-x-2 text-white font-bold mb-1">
                              <Layers className="h-4.5 w-4.5 text-emerald-400 animate-pulse" />
                              <h3 className="text-xs uppercase tracking-wider">{t.compare_title}</h3>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                              {t.compare_desc}
                            </p>

                            <div className="space-y-2.5">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase">{t.select_compare_models}</label>
                              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                {models.map(model => (
                                  <label
                                    key={model.model_id}
                                    className="flex items-center space-x-2.5 px-2.5 py-1.5 bg-slate-950 rounded-lg border border-slate-800 hover:border-slate-700 cursor-pointer text-[11px]"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={comparisonModels.includes(model.model_id)}
                                      onChange={() => toggleComparisonModel(model.model_id)}
                                      className="accent-emerald-500"
                                    />
                                    <span className="font-semibold text-slate-200">{model.name}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="pt-2">
                            <button
                              id="btn_generate_comparison"
                              onClick={handleCompareModels}
                              disabled={isGenerating || isComparing || !text.trim() || comparisonModels.length === 0}
                              className="w-full bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 font-bold text-xs py-3 px-4 rounded-xl transition-all disabled:opacity-45 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
                            >
                              {isComparing ? (
                                <>
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                  <span>{t.comparing}</span>
                                </>
                              ) : (
                                <>
                                  <Activity className="h-4 w-4 text-emerald-400" />
                                  <span>{t.btn_compare} ({comparisonModels.length})</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Fine-Tuning Slider Column */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center space-x-2">
                          <Sliders className="h-4.5 w-4.5 text-emerald-400" />
                          <h3 className="font-bold text-white text-xs uppercase tracking-wider">{t.param_panel_title}</h3>
                        </div>
                        <span className="text-[9px] text-slate-500 font-extrabold uppercase">{t.param_official}</span>
                      </div>

                      {/* Slider 1: Stability */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-300 font-bold">{t.param_stability} <span className="text-slate-500 font-normal">({voiceSettings.stability}%)</span></span>
                          <span className="text-slate-500 text-[10px]">
                            {voiceSettings.stability < 35 ? t.param_stability_low : voiceSettings.stability > 70 ? t.param_stability_high : t.param_stability_rec}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={voiceSettings.stability}
                          onChange={(e) => setVoiceSettings({ ...voiceSettings, stability: parseInt(e.target.value) })}
                          className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <p className="text-[10px] text-slate-400 leading-normal">
                          {t.param_stability_desc}
                        </p>
                      </div>

                      {/* Slider 2: Clarity / Similarity */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-300 font-bold">{t.param_clarity} <span className="text-slate-500 font-normal">({voiceSettings.similarity_boost}%)</span></span>
                          <span className="text-slate-500 text-[10px]">{voiceSettings.similarity_boost}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={voiceSettings.similarity_boost}
                          onChange={(e) => setVoiceSettings({ ...voiceSettings, similarity_boost: parseInt(e.target.value) })}
                          className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <p className="text-[10px] text-slate-400 leading-normal">
                          {t.param_clarity_desc}
                        </p>
                      </div>

                      {/* Slider 3: Style Exaggeration */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-300 font-bold">{t.param_style} <span className="text-slate-500 font-normal">({voiceSettings.style}%)</span></span>
                          <span className="text-slate-500 text-[10px]">{voiceSettings.style}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={voiceSettings.style}
                          onChange={(e) => setVoiceSettings({ ...voiceSettings, style: parseInt(e.target.value) })}
                          className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <p className="text-[10px] text-slate-400 leading-normal">
                          {t.param_style_desc}
                        </p>
                      </div>

                      {/* Toggle: Speaker Boost */}
                      <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl flex items-center justify-between">
                        <div className="pr-4 space-y-0.5">
                          <span className="text-xs font-bold text-slate-200">{t.param_speaker_boost}</span>
                          <p className="text-[10px] text-slate-400 leading-normal">
                            {t.param_speaker_boost_desc}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={voiceSettings.use_speaker_boost}
                            onChange={(e) => setVoiceSettings({ ...voiceSettings, use_speaker_boost: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-slate-950 peer-checked:after:border-slate-950"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* ACTIVE SINGLE AUDIO GENERATION STREAM PLAYER */}
                  {currentGenerationUrl && (
                    <div className="bg-slate-900 border border-emerald-500/20 rounded-2xl p-5 shadow-lg space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center space-x-2">
                          <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
                            <Check className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">{t.single_gen_success}</span>
                            <h4 className="text-xs font-bold text-white">
                              {voices.find(v => v.voice_id === selectedVoiceId)?.name} • {models.find(m => m.model_id === selectedModelId)?.name}
                            </h4>
                          </div>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-3">
                          <span>{t.time_cost}: <strong className="text-emerald-400">{generationLatency}ms</strong></span>
                          <a
                            href={currentGenerationUrl}
                            download={`elevenlabs-single-${Date.now()}.mp3`}
                            className="text-slate-400 hover:text-white transition flex items-center gap-1.5"
                          >
                            <Download className="h-3.5 w-3.5" />
                            {t.download_audio}
                          </a>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-850">
                        <audio src={currentGenerationUrl} controls className="w-full md:flex-1 accent-emerald-500" />
                        <div className="flex items-center space-x-2 shrink-0">
                          <span className="text-[11px] text-slate-500 font-mono">{t.dynamic_wave}:</span>
                          <div className="flex items-end gap-[2px] h-6 w-12">
                            <span className="w-[3px] bg-emerald-500/60 rounded-full animate-[bounce_1s_infinite_100ms] h-1.5"></span>
                            <span className="w-[3px] bg-emerald-500/60 rounded-full animate-[bounce_1s_infinite_300ms] h-4"></span>
                            <span className="w-[3px] bg-emerald-500/60 rounded-full animate-[bounce_1s_infinite_200ms] h-2.5"></span>
                            <span className="w-[3px] bg-emerald-500/60 rounded-full animate-[bounce_1s_infinite_500ms] h-5"></span>
                            <span className="w-[3px] bg-emerald-500/60 rounded-full animate-[bounce_1s_infinite_400ms] h-2"></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PARALLEL MULTI-MODEL COMPARISON RESULTS CONTAINER */}
                  {comparisonResults.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
                        <div>
                          <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <Layers className="h-4.5 w-4.5 text-emerald-400" />
                            {t.matrix_title}
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">{t.matrix_desc}</p>
                        </div>
                        <button
                          onClick={exportComparisonReport}
                          className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl py-2 px-3.5 text-xs font-semibold flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                          {t.export_json}
                        </button>
                      </div>

                      {/* The Grid Matrix Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {comparisonResults.map((result, idx) => (
                          <div key={idx} className="bg-slate-900 border border-slate-800 hover:border-emerald-500/20 rounded-2xl p-5 space-y-4 flex flex-col justify-between relative overflow-hidden group transition">
                            {result.rating >= 4 && (
                              <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-bl-lg tracking-wider">
                                {t.top_recommended}
                              </div>
                            )}

                            <div className="space-y-3">
                              {/* Headers and performance logs info */}
                              <div className="border-b border-slate-800 pb-2.5">
                                <h4 className="font-bold text-white text-xs">{result.model_name}</h4>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded-md text-[10px] text-slate-400 font-semibold uppercase">
                                    {t.sound_quality}: {result.model_id.includes('flash') ? 'Standard' : 'Ultra HD'}
                                  </span>
                                  <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-[10px] text-emerald-400 font-bold">
                                    {t.latency}: {result.latency}ms
                                  </span>
                                  <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded-md text-[10px] text-slate-400 font-mono">
                                    {t.size}: {result.fileSize}
                                  </span>
                                </div>
                              </div>

                              {/* Matrix Player */}
                              <div className="bg-slate-950 py-2 px-2.5 rounded-xl border border-slate-850 flex items-center gap-2">
                                <audio src={result.audioUrl} controls className="w-full accent-emerald-500 text-xs" />
                              </div>

                              {/* Team Scoring Stars */}
                              <div className="space-y-1 pt-1">
                                <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{t.team_rating}</span>
                                <div className="flex items-center space-x-1.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      onClick={() => handleUpdateComparisonRating(result.model_id, star)}
                                      className="transition hover:scale-110 cursor-pointer"
                                    >
                                      <Star
                                        className={`h-4 w-4 ${
                                          star <= result.rating
                                            ? 'fill-emerald-400 text-emerald-400'
                                            : 'text-slate-750 hover:text-slate-400'
                                        }`}
                                      />
                                    </button>
                                  ))}
                                  <span className="text-[11px] text-slate-400 font-extrabold ml-2">
                                    {result.rating > 0 ? `${result.rating}.0 / 5.0` : t.unrated}
                                  </span>
                                </div>
                              </div>

                              {/* Team commentary feedback scribble block */}
                              <div className="space-y-1">
                                <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{t.evaluation_notes}</span>
                                <textarea
                                  value={result.comment}
                                  onChange={(e) => handleUpdateComparisonComment(result.model_id, e.target.value)}
                                  placeholder={t.evaluation_notes_placeholder}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-700 h-16 focus:outline-none focus:border-emerald-500 transition-all resize-none"
                                />
                              </div>
                            </div>

                            <div className="text-[10px] text-slate-500 pt-1.5 flex items-center justify-between border-t border-slate-800/60 mt-1">
                              <span>{t.based_on_voice}: {result.voice_name}</span>
                              <span>Stability: {result.voice_settings.stability}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* TAB 2: SPEECH TO SPEECH TRANSFORMATION */}
              {activeTab === 'sts' && (
                <div className="space-y-6 max-w-3xl mx-auto">
                  <div>
                    <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                      <CloudLightning className="h-5 w-5 text-emerald-400" />
                      {t.sts_title}
                    </h2>
                    <p className="text-slate-400 text-xs mt-0.5">{t.sts_desc}</p>
                  </div>

                  {/* Speech to Speech interactive form card */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
                    <div className="space-y-3">
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                        {t.sts_source_audio}
                      </label>

                      {/* Recording and Upload grids */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        
                        {/* Recording Method */}
                        <div className="border border-slate-800 bg-slate-950 rounded-xl p-4 flex flex-col justify-between space-y-4">
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                              {t.clone_mic_method}
                            </h4>
                            <p className="text-[10px] text-slate-400 leading-normal">
                              {t.clone_mic_desc}
                            </p>
                          </div>

                          <div className="space-y-3 bg-slate-900/30 p-3 rounded-lg border border-slate-850">
                            <div className="flex items-center justify-between text-xs text-slate-400">
                              <span>{t.clone_recording_time}</span>
                              <span className={`font-mono text-[11px] ${isStsRecording ? 'text-red-400 font-extrabold' : ''}`}>
                                {formatTime(stsRecordSeconds)} / 00:30
                              </span>
                            </div>

                            {stsRecordUrl && !isStsRecording && (
                              <div className="space-y-1">
                                <span className="text-[10px] text-slate-500 font-bold">{t.sts_recorded_preview}:</span>
                                <audio src={stsRecordUrl} controls className="w-full h-8 accent-emerald-500" />
                              </div>
                            )}

                            <div className="flex gap-2">
                              {!isStsRecording ? (
                                <button
                                  type="button"
                                  onClick={startStsRecording}
                                  className="flex-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-semibold text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
                                >
                                  <Mic className="h-3.5 w-3.5" />
                                  {t.sts_start_record}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => stopStsRecording()}
                                  className="flex-1 bg-red-500 text-white font-extrabold text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 animate-pulse transition cursor-pointer"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  {t.sts_stop_record}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* File Upload Method */}
                        <div className="border border-slate-800 bg-slate-950 rounded-xl p-4 flex flex-col justify-between space-y-4">
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                              <Upload className="h-4 w-4 text-emerald-400" />
                              {t.clone_upload_method}
                            </h4>
                            <p className="text-[10px] text-slate-400 leading-normal">
                              {t.clone_upload_desc}
                            </p>
                          </div>

                          <div className="space-y-3">
                            <input
                              type="file"
                              accept="audio/*"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setStsFile(e.target.files[0]);
                                  setStsRecordUrl(null);
                                }
                              }}
                              className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20 file:cursor-pointer"
                            />
                            {stsFile && (
                              <p className="text-[10px] text-slate-500">
                                {t.sts_ready_file}: {stsFile.name} ({(stsFile.size / 1024 / 1024).toFixed(2)} MB)
                              </p>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Parameters selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-slate-800">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase mb-2">
                          {t.target_voice}
                        </label>
                        <select
                          value={stsVoiceId}
                          onChange={(e) => setStsVoiceId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none cursor-pointer"
                        >
                          {voices.map(voice => (
                            <option key={voice.voice_id} value={voice.voice_id}>
                              {voice.name} ({voice.category === 'cloned' ? t.voice_cloned : voice.category === 'designed' ? t.voice_designed : t.voice_official})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase mb-2">
                          {t.target_model}
                        </label>
                        <select
                          value={stsModelId}
                          onChange={(e) => setStsModelId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none cursor-pointer"
                        >
                          <option value="eleven_multilingual_sts_v2">Eleven Multilingual STS v2</option>
                          <option value="eleven_english_sts_v2">Eleven English STS v2 (Legacy)</option>
                        </select>
                      </div>
                    </div>

                    {/* Submission Button */}
                    <div className="pt-4 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={handleStsTransform}
                        disabled={isStsTransforming || !stsFile}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs py-3.5 px-4 rounded-xl shadow-lg hover:shadow-emerald-500/20 transition disabled:opacity-45 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isStsTransforming ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>{t.sts_transforming}</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 fill-slate-950" />
                            <span>{t.sts_btn_transform}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Transform output preview if ready */}
                  {stsResultUrl && (
                    <div className="bg-slate-900 border border-emerald-500/20 rounded-2xl p-5 shadow-lg space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center space-x-2">
                          <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
                            <Check className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">{t.sts_success}</span>
                            <h4 className="text-xs font-bold text-white">
                              {voices.find(v => v.voice_id === stsVoiceId)?.name} • Speech-to-Speech Output
                            </h4>
                          </div>
                        </div>
                        <a
                          href={stsResultUrl}
                          download={`elevenlabs-sts-${Date.now()}.mp3`}
                          className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1.5"
                        >
                          <Download className="h-4 w-4" />
                          {t.download_audio}
                        </a>
                      </div>

                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
                        <audio src={stsResultUrl} controls className="w-full accent-emerald-500" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: VOICE CLONING & PROFESSIONAL SLOTS (PVC / IVC) */}
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

              {/* TAB 4: VOICE DESIGN (AI ACOUSTICS COORDINATES GENERATOR) */}
              {activeTab === 'design' && (
                <div className="space-y-6 max-w-3xl mx-auto">
                  <div>
                    <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-emerald-400" />
                      {t.design_title}
                    </h2>
                    <p className="text-slate-400 text-xs mt-0.5">{t.design_desc}</p>
                  </div>

                  {designSaveSuccess && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl p-4 flex items-start gap-3">
                      <Check className="h-5 w-5 text-emerald-400 shrink-0" />
                      <div>
                        <h4 className="font-bold text-emerald-400 text-xs">{t.clone_success_banner}</h4>
                        <p className="text-[11px] text-emerald-300/80 mt-0.5">
                          {t.design_add_to_library}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Parameters Box */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
                        <Sliders className="h-4 w-4 text-emerald-400" />
                        {t.design_params_title}
                      </h3>

                      {/* Gender select */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">{t.design_gender}</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setDesignParams({ ...designParams, gender: 'female' })}
                            className={`py-2 px-3 text-xs rounded-xl border font-semibold transition ${
                              designParams.gender === 'female'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-slate-950 text-slate-400 border-slate-850 hover:border-slate-800'
                            }`}
                          >
                            {t.design_gender_female}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDesignParams({ ...designParams, gender: 'male' })}
                            className={`py-2 px-3 text-xs rounded-xl border font-semibold transition ${
                              designParams.gender === 'male'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-slate-950 text-slate-400 border-slate-850 hover:border-slate-800'
                            }`}
                          >
                            {t.design_gender_male}
                          </button>
                        </div>
                      </div>

                      {/* Accent select */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">{t.design_accent}</label>
                        <select
                          value={designParams.accent}
                          onChange={(e) => setDesignParams({ ...designParams, accent: e.target.value as any })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none"
                        >
                          <option value="american">{t.design_accent_us}</option>
                          <option value="british">{t.design_accent_uk}</option>
                          <option value="australian">{t.design_accent_au}</option>
                          <option value="african">{t.design_accent_african}</option>
                          <option value="indian">{t.design_accent_indian}</option>
                        </select>
                      </div>

                      {/* Age select */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">{t.design_age}</label>
                        <select
                          value={designParams.age}
                          onChange={(e) => setDesignParams({ ...designParams, age: e.target.value as any })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none"
                        >
                          <option value="young">{t.design_age_young}</option>
                          <option value="middle_aged">{t.design_age_middle}</option>
                          <option value="old">{t.design_age_old}</option>
                        </select>
                      </div>

                      {/* Accent Strength */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold text-slate-300">
                          <span>{t.design_accent_strength}</span>
                          <span className="text-emerald-400">{designParams.accent_strength}x</span>
                        </div>
                        <input
                          type="range"
                          min="30"
                          max="200"
                          value={designParams.accent_strength * 100}
                          onChange={(e) => setDesignParams({ ...designParams, accent_strength: parseFloat((parseInt(e.target.value) / 100).toFixed(2)) })}
                          className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Text Input Box & Execution */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                          {t.design_text_label}
                        </label>
                        <textarea
                          value={designParams.text}
                          onChange={(e) => setDesignParams({ ...designParams, text: e.target.value })}
                          placeholder={t.design_text_placeholder}
                          maxLength={500}
                          className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none resize-none leading-relaxed"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleVoiceDesignGenerate}
                        disabled={isDesigning || !designParams.text.trim()}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs py-3 px-4 rounded-xl shadow-md transition disabled:opacity-45 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isDesigning ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>{t.design_generating}</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 fill-slate-950" />
                            <span>{t.design_btn_generate}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Design result stream output player & Registration Form */}
                  {designedAudioUrl && (
                    <div className="bg-slate-900 border border-emerald-500/20 rounded-2xl p-6 shadow-xl space-y-5">
                      <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-800">
                        <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                          <Check className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">{t.design_success}</h4>
                          <p className="text-[10px] text-slate-400">Temporary Token ID: <code className="text-emerald-400">{tempDesignToken}</code></p>
                        </div>
                      </div>

                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
                        <audio src={designedAudioUrl} controls className="w-full accent-emerald-500" />
                      </div>

                      {/* Registration Form to save in voice library */}
                      <form onSubmit={handleSaveDesignedVoice} className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-4">
                        <span className="block text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Save className="h-3.5 w-3.5" />
                          {t.design_add_to_library}
                        </span>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase">{t.design_save_name}</label>
                            <input
                              type="text"
                              required
                              value={designSaveName}
                              onChange={(e) => setDesignSaveName(e.target.value)}
                              placeholder={t.design_save_name_placeholder}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase">{t.clone_desc_label}</label>
                            <input
                              type="text"
                              value={designSaveDesc}
                              onChange={(e) => setDesignSaveDesc(e.target.value)}
                              placeholder={t.clone_desc_placeholder}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isSavingDesign || !designSaveName.trim()}
                          className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs py-2 px-4 rounded-lg transition disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
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
              )}

              {/* TAB: AI MUSIC STUDIO (ELEVEN MUSIC V2) */}
              {activeTab === 'music' && (
                <MusicStudioTab
                  apiKeyConfigured={apiStatus.configured}
                  onNotify={(msg, type) => {
                    if (type === 'error') alert(msg);
                  }}
                />
              )}

              {/* TAB: AI SOUND EFFECTS STUDIO */}
              {activeTab === 'sfx' && (
                <SoundEffectsTab
                  language={language}
                  t={t}
                  apiFetch={apiFetch}
                />
              )}

              {/* TAB: AUDIO ISOLATION & NOISE REDUCTION */}
              {activeTab === 'isolation' && (
                <AudioIsolationTab
                  language={language}
                  t={t}
                  apiFetch={apiFetch}
                />
              )}

              {/* TAB: SCRIBE SPEECH TO TEXT */}
              {activeTab === 'scribe' && (
                <ScribeStudioTab
                  language={language}
                  t={t}
                  apiFetch={apiFetch}
                />
              )}

              {/* TAB: MULTILINGUAL DUBBING STUDIO */}
              {activeTab === 'dubbing' && (
                <DubbingStudioTab
                  language={language}
                  t={t}
                  apiFetch={apiFetch}
                />
              )}

              {/* TAB: PRONUNCIATION DICTIONARIES */}
              {activeTab === 'dictionaries' && (
                <PronunciationTab
                  language={language}
                  t={t}
                  apiFetch={apiFetch}
                />
              )}

              {/* TAB: GLOBAL SHARED VOICE MARKETPLACE */}
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

              {/* TAB: CONVERSATIONAL AI AGENTS STUDIO */}
              {activeTab === 'agents' && (
                <AgentsStudioTab
                  language={language}
                  t={t}
                  apiFetch={apiFetch}
                  voices={voices}
                  models={models}
                />
              )}

              {/* TAB: ENTERPRISE GOVERNANCE & BILLING ATTRIBUTION */}
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


              {/* TAB 5: ACOUSTIC VOICE LIBRARY & PRESETS */}
              {activeTab === 'library' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-extrabold text-white tracking-tight">{t.library_title}</h2>
                    <p className="text-slate-400 text-xs mt-0.5">{t.library_desc}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {voices.map((voice) => (
                      <div key={voice.voice_id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-4 flex flex-col justify-between transition">
                        <div className="space-y-3">
                          
                          {/* Title banner */}
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-extrabold text-white text-sm">{voice.name}</h3>
                              <span className="text-[10px] text-slate-500 font-mono">ID: {voice.voice_id}</span>
                            </div>
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase border ${
                              voice.category === 'cloned'
                                ? 'bg-purple-500/15 text-purple-400 border-purple-500/20'
                                : voice.category === 'designed'
                                ? 'bg-sky-500/15 text-sky-400 border-sky-500/20'
                                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                            }`}>
                              {voice.category === 'cloned' ? t.voice_cloned : voice.category === 'designed' ? t.voice_designed : t.voice_official}
                            </span>
                          </div>

                          <p className="text-xs text-slate-400 leading-relaxed min-h-[48px]">
                            {voice.description || t.voice_default_desc}
                          </p>

                          {/* Quick label tags */}
                          {voice.labels && Object.keys(voice.labels).length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {Object.entries(voice.labels).map(([key, val]) => (
                                <span key={key} className="px-2 py-0.5 bg-slate-950 border border-slate-850 rounded-md text-[10px] text-slate-400 font-medium">
                                  {key}: {val}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Interactive Footer */}
                        <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between gap-3">
                          {voice.preview_url ? (
                            <a
                              href={voice.preview_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-slate-400 hover:text-white transition flex items-center gap-1 font-semibold"
                            >
                              <Play className="h-3 w-3 text-emerald-400" />
                              {t.voice_preview_original}
                            </a>
                          ) : (
                            <span className="text-[11px] text-slate-500 font-mono">{t.voice_preview_custom}</span>
                          )}

                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={() => {
                                setSelectedVoiceId(voice.voice_id);
                                setStsVoiceId(voice.voice_id);
                                setActiveTab('tts');
                              }}
                              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition cursor-pointer"
                            >
                              {t.voice_apply}
                            </button>

                            {(voice.category === 'cloned' || voice.category === 'designed') && (
                              <button
                                onClick={() => handleDeleteVoice(voice.voice_id)}
                                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition cursor-pointer animate-fade-in"
                                title={t.voice_delete_confirm}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: TASK HISTORY, ORIGINAL FILES & TRACING CENTER */}
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
            </>
          )}
        </main>
      </div>

      {/* FOOTER */}
      <footer id="footer_section" className="border-t border-slate-800 bg-slate-950 px-6 py-4.5 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
        <p>{t.footer_text}</p>
        <div className="flex items-center space-x-4">
          <span className="flex items-center gap-1.5"><Database className="h-3.5 w-3.5 text-emerald-500" /> {t.footer_models_loaded}</span>
          <span>{t.footer_status_normal}</span>
        </div>
      </footer>

    </div>
  );
}
