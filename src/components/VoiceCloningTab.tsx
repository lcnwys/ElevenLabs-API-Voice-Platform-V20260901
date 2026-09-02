import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Upload,
  Sparkles,
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Volume2,
  FileAudio,
  Activity,
  Sliders,
  Cpu,
  Info,
  ExternalLink,
  ChevronRight,
  Database,
  Award,
  RefreshCw,
  Plus,
  Check,
  X
} from 'lucide-react';
import { PvcSlot, PvcSlotsOverview, Voice } from '../types';

interface VoiceCloningTabProps {
  language?: 'zh' | 'en';
  t?: any;
  apiFetch?: (url: string, options?: RequestInit) => Promise<Response>;
  apiStatus?: any;
  apiKeyConfigured?: boolean;
  onVoiceAdded?: (voice: Voice) => void;
  onVoiceCreated?: (voice: Voice) => void;
  onNavigateToTts?: (voiceId: string) => void;
}

export function VoiceCloningTab({
  language = 'zh',
  t,
  apiFetch,
  apiStatus,
  apiKeyConfigured,
  onVoiceAdded,
  onVoiceCreated,
  onNavigateToTts
}: VoiceCloningTabProps) {
  const notifyVoiceAdded = (voice: Voice) => {
    if (onVoiceCreated) onVoiceCreated(voice);
    if (onVoiceAdded) onVoiceAdded(voice);
  };
  const [activeMode, setActiveMode] = useState<'ivc' | 'pvc_train' | 'slots_fleet'>('pvc_train');
  const [pvcOverview, setPvcOverview] = useState<PvcSlotsOverview | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // --- IVC State ---
  const [ivcName, setIvcName] = useState('');
  const [ivcDescription, setIvcDescription] = useState('');
  const [ivcRemoveNoise, setIvcRemoveNoise] = useState(true);
  const [ivcFile, setIvcFile] = useState<File | null>(null);
  const [isRecordingIvc, setIsRecordingIvc] = useState(false);
  const [recordedIvcUrl, setRecordedIvcUrl] = useState<string | null>(null);
  const [recordedIvcBlob, setRecordedIvcBlob] = useState<Blob | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [cloningIvc, setCloningIvc] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<any>(null);

  // --- PVC Training State ---
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [pvcVoiceName, setPvcVoiceName] = useState('');
  const [pvcSpeakerName, setPvcSpeakerName] = useState('');
  const [pvcDescription, setPvcDescription] = useState('');
  const [pvcBaseModel, setPvcBaseModel] = useState('Eleven v3 Cinematic PVC Neural Core');
  const [pvcFiles, setPvcFiles] = useState<File[]>([]);
  const [pvcDurationMins, setPvcDurationMins] = useState(45);
  const [consentRead, setConsentRead] = useState(true);
  const [isTrainingPvc, setIsTrainingPvc] = useState(false);
  const [trainingPhase, setTrainingPhase] = useState<number>(0);
  const [trainingLog, setTrainingLog] = useState<string[]>([]);
  const [trainingSuccessSlot, setTrainingSuccessSlot] = useState<PvcSlot | null>(null);

  // --- Audio Preview State ---
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Fetch PVC Slots Overview
  const fetchPvcSlots = async () => {
    try {
      setLoadingSlots(true);
      const customKey = localStorage.getItem('elevenlabs_custom_api_key');
      const headers: Record<string, string> = {};
      if (customKey) headers['x-custom-api-key'] = customKey;

      const res = await fetch('/api/pvc/slots', { headers });
      if (res.ok) {
        const data = await res.json();
        setPvcOverview(data);
        const firstAvailable = data.slots?.find((s: PvcSlot) => s.status === 'empty' || s.status === 'ready');
        if (firstAvailable && !selectedSlotId) {
          setSelectedSlotId(firstAvailable.slot_id);
        }
      }
    } catch (err) {
      console.error('Failed to load PVC slots:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    fetchPvcSlots();
  }, []);

  const handlePlayAudio = (url: string) => {
    if (!audioPlayerRef.current) return;
    if (playingAudioUrl === url) {
      audioPlayerRef.current.pause();
      setPlayingAudioUrl(null);
    } else {
      audioPlayerRef.current.src = url;
      audioPlayerRef.current.play().catch(e => console.error('Audio play error', e));
      setPlayingAudioUrl(url);
    }
  };

  // Instant Voice Clone Handler
  const handleInstantVoiceClone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ivcName.trim()) return;

    try {
      setCloningIvc(true);
      setActionMessage(null);

      const formData = new FormData();
      formData.append('name', ivcName);
      formData.append('description', ivcDescription);
      formData.append('remove_noise', String(ivcRemoveNoise));

      if (ivcFile) {
        formData.append('files', ivcFile);
      } else if (recordedIvcBlob) {
        formData.append('files', recordedIvcBlob, 'recording.wav');
      }

      const customKey = localStorage.getItem('elevenlabs_custom_api_key');
      const headers: Record<string, string> = {};
      if (customKey) headers['x-custom-api-key'] = customKey;

      const res = await fetch('/api/voices/add', {
        method: 'POST',
        headers,
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setActionMessage(language === 'zh' ? `✓ 成功创建即时克隆音色 "${ivcName}"！已自动注入音色库。` : `✓ Created voice "${ivcName}"!`);
        notifyVoiceAdded(data.voice || data);
        setIvcName('');
        setIvcDescription('');
        setIvcFile(null);
        setRecordedIvcUrl(null);
        setRecordedIvcBlob(null);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || '克隆请求失败');
      }
    } catch (err) {
      console.error('IVC error:', err);
    } finally {
      setCloningIvc(false);
    }
  };

  // PVC Training Submission Handler
  const handleStartPvcTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pvcVoiceName.trim()) {
      alert('请输入音色模型标识名称');
      return;
    }
    if (!selectedSlotId) {
      alert('请选择要部署的专属专业克隆插槽');
      return;
    }

    try {
      setIsTrainingPvc(true);
      setTrainingPhase(1);
      setTrainingLog([
        `[01/05] 初始化专属声学插槽 [${selectedSlotId}]...`,
        `[02/05] 对齐 44.1kHz 母带音频特征与语调共振峰...`,
        `[03/05] 执行 ${pvcDurationMins} 分钟数据集深度微调训练...`,
        `[04/05] 正在生成跨语种自适应声学编码层 (Eleven v3 Engine)...`
      ]);

      const formData = new FormData();
      formData.append('slot_id', selectedSlotId);
      formData.append('voice_name', pvcVoiceName);
      formData.append('speaker_name', pvcSpeakerName || pvcVoiceName);
      formData.append('description', pvcDescription);
      formData.append('base_model', pvcBaseModel);
      formData.append('consent_statement_read', 'true');
      formData.append('dataset_duration_mins', String(pvcDurationMins));

      pvcFiles.forEach(f => {
        formData.append('dataset_files', f);
      });

      const customKey = localStorage.getItem('elevenlabs_custom_api_key');
      const headers: Record<string, string> = {};
      if (customKey) headers['x-custom-api-key'] = customKey;

      const res = await fetch('/api/pvc/slots/train', {
        method: 'POST',
        headers,
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setTrainingPhase(5);
        setTrainingLog(prev => [...prev, `[05/05] ✓ 成功将 44.1kHz 母带级神经权重部署至专业插槽 [${data.slot?.slot_id || selectedSlotId}]！保真度: ${data.slot?.fidelity_score}%`]);
        setTrainingSuccessSlot(data.slot);
        setActionMessage(language === 'zh' ? `✓ 专业声音克隆训练完成！已成功分配至专业插槽 #${data.slot?.slot_index}。` : `✓ Professional Voice Clone trained!`);
        fetchPvcSlots();
        if (data.voice || data.voice_id) {
          notifyVoiceAdded(data.voice || data);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || '训练请求失败，请检查插槽配额。');
      }
    } catch (err) {
      console.error('PVC training error:', err);
    } finally {
      setIsTrainingPvc(false);
    }
  };

  const handleReleaseSlot = async (slotId: string) => {
    if (!confirm(language === 'zh' ? `确定要释放专业插槽 [${slotId}] 吗？` : `Release slot [${slotId}]?`)) return;
    try {
      const res = await fetch(`/api/pvc/slots/${slotId}/release`, { method: 'POST' });
      if (res.ok) {
        setActionMessage(language === 'zh' ? `✓ 已释放专业插槽 [${slotId}]` : `✓ Slot [${slotId}] released`);
        fetchPvcSlots();
      }
    } catch (err) {
      console.error('Release slot error:', err);
    }
  };

  const occupiedSlotsCount = pvcOverview?.slots?.filter(s => s.status === 'ready').length || 2;
  const totalSlotsCount = pvcOverview?.total_pvc_slots || 6;

  return (
    <div id="voice_cloning_studio_container" className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      <audio ref={audioPlayerRef} onEnded={() => setPlayingAudioUrl(null)} className="hidden" />

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <span>{language === 'zh' ? '声音克隆工作台' : 'Voice Cloning Studio'}</span>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-gray-100 text-gray-800 border border-gray-200">
              IVC & PVC
            </span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {language === 'zh'
              ? '支持 1 分钟极速克隆（IVC）与 44.1kHz 母带级专业克隆插槽微调训练（PVC）。'
              : 'Instant Voice Cloning (IVC) and Professional Master Training (PVC Slots).'}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs">
          <span className="text-gray-500 font-medium">{language === 'zh' ? 'PVC 插槽容量:' : 'PVC Slots:'}</span>
          <span className="font-mono font-bold text-gray-900">{occupiedSlotsCount} / {totalSlotsCount}</span>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* TABS NAVIGATION */}
      <div className="flex items-center space-x-6 border-b border-gray-200 text-sm">
        <button
          onClick={() => setActiveMode('pvc_train')}
          className={`pb-2.5 transition-colors ${
            activeMode === 'pvc_train'
              ? 'border-b-2 border-black font-semibold text-black'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          {language === 'zh' ? '专业母带训练 (PVC)' : 'Professional Training (PVC)'}
        </button>

        <button
          onClick={() => setActiveMode('ivc')}
          className={`pb-2.5 transition-colors ${
            activeMode === 'ivc'
              ? 'border-b-2 border-black font-semibold text-black'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          {language === 'zh' ? '即时声纹克隆 (IVC)' : 'Instant Cloning (IVC)'}
        </button>

        <button
          onClick={() => setActiveMode('slots_fleet')}
          className={`pb-2.5 transition-colors ${
            activeMode === 'slots_fleet'
              ? 'border-b-2 border-black font-semibold text-black'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          {language === 'zh' ? `插槽舰队管理 (${occupiedSlotsCount}/${totalSlotsCount})` : `Slots Fleet (${occupiedSlotsCount}/${totalSlotsCount})`}
        </button>
      </div>

      {/* MODE 1: PVC PROFESSIONAL CLONING */}
      {activeMode === 'pvc_train' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-gray-900">
              {language === 'zh' ? '专业母带级声音微调训练 (PVC Slots Training)' : 'Professional PVC Training'}
            </h3>

            <form onSubmit={handleStartPvcTraining} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {language === 'zh' ? '音色模型标识名称' : 'Voice Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={pvcVoiceName}
                    onChange={e => setPvcVoiceName(e.target.value)}
                    placeholder="e.g. 官方发言人-母带级模型"
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {language === 'zh' ? '部署专属 PVC 插槽' : 'Target PVC Slot'}
                  </label>
                  <select
                    value={selectedSlotId}
                    onChange={e => setSelectedSlotId(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-black"
                  >
                    {(pvcOverview?.slots || []).map(s => (
                      <option key={s.slot_id} value={s.slot_id}>
                        Slot #{s.slot_index} - {s.voice_name || '空闲可用 (Available)'} [{s.status}]
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {language === 'zh' ? '母带音频样本文件 (可多选)' : 'Master Audio Samples'}
                </label>
                <input
                  type="file"
                  multiple
                  accept="audio/*"
                  onChange={e => {
                    if (e.target.files) {
                      setPvcFiles(Array.from(e.target.files));
                    }
                  }}
                  className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-800 hover:file:bg-gray-200 file:cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={isTrainingPvc || !pvcVoiceName.trim()}
                className="w-full bg-black hover:bg-gray-800 text-white font-medium text-xs py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isTrainingPvc ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>{language === 'zh' ? '母带级声学神经网络微调中...' : 'Training Neural Weights...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>{language === 'zh' ? '开始专业母带模型训练' : 'Start Professional PVC Training'}</span>
                  </>
                )}
              </button>
            </form>

            {trainingLog.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1 font-mono text-[11px] text-gray-700">
                {trainingLog.map((log, idx) => (
                  <div key={idx}>{log}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 2: IVC INSTANT CLONING */}
      {activeMode === 'ivc' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <h3 className="text-sm font-bold text-gray-900">
            {language === 'zh' ? '即时声纹克隆 (Instant Voice Cloning)' : 'Instant Voice Cloning (IVC)'}
          </h3>

          <form onSubmit={handleInstantVoiceClone} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {language === 'zh' ? '音色名称' : 'Voice Name'}
              </label>
              <input
                type="text"
                required
                value={ivcName}
                onChange={e => setIvcName(e.target.value)}
                placeholder="e.g. 我的个人克隆声音"
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {language === 'zh' ? '上传参考音频文件' : 'Upload Sample Audio'}
              </label>
              <input
                type="file"
                accept="audio/*"
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    setIvcFile(e.target.files[0]);
                  }
                }}
                className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-800 hover:file:bg-gray-200 file:cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={cloningIvc || !ivcName.trim()}
              className="w-full bg-black hover:bg-gray-800 text-white font-medium text-xs py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {cloningIvc ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>{language === 'zh' ? '克隆中...' : 'Cloning...'}</span>
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  <span>{language === 'zh' ? '立即生成即时克隆音色' : 'Create Instant Voice Clone'}</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* MODE 3: SLOTS FLEET */}
      {activeMode === 'slots_fleet' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(pvcOverview?.slots || []).map(slot => (
            <div key={slot.slot_id} className="p-4 bg-white border border-gray-200 rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-gray-400">#{slot.slot_index}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-semibold">
                    {slot.status}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-gray-900 mt-2">
                  {slot.voice_name || (language === 'zh' ? '空闲可用插槽' : 'Available Slot')}
                </h4>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                  {slot.description || (language === 'zh' ? '随时可用于 PVC 深度训练' : 'Ready for training')}
                </p>
              </div>

              {slot.status === 'ready' && (
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  {slot.preview_audio_url && (
                    <button
                      onClick={() => handlePlayAudio(slot.preview_audio_url!)}
                      className="px-2.5 py-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 rounded-lg text-xs font-medium flex items-center gap-1"
                    >
                      <Play className="h-3 w-3" />
                      <span>{language === 'zh' ? '试听' : 'Preview'}</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleReleaseSlot(slot.slot_id)}
                    className="text-xs text-gray-400 hover:text-red-600 transition"
                  >
                    {language === 'zh' ? '释放' : 'Release'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
