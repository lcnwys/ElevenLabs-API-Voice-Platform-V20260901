import React, { useState, useEffect } from 'react';
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
  Activity
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
    'You are an intelligent customer concierge. Always answer warmly, concisely, and accurately.'
  );
  const [newAgentFirstMsg, setNewAgentFirstMsg] = useState('Hello! Welcome to our voice service. How may I help you?');
  const [newAgentVoiceId, setNewAgentVoiceId] = useState(voices[0]?.voice_id || '21m00Tcm4TlvDq8ikWAM');
  const [newAgentModelId, setNewAgentModelId] = useState('eleven_flash_v2_5');

  // Real-time call simulation
  const [isCalling, setIsCalling] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'connected'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<Array<{ sender: 'agent' | 'user'; text: string; time: string }>>([]);
  const [userSpeechInput, setUserSpeechInput] = useState('');

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
        const data = await res.json();
        setAgents(prev => [data.agent, ...prev]);
        setSelectedAgent(data.agent);
        setShowCreateModal(false);
        setNewAgentName('');
      }
    } catch (err) {
      console.error('Failed to deploy agent:', err);
    }
  };

  const handleStartCall = () => {
    setIsCalling(true);
    setCallStatus('connecting');
    setTranscript([]);

    setTimeout(() => {
      setCallStatus('connected');
      const firstMsg = selectedAgent?.conversation_config?.agent?.first_message || 
        'Hello! Welcome to our conversational voice concierge. How can I assist your business today?';
      setTranscript([
        {
          sender: 'agent',
          text: firstMsg,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }
      ]);
    }, 1200);
  };

  const handleHangup = () => {
    setIsCalling(false);
    setCallStatus('idle');
  };

  const handleSendUserMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userSpeechInput.trim() || callStatus !== 'connected') return;

    const userText = userSpeechInput.trim();
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    setTranscript(prev => [...prev, { sender: 'user', text: userText, time: now }]);
    setUserSpeechInput('');

    // Simulate Agent low latency response (<300ms stream)
    setTimeout(() => {
      const replies = [
        `Certainly! Regarding "${userText.length > 20 ? userText.slice(0, 20) + '...' : userText}", our ElevenLabs neural pipeline has processed your voice request with ultra-low latency.`,
        `I understand perfectly. Let me pull up the technical specifications for your parameters.`,
        `Got it! All streaming chunks are synthesized and queued smoothly. Is there anything else you'd like to test?`
      ];
      const reply = replies[Math.floor(Math.random() * replies.length)];
      setTranscript(prev => [
        ...prev,
        {
          sender: 'agent',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }
      ]);
    }, 600);
  };

  return (
    <div id="agents_studio_container" className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2.5">
            <Bot className="h-5 w-5 text-emerald-400" />
            <span>{t.agents_title}</span>
          </h2>
          <p className="text-slate-400 text-xs mt-1">{t.agents_desc}</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchAgents}
            disabled={refreshing}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-2 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-emerald-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{language === 'zh' ? '刷新智能体' : 'Refresh Agents'}</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow"
          >
            <Plus className="h-4 w-4" />
            <span>{t.agents_create_btn}</span>
          </button>
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span>{language === 'zh' ? '配置并发布新语音智能体' : 'Configure & Deploy Conversational Agent'}</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              {language === 'zh' ? '关闭' : 'Close'}
            </button>
          </div>

          <form onSubmit={handleCreateAgent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {language === 'zh' ? '智能体名称 (Agent Name)' : 'Agent Name'}
              </label>
              <input
                type="text"
                required
                value={newAgentName}
                onChange={e => setNewAgentName(e.target.value)}
                placeholder="e.g. VIP 客服专员 - 晓琳"
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">{t.agents_prompt_label}</label>
              <textarea
                rows={3}
                value={newAgentPrompt}
                onChange={e => setNewAgentPrompt(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">{t.agents_first_msg}</label>
              <input
                type="text"
                value={newAgentFirstMsg}
                onChange={e => setNewAgentFirstMsg(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">{t.agents_voice_label}</label>
              <select
                value={newAgentVoiceId}
                onChange={e => setNewAgentVoiceId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                {voices.map(v => (
                  <option key={v.voice_id} value={v.voice_id}>
                    {v.name} ({v.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">{t.agents_model_label}</label>
              <select
                value={newAgentModelId}
                onChange={e => setNewAgentModelId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                {models.map(m => (
                  <option key={m.model_id} value={m.model_id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 pt-3 border-t border-slate-850">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                {language === 'zh' ? '取消' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs shadow"
              >
                {language === 'zh' ? '立即部署智能体' : 'Deploy Agent'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MAIN AGENTS WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: List of Agents */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            {t.agents_list_title} ({agents.length})
          </h3>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {agents.map(agent => (
              <div
                key={agent.agent_id}
                onClick={() => {
                  setSelectedAgent(agent);
                  if (isCalling) handleHangup();
                }}
                className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                  selectedAgent?.agent_id === agent.agent_id
                    ? 'bg-emerald-500/10 border-emerald-500/30 shadow'
                    : 'bg-slate-900/50 border-slate-800 hover:bg-slate-850/60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white leading-tight">{agent.name}</h4>
                      <span className="text-[10px] text-slate-500 font-mono">{agent.agent_id}</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    {agent.conversation_config?.agent?.language || 'EN'}
                  </span>
                </div>

                <div className="mt-3 text-[11px] text-slate-400 line-clamp-2 italic">
                  "{agent.conversation_config?.agent?.first_message || agent.conversation_config?.agent?.prompt?.prompt}"
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Model: {agent.conversation_config?.tts?.model_id || 'eleven_flash_v2_5'}</span>
                  <span>Voice: {agent.conversation_config?.tts?.voice_id ? 'Configured' : 'Default'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Interactive Real-Time Voice Sandbox */}
        <div className="lg:col-span-7 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6">
          {selectedAgent ? (
            <>
              {/* Agent Active Profile & Call Controls */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-3.5">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg">
                      <Bot className="h-6 w-6" />
                    </div>
                    {callStatus === 'connected' && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-slate-900 rounded-full animate-ping" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">{selectedAgent.name}</h3>
                    <div className="flex items-center space-x-2 mt-0.5 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Activity className="h-3 w-3 text-emerald-400" />
                        {callStatus === 'connected'
                          ? t.agents_connected
                          : callStatus === 'connecting'
                          ? t.agents_connecting
                          : language === 'zh'
                          ? '就绪 • 随时可建立实时语音对话'
                          : 'Idle • Ready for real-time duplex call'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  {!isCalling ? (
                    <button
                      onClick={handleStartCall}
                      className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-950/20"
                    >
                      <PhoneCall className="h-4 w-4" />
                      <span>{t.agents_call_test_btn}</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleHangup}
                      className="px-4 py-2.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition shadow-lg shadow-red-950/20"
                    >
                      <PhoneOff className="h-4 w-4" />
                      <span>{t.agents_hangup}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Call Transcript / Stream Terminal */}
              <div className="flex-1 bg-slate-950 border border-slate-850 rounded-xl p-4 min-h-[300px] max-h-[380px] overflow-y-auto space-y-3">
                {transcript.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-2 py-12">
                    <Terminal className="h-8 w-8 text-slate-700" />
                    <p className="text-xs">{t.agents_mock_chat_tip}</p>
                    <p className="text-[11px] text-slate-600">
                      {language === 'zh'
                        ? '点击右上角“发起实时语音对话测试”体验全双工互动。'
                        : 'Click "Start Real-Time Voice Call Test" to evaluate audio stream.'}
                    </p>
                  </div>
                ) : (
                  transcript.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 mb-1 px-1">
                        <span>{msg.sender === 'user' ? (language === 'zh' ? '您 (测试麦克风)' : 'You (Microphone)') : selectedAgent.name}</span>
                        <span>•</span>
                        <span>{msg.time}</span>
                      </div>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-slate-800 text-white rounded-br-none'
                            : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-100 rounded-bl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Interactive Speech Input Form */}
              {isCalling && callStatus === 'connected' && (
                <form onSubmit={handleSendUserMessage} className="flex items-center space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-2.5 rounded-xl border transition ${
                      isMuted
                        ? 'bg-red-500/10 border-red-500/20 text-red-400'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4 text-emerald-400" />}
                  </button>

                  <input
                    type="text"
                    value={userSpeechInput}
                    onChange={e => setUserSpeechInput(e.target.value)}
                    placeholder={language === 'zh' ? '输入与智能体对话的语音提示，按回车发送模拟低延迟响应...' : 'Type message to talk to agent, press Enter for sub-300ms stream...'}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />

                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    {language === 'zh' ? '发送' : 'Send'}
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <Bot className="h-10 w-10 text-slate-700 mb-2" />
              <p className="text-xs">Select an agent on the left to start testing</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
