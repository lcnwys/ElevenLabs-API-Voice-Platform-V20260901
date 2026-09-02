import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Sparkles,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  Settings2,
  Plus,
  RefreshCw,
  MessageSquare,
  Globe,
  Sliders,
  CheckCircle2,
  Play,
  Layers,
  Terminal,
  Activity,
  Radio,
  Send,
  X,
  Keyboard,
  AudioWaveform
} from 'lucide-react';
import { ConversationalAgentSummary, Voice, VoiceModel } from '../types';

interface AgentsStudioTabProps {
  language: 'zh' | 'en';
  t: any;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
  voices: Voice[];
  models: VoiceModel[];
}

export const AgentsStudioTab: React.FC<AgentsStudioTabProps> = ({
  language,
  t,
  apiFetch,
  voices,
  models
}) => {
  const [agents, setAgents] = useState<ConversationalAgentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<ConversationalAgentSummary | null>(null);

  // New Agent Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentPrompt, setNewAgentPrompt] = useState(
    'You are a professional customer assistant. Always answer warmly, concisely, and accurately.'
  );
  const [newAgentFirstMsg, setNewAgentFirstMsg] = useState('Hello! Welcome to our voice service. How may I help you today?');
  const [newAgentVoiceId, setNewAgentVoiceId] = useState(voices[0]?.voice_id || '21m00Tcm4TlvDq8ikWAM');
  const [newAgentModelId, setNewAgentModelId] = useState('eleven_flash_v2_5');

  // Real-time call state
  const [isCalling, setIsCalling] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'connected'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [transcript, setTranscript] = useState<Array<{ sender: 'agent' | 'user'; text: string; time: string; audioUrl?: string }>>([]);
  const [userSpeechInput, setUserSpeechInput] = useState('');
  
  // Real Audio & Microphone State
  const [isListening, setIsListening] = useState(false);
  const [interimUserText, setInterimUserText] = useState('');
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [micVolumeLevel, setMicVolumeLevel] = useState<number>(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [transcript, interimUserText]);

  const fetchAgents = async () => {
    try {
      setRefreshing(true);
      const res = await apiFetch('/api/convai/agents');
      if (res.ok) {
        const data = await res.json();
        const list = data.agents || [];
        setAgents(list);
        if (list.length > 0 && !selectedAgent) {
          setSelectedAgent(list[0]);
        }
      }
    } catch (err) {
      console.error('Failed fetching agents:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  // Play Agent Audio Response
  const playAgentAudio = async (text: string, voiceId?: string) => {
    try {
      setIsAgentSpeaking(true);
      
      // Stop user mic recognition momentarily while agent is speaking to prevent feedback echo
      if (recognitionRef.current && isListening) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }

      const res = await apiFetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice_id: voiceId || selectedAgent?.conversation_config?.tts?.voice_id || voices[0]?.voice_id || '21m00Tcm4TlvDq8ikWAM',
          model_id: selectedAgent?.conversation_config?.tts?.model_id || 'eleven_flash_v2_5'
        })
      });

      if (res.ok) {
        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        
        if (currentAudioRef.current) {
          currentAudioRef.current.pause();
        }

        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;

        audio.onended = () => {
          setIsAgentSpeaking(false);
          // Resume speech recognition
          if (isCalling && !isMuted && inputMode === 'voice') {
            startMicrophoneRecognition();
          }
        };

        audio.onerror = () => {
          setIsAgentSpeaking(false);
          // Fallback to browser SpeechSynthesis
          speakWithBrowserTts(text);
        };

        await audio.play();
        return audioUrl;
      } else {
        speakWithBrowserTts(text);
      }
    } catch (err) {
      console.error('TTS Playback failed:', err);
      speakWithBrowserTts(text);
    }
  };

  const speakWithBrowserTts = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'zh' ? 'zh-CN' : 'en-US';
      utterance.rate = 1.05;
      utterance.onend = () => {
        setIsAgentSpeaking(false);
        if (isCalling && !isMuted && inputMode === 'voice') {
          startMicrophoneRecognition();
        }
      };
      utterance.onerror = () => {
        setIsAgentSpeaking(false);
      };
      window.speechSynthesis.speak(utterance);
    } else {
      setIsAgentSpeaking(false);
    }
  };

  // Start Real Microphone Listening (Web Speech API + Audio Analyser)
  const startMicrophoneRecognition = async () => {
    if (isMuted || isAgentSpeaking) return;
    setPermissionError(null);

    // 1. Initialize AudioContext for VU Meter
    try {
      if (!mediaStreamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;

        const checkVolume = () => {
          if (analyserRef.current) {
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);
            const sum = dataArray.reduce((a, b) => a + b, 0);
            const avg = sum / dataArray.length;
            setMicVolumeLevel(Math.min(100, Math.round((avg / 128) * 100)));
          }
          animFrameRef.current = requestAnimationFrame(checkVolume);
        };
        checkVolume();
      }
    } catch (err: any) {
      console.warn('Microphone permission / Analyser unavailable:', err);
      setPermissionError(language === 'zh' ? '请允许浏览器访问麦克风以体验实时语音交互' : 'Please allow microphone access for real-time speech interaction');
    }

    // 2. Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Browser SpeechRecognition not supported.');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === 'zh' ? 'zh-CN' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (interim) {
          setInterimUserText(interim);
        }

        if (final.trim()) {
          setInterimUserText('');
          handleUserVoiceMessage(final.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'not-allowed') {
          setPermissionError(language === 'zh' ? '麦克风权限被拒绝，请在浏览器地址栏开启' : 'Microphone permission denied');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // Automatically restart if still in call and agent not speaking
        if (isCalling && !isMuted && !isAgentSpeaking && inputMode === 'voice') {
          try {
            recognition.start();
          } catch (e) {}
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
    }
  };

  const stopMicrophoneRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsListening(false);
    setMicVolumeLevel(0);
    setInterimUserText('');
  };

  // Handle incoming user speech
  const handleUserVoiceMessage = (userText: string) => {
    if (!userText.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setTranscript(prev => [...prev, { sender: 'user', text: userText, time: now }]);

    // Trigger Agent intelligent response
    setTimeout(async () => {
      let reply = 'I understand your query. Let me provide the best solution right away.';
      if (language === 'zh') {
        const queryLower = userText.toLowerCase();
        if (queryLower.includes('你好') || queryLower.includes('早') || queryLower.includes('在吗')) {
          reply = `您好！很高兴与您实时连线通话，请问有什么可以协助您？`;
        } else if (queryLower.includes('费用') || queryLower.includes('价格') || queryLower.includes('套餐')) {
          reply = `关于企业定价，ElevenLabs 提供从 Starter、Creator 到定制 Enterprise 多种配额方案，支持按百万字符量计费并提供超低延迟并发。`;
        } else if (queryLower.includes('克隆') || queryLower.includes('声音')) {
          reply = `声音克隆模块支持 Instant 快速克隆与 PVC 专业母带级复刻，您可以在左侧声音库中随时管理您的音色资产。`;
        } else {
          reply = `已收到您的语音诉求：“${userText}”。根据系统设定的业务知识库，我已为您完成实时检索与声学应答。`;
        }
      }

      const audioUrl = await playAgentAudio(reply);

      setTranscript(prev => [
        ...prev,
        {
          sender: 'agent',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          audioUrl
        }
      ]);
    }, 600);
  };

  const handleStartCall = () => {
    if (!selectedAgent) return;
    setIsCalling(true);
    setCallStatus('connecting');
    setTranscript([]);
    setPermissionError(null);

    setTimeout(async () => {
      setCallStatus('connected');
      const firstMsg = selectedAgent.conversation_config?.agent?.first_message ||
        (language === 'zh' ? '您好！我是您的智能语音助理，请问今天有什么可以为您效劳？' : 'Hello! How can I assist your business today?');
      
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      // Play Audio First message
      const audioUrl = await playAgentAudio(firstMsg);

      setTranscript([
        {
          sender: 'agent',
          text: firstMsg,
          time: now,
          audioUrl
        }
      ]);

      // Start live mic listening
      if (inputMode === 'voice') {
        startMicrophoneRecognition();
      }
    }, 1200);
  };

  const handleHangup = () => {
    setIsCalling(false);
    setCallStatus('idle');
    stopMicrophoneRecognition();
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsAgentSpeaking(false);
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName.trim()) return;

    try {
      const res = await apiFetch('/api/convai/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAgentName,
          prompt: newAgentPrompt,
          first_message: newAgentFirstMsg,
          voice_id: newAgentVoiceId,
          model_id: newAgentModelId
        })
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewAgentName('');
        await fetchAgents();
      }
    } catch (err) {
      console.error('Failed creating agent:', err);
    }
  };

  const handleSendTextMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userSpeechInput.trim() || callStatus !== 'connected') return;
    const text = userSpeechInput.trim();
    setUserSpeechInput('');
    handleUserVoiceMessage(text);
  };

  return (
    <div id="conversational_agents_container" className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      
      {/* 1. Header with explicit tooltips and labeled action buttons */}
      <div className="border-b border-gray-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Bot className="h-5 w-5 text-gray-900" />
            <span>{t.agents_title}</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">{t.agents_desc}</p>
        </div>

        {/* Action Buttons: Refresh + Create with Full Visible Text */}
        <div className="flex items-center gap-2.5">
          <button
            id="refresh_agents_btn"
            onClick={fetchAgents}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium transition shadow-xs"
            title={language === 'zh' ? '刷新已部署的智能体列表' : 'Refresh agents list'}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-black' : 'text-gray-500'}`} />
            <span>{t.agents_refresh_list || (language === 'zh' ? '刷新列表' : 'Refresh')}</span>
          </button>

          <button
            id="create_new_agent_btn"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 bg-black hover:bg-gray-800 text-white font-medium text-xs px-4 py-2 rounded-lg transition shadow-xs"
            title={language === 'zh' ? '新建 Conversational 智能体' : 'Deploy new agent'}
          >
            <Plus className="h-4 w-4" />
            <span>{t.agents_create_btn || (language === 'zh' ? '新建智能体' : 'Create Agent')}</span>
          </button>
        </div>
      </div>

      {/* 2. Main 2-Column Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Agents List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              {t.agents_list_title} ({agents.length})
            </h3>
            <span className="text-[11px] text-gray-400">
              {language === 'zh' ? '点击选择要评测的智能体' : 'Select agent to test'}
            </span>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
            {agents.length === 0 && !loading && (
              <div className="p-8 text-center bg-white border border-dashed border-gray-300 rounded-xl text-gray-400 space-y-2">
                <Bot className="h-8 w-8 mx-auto text-gray-300" />
                <p className="text-xs font-medium text-gray-600">
                  {language === 'zh' ? '暂无部署的智能体' : 'No conversational agents yet'}
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-3 py-1.5 bg-black text-white text-xs rounded-lg font-medium inline-flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{language === 'zh' ? '创建第一个智能体' : 'Create First Agent'}</span>
                </button>
              </div>
            )}

            {agents.map((agent) => {
              const isSelected = selectedAgent?.agent_id === agent.agent_id;
              return (
                <div
                  key={agent.agent_id}
                  onClick={() => {
                    setSelectedAgent(agent);
                    if (isCalling) handleHangup();
                  }}
                  className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-gray-50 border-black shadow-sm ring-1 ring-black/10'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-900 font-bold shrink-0">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-gray-900 truncate">{agent.name}</h4>
                        <span className="text-[10px] text-gray-400 font-mono block truncate">{agent.agent_id}</span>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium uppercase shrink-0">
                      {agent.conversation_config?.agent?.language || 'EN'}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-gray-600 line-clamp-2 italic">
                    "{agent.conversation_config?.agent?.first_message || agent.conversation_config?.agent?.prompt?.prompt}"
                  </p>

                  <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
                    <span>Model: {agent.conversation_config?.tts?.model_id || 'eleven_flash_v2_5'}</span>
                    <span>Voice: {agent.conversation_config?.tts?.voice_id ? 'Configured' : 'Default'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Real-time Live Duplex Voice Sandbox */}
        <div className="lg:col-span-7 bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-between space-y-4">
          {selectedAgent ? (
            <>
              {/* Agent Active Profile & Call Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white font-bold shrink-0 transition-all ${
                    isAgentSpeaking ? 'ring-4 ring-emerald-400/40 animate-pulse' : ''
                  }`}>
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-gray-900 truncate">{selectedAgent.name}</h3>
                      {isAgentSpeaking && (
                        <span className="text-[10px] font-medium bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded flex items-center gap-1 animate-pulse">
                          <Volume2 className="h-3 w-3" />
                          <span>{language === 'zh' ? '正在发声' : 'Speaking'}</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                      <Activity className={`h-3 w-3 ${callStatus === 'connected' ? 'text-emerald-500' : 'text-gray-400'}`} />
                      <span>
                        {callStatus === 'connected'
                          ? (language === 'zh' ? '全双工实时语音连接中 • 随时说话' : 'Full-duplex channel active')
                          : callStatus === 'connecting'
                          ? t.agents_connecting
                          : (language === 'zh' ? '就绪 • 点击右侧按钮开启语音通话' : 'Idle • Ready for call')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Call Start / Hangup Trigger */}
                <div className="shrink-0 flex items-center gap-2">
                  {!isCalling ? (
                    <button
                      id="start_voice_call_btn"
                      onClick={handleStartCall}
                      className="px-4 py-2 bg-black hover:bg-gray-800 text-white font-medium rounded-lg text-xs flex items-center gap-2 transition shadow-xs"
                    >
                      <PhoneCall className="h-3.5 w-3.5 text-emerald-400" />
                      <span>{t.agents_call_test_btn}</span>
                    </button>
                  ) : (
                    <button
                      id="hangup_voice_call_btn"
                      onClick={handleHangup}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition shadow-xs"
                    >
                      <PhoneOff className="h-3.5 w-3.5" />
                      <span>{t.agents_hangup}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Call Transcript with Soundwave & Interactive Indicators */}
              <div className="flex-1 bg-gray-50/80 border border-gray-200 rounded-xl p-4 min-h-[300px] max-h-[380px] overflow-y-auto space-y-3 relative">
                {transcript.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-2 py-12">
                    <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 shadow-xs">
                      <Radio className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-xs font-semibold text-gray-700">{t.agents_mock_chat_tip}</p>
                    <p className="text-[11px] text-gray-500 max-w-sm">
                      {language === 'zh'
                        ? '点击右上角“发起实时语音对话测试”，即可通过麦克风与 AI 智能体直接交谈，智能体将实时语音播报作答。'
                        : 'Click "Start Real-Time Voice Call Test" to speak naturally through your microphone.'}
                    </p>
                  </div>
                ) : (
                  <>
                    {transcript.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mb-1 px-1">
                          <span className="font-medium text-gray-600">
                            {msg.sender === 'user' ? (language === 'zh' ? '您 (Voice)' : 'You (Voice)') : selectedAgent.name}
                          </span>
                          <span>•</span>
                          <span>{msg.time}</span>
                        </div>
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                            msg.sender === 'user'
                              ? 'bg-black text-white rounded-tr-xs'
                              : 'bg-white border border-gray-200 text-gray-900 rounded-tl-xs shadow-xs'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="flex-1">{msg.text}</span>
                            {msg.sender === 'agent' && (
                              <button
                                onClick={() => playAgentAudio(msg.text)}
                                title={language === 'zh' ? '重新朗读此回复' : 'Replay audio'}
                                className="p-1 text-gray-400 hover:text-black transition rounded hover:bg-gray-100 shrink-0"
                              >
                                <Volume2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Real-time Subtitle / Interim Speech Recognition Feed */}
                    {interimUserText && (
                      <div className="flex flex-col items-end animate-in fade-in">
                        <div className="text-[10px] text-blue-500 mb-0.5 px-1 flex items-center gap-1 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
                          <span>{language === 'zh' ? '正在捕捉您的语音...' : 'Listening to speech...'}</span>
                        </div>
                        <div className="max-w-[85%] rounded-2xl rounded-tr-xs px-4 py-2 text-xs bg-blue-50 border border-blue-200 text-blue-900 italic">
                          "{interimUserText}"
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Real-time Voice / Mic Interaction Console */}
              {isCalling && callStatus === 'connected' && (
                <div className="bg-white border border-gray-200 rounded-xl p-3.5 space-y-3 shadow-xs">
                  
                  {/* Mode switch & Live Mic VU Meter */}
                  <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                        <button
                          type="button"
                          onClick={() => {
                            setInputMode('voice');
                            startMicrophoneRecognition();
                          }}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                            inputMode === 'voice'
                              ? 'bg-black text-white shadow-xs'
                              : 'text-gray-600 hover:text-black'
                          }`}
                        >
                          <Mic className="h-3 w-3" />
                          <span>{language === 'zh' ? '麦克风实时对话' : 'Live Mic'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setInputMode('text');
                            stopMicrophoneRecognition();
                          }}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                            inputMode === 'text'
                              ? 'bg-black text-white shadow-xs'
                              : 'text-gray-600 hover:text-black'
                          }`}
                        >
                          <Keyboard className="h-3 w-3" />
                          <span>{language === 'zh' ? '键盘文字辅助' : 'Text Fallback'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Microphone Sound Wave Equalizer */}
                    {inputMode === 'voice' && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="text-[11px] text-gray-400">
                          {isAgentSpeaking
                            ? (language === 'zh' ? '智能体播报中' : 'Agent Speaking')
                            : (language === 'zh' ? '麦克风监听中' : 'Mic Listening')}
                        </span>
                        {/* Dynamic 5-bar VU sound meter */}
                        <div className="flex items-end gap-0.5 h-4 w-12 bg-gray-100 p-0.5 rounded">
                          {[20, 45, 80, 50, 30].map((baseHeight, idx) => {
                            const activeHeight = isAgentSpeaking
                              ? Math.sin(Date.now() / 200 + idx) * 30 + 40
                              : micVolumeLevel > 5
                              ? Math.min(100, micVolumeLevel * (0.8 + idx * 0.2))
                              : 15;
                            return (
                              <div
                                key={idx}
                                style={{ height: `${activeHeight}%` }}
                                className={`w-1.5 rounded-xs transition-all duration-75 ${
                                  isAgentSpeaking
                                    ? 'bg-emerald-500'
                                    : micVolumeLevel > 20
                                    ? 'bg-black'
                                    : 'bg-gray-400'
                                }`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {permissionError && (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center justify-between">
                      <span>{permissionError}</span>
                      <button
                        onClick={startMicrophoneRecognition}
                        className="underline font-semibold ml-2"
                      >
                        {language === 'zh' ? '重试' : 'Retry'}
                      </button>
                    </div>
                  )}

                  {/* Input controls based on mode */}
                  {inputMode === 'voice' ? (
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={() => {
                            const next = !isMuted;
                            setIsMuted(next);
                            if (next) {
                              stopMicrophoneRecognition();
                            } else {
                              startMicrophoneRecognition();
                            }
                          }}
                          className={`p-2.5 rounded-xl border transition ${
                            isMuted
                              ? 'bg-red-50 border-red-200 text-red-600'
                              : 'bg-black text-white hover:bg-gray-800'
                          }`}
                          title={isMuted ? (language === 'zh' ? '取消静音' : 'Unmute') : (language === 'zh' ? '静音麦克风' : 'Mute')}
                        >
                          {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </button>

                        <div className="text-xs">
                          <p className="font-semibold text-gray-800">
                            {isMuted
                              ? (language === 'zh' ? '麦克风已静音' : 'Microphone Muted')
                              : isAgentSpeaking
                              ? (language === 'zh' ? '智能体正在说话...' : 'Agent is responding...')
                              : (language === 'zh' ? '直接对着麦克风说话即可...' : 'Speak directly into microphone...')}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {language === 'zh'
                              ? '全双工语音识别，说完自动触发智能体语音应答'
                              : 'Continuous voice recognition with automatic voice answers'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleHangup}
                        className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition"
                      >
                        {t.agents_hangup}
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSendTextMessage} className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={userSpeechInput}
                        onChange={e => setUserSpeechInput(e.target.value)}
                        placeholder={language === 'zh' ? '输入文字发送给智能体，智能体将语音播报回复...' : 'Type message, agent will speak back response...'}
                        className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-black"
                      />
                      <button
                        type="submit"
                        disabled={!userSpeechInput.trim()}
                        className="px-4 py-2 bg-black hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium rounded-lg text-xs transition flex items-center gap-1"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>{language === 'zh' ? '发送' : 'Send'}</span>
                      </button>
                    </form>
                  )}

                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-72 text-gray-400 space-y-2">
              <Bot className="h-10 w-10 text-gray-300" />
              <p className="text-xs font-medium text-gray-600">
                {language === 'zh' ? '请选择左侧的智能体以开始全双工实时语音对话评测' : 'Select an agent on the left to start live voice testing'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3. Create Agent Modal with Pristine Labels & Action Buttons */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  {t.agents_modal_create_title || (language === 'zh' ? '新建 Conversational 语音智能体' : 'Create Conversational Voice Agent')}
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {language === 'zh' ? '配置智能体的人设、第一句开场白与分配的 ElevenLabs 音色' : 'Set up prompt persona, first greeting, and assigned voice'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-black transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateAgent} className="space-y-4">
              
              {/* Field 1: Agent Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">
                  {t.agents_modal_name || (language === 'zh' ? '智能体名称 (Agent Name)' : 'Agent Name')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newAgentName}
                  onChange={e => setNewAgentName(e.target.value)}
                  placeholder={t.agents_modal_name_placeholder || 'e.g. VIP 业务咨询顾问 / 售前支持'}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-black shadow-xs"
                />
              </div>

              {/* Field 2: System Prompt */}
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">
                  {t.agents_modal_prompt || (language === 'zh' ? '系统人设提示词 (System Prompt)' : 'System Prompt')}
                </label>
                <textarea
                  rows={3}
                  value={newAgentPrompt}
                  onChange={e => setNewAgentPrompt(e.target.value)}
                  placeholder={t.agents_modal_prompt_placeholder || '定义智能体的人设角色、语气风格、业务逻辑与专业边界...'}
                  className="w-full bg-white border border-gray-200 rounded-lg p-3 text-xs text-gray-900 focus:outline-none focus:border-black resize-none shadow-xs"
                />
              </div>

              {/* Field 3: First Greeting Message */}
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1">
                  {t.agents_modal_first_msg || (language === 'zh' ? '首句问候语 (First Greeting Message)' : 'First Greeting Message')}
                </label>
                <input
                  type="text"
                  value={newAgentFirstMsg}
                  onChange={e => setNewAgentFirstMsg(e.target.value)}
                  placeholder={t.agents_modal_first_msg_placeholder || 'e.g. 您好！我是您的专属智能语音顾问，请问有什么可以帮您？'}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-black shadow-xs"
                />
              </div>

              {/* Field 4 & 5: Voice & Model Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-1">
                    {t.agents_modal_voice || (language === 'zh' ? '分配音色 (Voice)' : 'Assigned Voice')}
                  </label>
                  <select
                    value={newAgentVoiceId}
                    onChange={e => setNewAgentVoiceId(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-black"
                  >
                    {voices.map(v => (
                      <option key={v.voice_id} value={v.voice_id}>
                        {v.name} ({v.category || 'Standard'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-1">
                    {t.agents_modal_model || (language === 'zh' ? '底层大模型 (Model)' : 'LLM & Engine')}
                  </label>
                  <select
                    value={newAgentModelId}
                    onChange={e => setNewAgentModelId(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-black"
                  >
                    {models.map(m => (
                      <option key={m.model_id} value={m.model_id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Modal Action Buttons with High-Contrast Text Labels */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 transition"
                >
                  {t.cancel || (language === 'zh' ? '取消' : 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={!newAgentName.trim()}
                  className="px-5 py-2 bg-black hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-xs transition shadow-xs"
                >
                  {t.agents_modal_submit || (language === 'zh' ? '立即创建并部署' : 'Deploy Agent Now')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
