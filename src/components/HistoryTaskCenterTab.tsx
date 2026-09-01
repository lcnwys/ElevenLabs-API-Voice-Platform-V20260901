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
  
  // Selection for batch operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);

  // Expanded log panels by task ID
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Merge server task history with local evaluation records
  const allTasks = React.useMemo(() => {
    // Map local items if not already in cloud list
    const combined: any[] = [...cloudHistory];
    
    // Add any local items that don't exist by ID in cloudHistory
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
          voice_settings: localItem.voice_settings,
          rating: localItem.rating || 0,
          comment: localItem.comment || '',
          logs: [
            {
              timestamp: new Date(localItem.timestamp).toISOString(),
              level: 'INFO',
              stage: 'pipeline_completed',
              message: `Synthesis completed with latency ${localItem.latency || 'N/A'}ms.`,
              duration_ms: localItem.latency
            }
          ]
        });
      }
    });

    return combined.sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : (a.date_unix ? a.date_unix * 1000 : 0);
      const timeB = b.created_at ? new Date(b.created_at).getTime() : (b.date_unix ? b.date_unix * 1000 : 0);
      return timeB - timeA;
    });
  }, [cloudHistory, historyItems]);

  // Filter tasks
  const filteredTasks = allTasks.filter(item => {
    // Source filter
    if (historySourceFilter !== 'all') {
      if (item.source !== historySourceFilter) return false;
    }
    // Model filter
    if (historyModelFilter !== 'all' && item.model_id !== historyModelFilter) {
      return false;
    }
    // Voice filter
    if (historyVoiceFilter !== 'all' && item.voice_id !== historyVoiceFilter) {
      return false;
    }
    // Search query
    if (historySearchQuery.trim()) {
      const q = historySearchQuery.toLowerCase();
      const matchText = (item.text || item.original_text || '').toLowerCase().includes(q);
      const matchId = (item.id || item.history_item_id || '').toLowerCase().includes(q);
      const matchReq = (item.request_id || '').toLowerCase().includes(q);
      const matchFile = (item.original_file_name || '').toLowerCase().includes(q);
      const matchVoice = (item.voice_name || '').toLowerCase().includes(q);
      const matchComment = (item.comment || '').toLowerCase().includes(q);
      return matchText || matchId || matchReq || matchFile || matchVoice || matchComment;
    }
    return true;
  });

  const toggleSelectTask = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredTasks.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTasks.map(t => t.id || t.history_item_id));
    }
  };

  const toggleLogPanel = (id: string) => {
    setExpandedLogs(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCopyText = (id: string, textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Download raw source file
  const handleDownloadSourceFile = async (item: any) => {
    const taskId = item.id || item.history_item_id;
    if (item.original_file_url) {
      // Download from API endpoint
      const link = document.createElement('a');
      link.href = item.original_file_url;
      link.download = item.original_file_name || `source_file_${taskId}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (item.text || item.original_text) {
      // Fallback: download prompt text
      const content = item.text || item.original_text;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `source_prompt_${taskId}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  // Download logs as .log or .json
  const handleDownloadLogs = (item: any, format: 'json' | 'log' = 'log') => {
    const taskId = item.id || item.history_item_id;
    const logs: TaskExecutionLog[] = item.logs || [];
    
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `task_execution_logs_${taskId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const lines = logs.map(l => `[${l.timestamp}] [${l.level}] [${l.stage}] (+${l.duration_ms || 0}ms) ${l.message}`);
      const header = `=== ELEVENLABS TASK EXECUTION LOG ===\nTask ID: ${taskId}\nRequest ID: ${item.request_id || 'N/A'}\nModel: ${item.model_name || item.model_id}\nVoice: ${item.voice_name || item.voice_id}\nTimestamp: ${item.created_at || new Date().toISOString()}\n\n`;
      const blob = new Blob([header + lines.join('\n')], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `task_execution_logs_${taskId}.log`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Batch download selected tasks
  const handleBatchDownload = async () => {
    if (selectedIds.length === 0) return;
    setIsBatchDownloading(true);
    try {
      const res = await apiFetch('/api/history/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history_item_ids: selectedIds })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `elevenlabs_tasks_bundle_${Date.now()}.zip`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        alert(language === 'zh' ? '批量打包下载完成' : 'Batch bundle generated');
      }
    } catch (err) {
      console.error('Batch download error:', err);
    } finally {
      setIsBatchDownloading(false);
    }
  };

  // Export full history as JSON
  const handleExportFullJson = () => {
    const blob = new Blob([JSON.stringify(allTasks, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `elevenlabs_task_history_full_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export full CSV
  const handleExportCsv = () => {
    const headers = ['Task_ID', 'Request_ID', 'Source', 'Model', 'Voice', 'Created_At', 'Latency_ms', 'Billed_Chars', 'Rating', 'Prompt_Text', 'Comment'];
    const rows = allTasks.map(t => [
      `"${t.id || t.history_item_id}"`,
      `"${t.request_id || ''}"`,
      `"${t.source || 'tts'}"`,
      `"${t.model_name || t.model_id}"`,
      `"${t.voice_name || t.voice_id}"`,
      `"${t.created_at || ''}"`,
      `"${t.latency_ms || ''}"`,
      `"${t.billed_characters || ''}"`,
      `"${t.rating || 0}"`,
      `"${(t.text || '').replace(/"/g, '""')}"`,
      `"${(t.comment || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `elevenlabs_history_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Delete single task item
  const handleDeleteTask = async (id: string) => {
    if (!confirm(language === 'zh' ? '确定要删除此条历史记录吗？' : 'Delete this task record?')) return;
    
    // Call server delete if supported
    try {
      await apiFetch(`/api/history/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn(e);
    }

    // Update local state
    const nextLocal = historyItems.filter(i => i.id !== id);
    setHistoryItems(nextLocal);
    localStorage.setItem('elevenlabs_history_v2', JSON.stringify(nextLocal));

    // Refresh cloud list
    fetchCloudHistory();
  };

  // Clear all history
  const handleClearAllHistory = () => {
    if (!confirm(t.clear_history_warn)) return;
    setHistoryItems([]);
    localStorage.removeItem('elevenlabs_history_v2');
    fetchCloudHistory();
  };

  // Update rating
  const handleUpdateRating = (id: string, rating: number) => {
    const updated = historyItems.map(item => item.id === id ? { ...item, rating } : item);
    setHistoryItems(updated);
    localStorage.setItem('elevenlabs_history_v2', JSON.stringify(updated));
  };

  // Update comment
  const handleUpdateComment = (id: string, comment: string) => {
    const updated = historyItems.map(item => item.id === id ? { ...item, comment } : item);
    setHistoryItems(updated);
    localStorage.setItem('elevenlabs_history_v2', JSON.stringify(updated));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950">
                <History className="h-5 w-5 font-bold" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  {t.history_title}
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {allTasks.length} {language === 'zh' ? '项已归档任务' : 'Archived Tasks'}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
                  {t.history_desc}
                </p>
              </div>
            </div>
          </div>

          {/* Global Action Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {selectedIds.length > 0 && (
              <button
                id="btn_batch_download_tasks"
                onClick={handleBatchDownload}
                disabled={isBatchDownloading}
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
              >
                <FileDown className="h-3.5 w-3.5" />
                {t.history_batch_download} ({selectedIds.length})
              </button>
            )}

            <button
              id="btn_export_all_json"
              onClick={handleExportFullJson}
              className="px-3 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <FileCode className="h-3.5 w-3.5 text-blue-400" />
              {t.history_export_all_json}
            </button>

            <button
              id="btn_export_all_csv"
              onClick={handleExportCsv}
              className="px-3 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5 text-emerald-400" />
              {t.history_export_all_csv}
            </button>

            <button
              id="btn_refresh_history"
              onClick={() => fetchCloudHistory()}
              disabled={loadingCloudHistory}
              className="p-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
              title="Refresh History"
            >
              <RefreshCw className={`h-4 w-4 ${loadingCloudHistory ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            <button
              id="btn_clear_all_history"
              onClick={handleClearAllHistory}
              className="p-2 bg-slate-950 border border-red-500/20 hover:bg-red-500/10 text-red-400 rounded-xl transition cursor-pointer"
              title="Clear All History"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Source Categories Sub-Navigation Filter */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-slate-800/60">
          {[
            { id: 'all', label: t.history_source_filter_all, icon: Layers },
            { id: 'tts', label: t.history_source_filter_tts, icon: Volume2 },
            { id: 'dubbing', label: t.history_source_filter_dubbing, icon: Film },
            { id: 'sts', label: t.history_source_filter_sts, icon: Radio },
            { id: 'scribe', label: t.history_source_filter_scribe, icon: FileText },
            { id: 'sfx', label: t.history_source_filter_sfx, icon: Music },
            { id: 'isolation', label: t.history_source_filter_isolation, icon: Sparkles },
            { id: 'design', label: t.history_source_filter_design, icon: Zap }
          ].map(tab => {
            const Icon = tab.icon;
            const active = historySourceFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setHistorySourceFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  active
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 border border-slate-850 hover:text-slate-200 hover:border-slate-800'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Search */}
        <div className="md:col-span-6 relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={historySearchQuery}
            onChange={(e) => setHistorySearchQuery(e.target.value)}
            placeholder={t.history_search_placeholder}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* Model Filter */}
        <div className="md:col-span-3">
          <select
            value={historyModelFilter}
            onChange={(e) => setHistoryModelFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 transition cursor-pointer"
          >
            <option value="all">{t.all_models}</option>
            {models.map(m => (
              <option key={m.model_id} value={m.model_id}>{m.name}</option>
            ))}
          </select>
        </div>

        {/* Voice Filter */}
        <div className="md:col-span-3">
          <select
            value={historyVoiceFilter}
            onChange={(e) => setHistoryVoiceFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 transition cursor-pointer"
          >
            <option value="all">{t.all_voices}</option>
            {voices.map(v => (
              <option key={v.voice_id} value={v.voice_id}>{v.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Batch Select Controls */}
      <div className="flex items-center justify-between px-2 text-xs text-slate-400">
        <label className="flex items-center space-x-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={selectedIds.length > 0 && selectedIds.length === filteredTasks.length}
            onChange={toggleSelectAll}
            className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-0 cursor-pointer"
          />
          <span>{language === 'zh' ? '全选本页筛选结果' : 'Select All Filtered Tasks'} ({filteredTasks.length})</span>
        </label>
        <span>
          {language === 'zh' ? `共展示 ${filteredTasks.length} 个历史任务` : `Showing ${filteredTasks.length} historical tasks`}
        </span>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <History className="h-12 w-12 text-slate-600 mx-auto stroke-[1.5]" />
          <h4 className="text-sm font-bold text-slate-300">{t.no_history_title}</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {t.no_history_desc}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((item) => {
            const taskId = item.id || item.history_item_id;
            const isSelected = selectedIds.includes(taskId);
            const isLogsExpanded = !!expandedLogs[taskId];
            const logs: TaskExecutionLog[] = item.logs || [];

            // Identify source badge color
            const sourceColor = 
              item.source === 'dubbing' ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' :
              item.source === 'sts' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
              item.source === 'scribe' ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' :
              item.source === 'sfx' ? 'text-pink-400 bg-pink-500/10 border-pink-500/20' :
              item.source === 'isolation' ? 'text-teal-400 bg-teal-500/10 border-teal-500/20' :
              'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';

            return (
              <div
                key={taskId}
                className={`bg-slate-900 border rounded-2xl p-5 space-y-4 transition ${
                  isSelected ? 'border-emerald-500/50 bg-slate-900/90 shadow-lg shadow-emerald-500/5' : 'border-slate-800 hover:border-slate-750'
                }`}
              >
                {/* 1. Header: Metadata, IDs, badges, actions */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800/60 pb-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectTask(taskId)}
                      className="rounded bg-slate-950 border-slate-850 text-emerald-500 focus:ring-0 mr-1 cursor-pointer"
                    />

                    {/* Source Badge */}
                    <span className={`px-2.5 py-0.5 border text-[11px] font-bold rounded-lg ${sourceColor}`}>
                      {item.source_name_zh || item.source?.toUpperCase()}
                    </span>

                    {/* Task ID with Copy */}
                    <button
                      onClick={() => handleCopyText(`task_${taskId}`, taskId)}
                      className="flex items-center gap-1 px-2 py-0.5 bg-slate-950 border border-slate-850 hover:border-slate-700 text-[10px] text-slate-400 hover:text-slate-200 rounded-md font-mono transition"
                      title="Copy Task ID"
                    >
                      <span>Task: {taskId.length > 18 ? taskId.slice(0, 16) + '...' : taskId}</span>
                      {copiedId === `task_${taskId}` ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    </button>

                    {/* Request ID if present */}
                    {item.request_id && (
                      <span className="hidden sm:inline-flex items-center px-2 py-0.5 bg-slate-950 border border-slate-850 text-[10px] text-slate-500 rounded-md font-mono">
                        Req: {item.request_id}
                      </span>
                    )}

                    {/* Creation Timestamp */}
                    <span className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-850">
                      <Clock className="h-3 w-3 text-slate-500" />
                      {item.created_at ? new Date(item.created_at).toLocaleString() : (item.date_unix ? new Date(item.date_unix * 1000).toLocaleString() : 'N/A')}
                    </span>

                    {/* Voice and Model */}
                    <span className="px-2 py-0.5 bg-slate-950 text-slate-300 border border-slate-850 text-[10px] font-medium rounded-md">
                      {item.voice_name || item.voice_id}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-950 text-blue-400 border border-slate-850 text-[10px] font-medium rounded-md">
                      {item.model_name || item.model_id}
                    </span>

                    {/* Latency & Billing */}
                    {item.latency_ms && (
                      <span className="text-[10px] text-slate-500 font-medium">
                        {t.latency}: <strong className="text-slate-300">{item.latency_ms}ms</strong>
                      </span>
                    )}
                    {item.billed_characters !== undefined && item.billed_characters > 0 && (
                      <span className="text-[10px] text-slate-500 font-medium">
                        {t.history_chars_billed}: <strong className="text-emerald-400">{item.billed_characters}</strong>
                      </span>
                    )}
                  </div>

                  {/* Top Right Quick Actions */}
                  <div className="flex items-center space-x-2 self-end lg:self-auto">
                    <button
                      onClick={() => toggleLogPanel(taskId)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition flex items-center gap-1 font-semibold cursor-pointer ${
                        isLogsExpanded
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Terminal className="h-3 w-3" />
                      {isLogsExpanded ? t.history_hide_logs : `${t.history_view_logs} (${logs.length})`}
                      {isLogsExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>

                    <button
                      onClick={() => handleDeleteTask(taskId)}
                      className="p-1.5 bg-slate-950 border border-slate-800 hover:border-red-500/30 text-slate-500 hover:text-red-400 rounded-lg transition cursor-pointer"
                      title={t.history_remove}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* 2. Body: Source Input and Generated Output Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Left Column: Original Input (Text, Prompt, Files) */}
                  <div className="lg:col-span-6 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="h-3 w-3 text-slate-400" />
                        {t.history_prompt_text}
                      </span>

                      <div className="flex items-center space-x-2">
                        {item.text && (
                          <button
                            onClick={() => handleCopyText(`text_${taskId}`, item.text)}
                            className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 font-medium transition cursor-pointer"
                          >
                            {copiedId === `text_${taskId}` ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            {copiedId === `text_${taskId}` ? t.history_copied : t.history_copy_text}
                          </button>
                        )}
                        <button
                          onClick={() => handleDownloadSourceFile(item)}
                          className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-bold transition cursor-pointer"
                          title="Download Raw Source Input"
                        >
                          <Download className="h-3 w-3" />
                          {item.original_file_name ? t.history_download_source : t.history_download_prompt}
                        </button>
                      </div>
                    </div>

                    {/* Text preview */}
                    {item.text && (
                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-3 rounded-xl border border-slate-850/70 max-h-32 overflow-y-auto font-sans">
                        {item.text}
                      </p>
                    )}

                    {/* Original Source File Badge (Video/Audio/Text) */}
                    {item.original_file_name && (
                      <div className="flex items-center justify-between bg-slate-950/90 border border-slate-800/80 rounded-xl p-2.5 text-xs">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          {item.original_file_type?.startsWith('video') ? (
                            <Film className="h-4 w-4 text-purple-400 shrink-0" />
                          ) : (
                            <FileAudio className="h-4 w-4 text-amber-400 shrink-0" />
                          )}
                          <div className="truncate">
                            <span className="font-mono text-slate-200 block truncate">{item.original_file_name}</span>
                            <span className="text-[10px] text-slate-500">
                              {item.original_file_size_bytes ? `${(item.original_file_size_bytes / (1024 * 1024)).toFixed(2)} MB` : item.original_file_type}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownloadSourceFile(item)}
                          className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-emerald-400 text-[11px] font-bold rounded-lg transition shrink-0 flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="h-3 w-3" />
                          {t.history_download_source}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Audio player & Output Assets */}
                  <div className="lg:col-span-6 space-y-2.5 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Volume2 className="h-3 w-3 text-slate-400" />
                          {language === 'zh' ? '生成产物与试听' : 'Output Stream & Player'}
                        </span>
                        
                        <div className="flex items-center space-x-2">
                          {/* Subtitles Download */}
                          {item.output_subtitles_url && (
                            <a
                              href={item.output_subtitles_url}
                              download={`subtitles_${taskId}.srt`}
                              className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold transition"
                            >
                              <Download className="h-3 w-3" />
                              {t.history_download_subtitles}
                            </a>
                          )}
                          
                          {/* Audio Download */}
                          {(item.output_audio_url || item.audioUrl) && (
                            <a
                              href={item.output_audio_url || item.audioUrl}
                              download={`elevenlabs_${taskId}.mp3`}
                              className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-bold transition"
                            >
                              <Download className="h-3 w-3" />
                              {t.history_download_audio}
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Audio Player */}
                      <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850/80 flex items-center gap-3">
                        {(item.output_audio_url || item.audioUrl) ? (
                          <audio
                            src={item.output_audio_url || item.audioUrl}
                            controls
                            className="w-full h-8 accent-emerald-500"
                          />
                        ) : (
                          <div className="text-xs text-slate-500 flex items-center gap-1.5 py-1">
                            <AlertCircle className="h-3.5 w-3.5 text-slate-600" />
                            {t.history_no_cache}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Parameter Snapshot if available */}
                    {item.voice_settings && (
                      <div className="grid grid-cols-4 gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-850/50 text-[10px] text-slate-400">
                        <div>Stability: <strong className="text-slate-200">{item.voice_settings.stability}%</strong></div>
                        <div>Similarity: <strong className="text-slate-200">{item.voice_settings.similarity_boost}%</strong></div>
                        <div>Style: <strong className="text-slate-200">{item.voice_settings.style || 0}%</strong></div>
                        <div>Boost: <strong className={item.voice_settings.use_speaker_boost ? 'text-emerald-400' : 'text-slate-400'}>{item.voice_settings.use_speaker_boost ? 'ON' : 'OFF'}</strong></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Expandable Execution Logs & Tracing Panel */}
                {isLogsExpanded && (
                  <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                      <div className="flex items-center space-x-2">
                        <Terminal className="h-4 w-4 text-emerald-400" />
                        <span className="font-bold text-slate-200 text-[11px] uppercase tracking-wider">
                          {language === 'zh' ? '全链路微秒级执行日志 (Execution Trace)' : 'Execution Logs & Traces'}
                        </span>
                        <span className="text-[10px] text-slate-500">({logs.length} stages)</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDownloadLogs(item, 'log')}
                          className="px-2 py-0.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-[10px] text-slate-300 hover:text-white rounded-md transition flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="h-3 w-3" />
                          .log
                        </button>
                        <button
                          onClick={() => handleDownloadLogs(item, 'json')}
                          className="px-2 py-0.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-[10px] text-slate-300 hover:text-white rounded-md transition flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="h-3 w-3" />
                          .json
                        </button>
                      </div>
                    </div>

                    {logs.length === 0 ? (
                      <div className="text-slate-500 text-[11px] py-2">
                        {language === 'zh' ? '暂无结构化日志记录' : 'No structured logs recorded for this task.'}
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {logs.map((log, idx) => {
                          const levelColor = 
                            log.level === 'ERROR' ? 'text-red-400 bg-red-500/10' :
                            log.level === 'WARN' ? 'text-amber-400 bg-amber-500/10' :
                            log.level === 'DEBUG' ? 'text-slate-400 bg-slate-800/40' :
                            'text-emerald-400 bg-emerald-500/10';

                          return (
                            <div key={idx} className="flex flex-col sm:flex-row sm:items-start gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-850/50">
                              <span className="text-[10px] text-slate-500 shrink-0">
                                {new Date(log.timestamp).toLocaleTimeString()}.{new Date(log.timestamp).getMilliseconds().toString().padStart(3, '0')}
                              </span>
                              <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded shrink-0 ${levelColor}`}>
                                {log.level}
                              </span>
                              <span className="text-[10px] font-semibold text-teal-400 shrink-0">
                                [{log.stage}]
                              </span>
                              {log.duration_ms !== undefined && (
                                <span className="text-[10px] text-slate-400 shrink-0">
                                  +{log.duration_ms}ms
                                </span>
                              )}
                              <span className="text-slate-300 text-[11px] break-all flex-1">
                                {log.message}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Footer Row: Rating & Comments */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-850/40">
                  {/* Rating */}
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-bold text-slate-400">{t.history_rating_label}</span>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleUpdateRating(taskId, star)}
                          className="transition hover:scale-110 cursor-pointer"
                        >
                          <Star
                            className={`h-4 w-4 ${
                              star <= (item.rating || 0)
                                ? 'fill-emerald-400 text-emerald-400'
                                : 'text-slate-800 hover:text-slate-500'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Commentary */}
                  <div className="flex items-center space-x-2 w-full sm:w-2/3">
                    <MessageSquare className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <input
                      type="text"
                      value={item.comment || ''}
                      onChange={(e) => handleUpdateComment(taskId, e.target.value)}
                      placeholder={t.history_feedback_placeholder}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
