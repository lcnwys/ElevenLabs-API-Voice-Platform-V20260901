import React, { useState, useEffect } from 'react';
import {
  History,
  Download,
  Trash2,
  Search,
  Star,
  FileText,
  MessageSquare,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Terminal,
  FileCode,
  Film,
  Music,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Clock,
  Layers,
  Sparkles,
  Zap,
  Volume2,
  FileAudio,
  Radio,
  FileDown,
  Activity,
  AlertCircle
} from 'lucide-react';
import { VoiceModel, Voice, HistoryItem, CloudHistoryItem, TaskExecutionLog } from '../types';

interface HistoryTaskCenterTabProps {
  language: 'zh' | 'en';
  t: any;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
  models: VoiceModel[];
  voices: Voice[];
  historyItems: HistoryItem[];
  setHistoryItems: (items: HistoryItem[]) => void;
  cloudHistory: CloudHistoryItem[];
  loadingCloudHistory: boolean;
  fetchCloudHistory: () => Promise<void>;
}

export function HistoryTaskCenterTab({
  language,
  t,
  apiFetch,
  models,
  voices,
  historyItems,
  setHistoryItems,
  cloudHistory,
  loadingCloudHistory,
  fetchCloudHistory,
}: HistoryTaskCenterTabProps) {
  const [historySourceFilter, setHistorySourceFilter] = useState<string>('all');
  const [historyModelFilter, setHistoryModelFilter] = useState<string>('all');
  const [historyVoiceFilter, setHistoryVoiceFilter] = useState<string>('all');
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const allTasks = React.useMemo(() => {
    const combined: any[] = [...cloudHistory];
    const existingIds = new Set(combined.map(c => c.id || c.history_item_id));
    historyItems.forEach(localItem => {
      if (!existingIds.has(localItem.id)) {
        combined.push({
          history_item_id: localItem.id,
          id: localItem.id,
          source: localItem.source || 'tts',
          source_name_zh: localItem.source === 'sts' ? '语音转语音 (STS)' : localItem.source === 'design' ? '声纹设计' : '文本转语音 (TTS)',
          voice_id: localItem.voice_id,
          voice_name: localItem.voice_name,
          model_id: localItem.model_id,
          model_name: localItem.model_name,
          text: localItem.text,
          original_text: localItem.text,
          original_file_name: localItem.source === 'sts' ? 'source_audio_input.wav' : undefined,
          original_file_type: localItem.source === 'sts' ? 'audio/wav' : 'text/plain',
          output_audio_url: localItem.audioUrl,
          latency_ms: localItem.latency,
          fileSize: localItem.fileSize,
          status: 'done',
          created_at: new Date(localItem.timestamp).toISOString(),
          rating: localItem.rating,
          comment: localItem.comment,
          logs: localItem.logs || []
        });
      }
    });
    return combined;
  }, [cloudHistory, historyItems]);

  const filteredTasks = React.useMemo(() => {
    return allTasks.filter(item => {
      if (historySourceFilter !== 'all' && item.source !== historySourceFilter) {
        return false;
      }
      if (historyModelFilter !== 'all' && item.model_id !== historyModelFilter) {
        return false;
      }
      if (historyVoiceFilter !== 'all' && item.voice_id !== historyVoiceFilter) {
        return false;
      }
      if (historySearchQuery.trim()) {
        const q = historySearchQuery.toLowerCase();
        const text = (item.text || item.original_text || '').toLowerCase();
        const vName = (item.voice_name || '').toLowerCase();
        const mName = (item.model_name || '').toLowerCase();
        const tId = (item.id || item.history_item_id || '').toLowerCase();
        if (!text.includes(q) && !vName.includes(q) && !mName.includes(q) && !tId.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [allTasks, historySourceFilter, historyModelFilter, historyVoiceFilter, historySearchQuery]);

  const toggleSelectTask = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredTasks.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTasks.map(t => t.id || t.history_item_id));
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const toggleLogExpansion = (id: string) => {
    setExpandedLogs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm(language === 'zh' ? '确定要删除这条生成记录吗？' : 'Delete this task record?')) return;
    try {
      await apiFetch(`/api/history/${id}`, { method: 'DELETE' });
    } catch (e) {}

    const nextLocal = historyItems.filter(i => i.id !== id);
    setHistoryItems(nextLocal);
    localStorage.setItem('elevenlabs_history_v2', JSON.stringify(nextLocal));
    fetchCloudHistory();
  };

  const handleClearAllHistory = () => {
    if (!confirm(t.clear_history_warn)) return;
    setHistoryItems([]);
    localStorage.removeItem('elevenlabs_history_v2');
    fetchCloudHistory();
  };

  const handleUpdateRating = (id: string, rating: number) => {
    const updated = historyItems.map(item => item.id === id ? { ...item, rating } : item);
    setHistoryItems(updated);
    localStorage.setItem('elevenlabs_history_v2', JSON.stringify(updated));
  };

  const handleUpdateComment = (id: string, comment: string) => {
    const updated = historyItems.map(item => item.id === id ? { ...item, comment } : item);
    setHistoryItems(updated);
    localStorage.setItem('elevenlabs_history_v2', JSON.stringify(updated));
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-200">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <History className="h-5 w-5 text-gray-900" />
            <span>{t.history_title}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 border border-gray-200">
              {allTasks.length} {language === 'zh' ? '条记录' : 'Tasks'}
            </span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {t.history_desc}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchCloudHistory()}
            disabled={loadingCloudHistory}
            className="p-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 rounded-lg transition"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loadingCloudHistory ? 'animate-spin text-black' : ''}`} />
          </button>

          <button
            onClick={handleClearAllHistory}
            className="p-2 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 text-gray-400 hover:text-red-600 rounded-lg transition"
            title="Clear All"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="flex flex-wrap items-center gap-2 pb-1 border-b border-gray-100">
        {[
          { id: 'all', label: t.history_source_filter_all },
          { id: 'tts', label: t.history_source_filter_tts },
          { id: 'dubbing', label: t.history_source_filter_dubbing },
          { id: 'sts', label: t.history_source_filter_sts },
          { id: 'scribe', label: t.history_source_filter_scribe },
          { id: 'sfx', label: t.history_source_filter_sfx },
          { id: 'isolation', label: t.history_source_filter_isolation || (language === 'zh' ? '人声分离提取 (Isolation)' : 'Audio Isolation') },
          { id: 'design', label: t.history_source_filter_design || (language === 'zh' ? '声纹设计 (Design)' : 'Voice Design') },
          { id: 'music', label: language === 'zh' ? 'AI 音乐 (Music)' : 'AI Music' }
        ].map(tab => {
          const active = historySourceFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setHistorySourceFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                active
                  ? 'bg-black text-white'
                  : 'bg-gray-50 text-gray-600 hover:text-black border border-gray-200'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* SEARCH AND DROPDOWN FILTERS */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-6 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={historySearchQuery}
            onChange={(e) => setHistorySearchQuery(e.target.value)}
            placeholder={t.history_search_placeholder}
            className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black transition"
          />
        </div>

        <div className="md:col-span-3">
          <select
            value={historyModelFilter}
            onChange={(e) => setHistoryModelFilter(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-black"
          >
            <option value="all">{t.all_models}</option>
            {models.map(m => (
              <option key={m.model_id} value={m.model_id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3">
          <select
            value={historyVoiceFilter}
            onChange={(e) => setHistoryVoiceFilter(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-black"
          >
            <option value="all">{t.all_voices}</option>
            {voices.map(v => (
              <option key={v.voice_id} value={v.voice_id}>{v.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TASKS LIST */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center space-y-2">
          <History className="h-8 w-8 text-gray-300 mx-auto" />
          <h4 className="text-sm font-semibold text-gray-700">{t.no_history_title}</h4>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            {t.no_history_desc}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((item) => {
            const taskId = item.id || item.history_item_id;
            const isLogsExpanded = !!expandedLogs[taskId];
            const logs: TaskExecutionLog[] = item.logs || [];

            return (
              <div
                key={taskId}
                className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm hover:border-gray-300 transition"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 border border-gray-200 text-[10px] font-semibold rounded">
                      {item.source_name_zh || item.source?.toUpperCase()}
                    </span>
                    <span className="text-xs font-semibold text-gray-900">{item.voice_name || 'Voice'}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{item.model_name || item.model_id}</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>{item.latency_ms ? `${item.latency_ms}ms` : ''}</span>
                    <span>{item.created_at ? new Date(item.created_at).toLocaleTimeString() : ''}</span>
                    <button
                      onClick={() => handleDeleteTask(taskId)}
                      className="text-gray-400 hover:text-red-600 transition"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Text / Input Content */}
                <p className="text-xs text-gray-800 leading-relaxed">
                  {item.text || item.original_text || (language === 'zh' ? '音频媒体生成任务' : 'Audio generation task')}
                </p>

                {/* Audio Player */}
                {item.output_audio_url && (
                  <div className="flex items-center gap-3 pt-1">
                    <audio src={item.output_audio_url} controls className="w-full h-8 accent-black" />
                    <a
                      href={item.output_audio_url}
                      download={`elevenlabs-${taskId}.mp3`}
                      className="p-1.5 text-gray-500 hover:text-black transition shrink-0"
                      title={t.download_audio}
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
