import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CreditCard,
  Key,
  PieChart,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Plus,
  Trash2,
  Lock,
  Layers,
  Sparkles,
  Zap,
  Globe,
  Sliders,
  DollarSign,
  Server,
  FileSpreadsheet,
  Download,
  Terminal,
  ExternalLink,
  Settings,
  HelpCircle,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Calculator,
  Info,
  Coins,
  Users,
  UserPlus,
  Shield,
  Radio,
  Send,
  History,
  FileText,
  LockKeyhole,
  Check,
  X,
  Play
} from 'lucide-react';
import {
  SubscriptionUsage,
  CostAttributionItem,
  ServiceApiKey,
  WorkspaceMember,
  WorkspaceGroup,
  WorkspaceWebhook,
  EnterpriseAuditLogItem,
  PvcSlotsOverview,
  PvcSlot
} from '../types';

interface EnterpriseBillingProps {
  language: 'zh' | 'en';
  t: any;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
  apiStatus: { configured: boolean; mode: string };
  onOpenSettings?: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const EnterpriseBillingTab: React.FC<EnterpriseBillingProps> = ({
  language,
  t,
  apiFetch,
  apiStatus,
  onOpenSettings,
  onNavigateToTab
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'pvc_slots' | 'keys' | 'members' | 'groups' | 'webhooks' | 'audit'>('overview');

  const [subscription, setSubscription] = useState<SubscriptionUsage | null>(null);
  const [pvcOverview, setPvcOverview] = useState<PvcSlotsOverview | null>(null);
  const [costItems, setCostItems] = useState<CostAttributionItem[]>([]);
  const [totalCostUsd, setTotalCostUsd] = useState(0);
  const [apiKeys, setApiKeys] = useState<ServiceApiKey[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [groups, setGroups] = useState<WorkspaceGroup[]>([]);
  const [webhooks, setWebhooks] = useState<WorkspaceWebhook[]>([]);
  const [auditLogs, setAuditLogs] = useState<EnterpriseAuditLogItem[]>([]);
  const [securityPolicy, setSecurityPolicy] = useState<any>(null);
  const [playingPvcSlotId, setPlayingPvcSlotId] = useState<string | null>(null);
  const [releasingSlotId, setReleasingSlotId] = useState<string | null>(null);
  const [retrainingSlotId, setRetrainingSlotId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showBillingDetail, setShowBillingDetail] = useState(false);
  const [showCreditsGuide, setShowCreditsGuide] = useState(false);

  // Department filter for cost breakdown
  const [selectedDept, setSelectedDept] = useState('all');

  // Quick Key Input in Enterprise Tab
  const [quickApiKey, setQuickApiKey] = useState(() => localStorage.getItem('elevenlabs_custom_api_key') || '');
  const [showQuickKey, setShowQuickKey] = useState(false);
  const [quickKeySaving, setQuickKeySaving] = useState(false);
  const [quickKeyMsg, setQuickKeyMsg] = useState<string | null>(null);

  // New API Key Modal/Form state
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyDept, setNewKeyDept] = useState('智能客服 AI 组');
  const [newKeyType, setNewKeyType] = useState<'service_account' | 'user' | 'proxy_router'>('service_account');
  const [newKeySource, setNewKeySource] = useState<'elevenlabs_cloud' | 'gateway_proxy'>('elevenlabs_cloud');
  const [newKeyQuota, setNewKeyQuota] = useState(100000);
  const [keyCreatedAlert, setKeyCreatedAlert] = useState<string | null>(null);
  const [keyWarningAlert, setKeyWarningAlert] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Member Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'workspace_admin' | 'financial_admin'>('member');
  const [inviteDept, setInviteDept] = useState('智能客服 AI 组');
  const [inviteQuota, setInviteQuota] = useState(100000);

  // Group Modal State
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupQuota, setNewGroupQuota] = useState(300000);
  const [newGroupModels, setNewGroupModels] = useState<string[]>(['eleven_multilingual_v2', 'eleven_flash_v2_5']);

  // Webhook Modal State
  const [showNewWebhookModal, setShowNewWebhookModal] = useState(false);
  const [newWebhookName, setNewWebhookName] = useState('');
  const [newWebhookUrl, setNewWebhookUrl] = useState('https://api.yourdomain.com/webhooks/11labs');
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>(['tts.completed', 'dubbing.completed']);
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);
  const [webhookTestResult, setWebhookTestResult] = useState<any | null>(null);

  const fetchEnterpriseData = async () => {
    try {
      setRefreshing(true);
      // 1. Subscription
      const subRes = await apiFetch('/api/subscription');
      let loadedSub: SubscriptionUsage | null = null;
      if (subRes.ok) {
        loadedSub = await subRes.json();
        setSubscription(loadedSub);
      }

      // 2. Cost Attribution Breakdown
      const costRes = await apiFetch('/api/billing-breakdown');
      if (costRes.ok) {
        const costData = await costRes.json();
        setCostItems(costData.breakdown || []);
        if (typeof costData.total_cost_usd === 'number') {
          setTotalCostUsd(costData.total_cost_usd);
        } else if (loadedSub?.total_estimated_spend_usd) {
          setTotalCostUsd(loadedSub.total_estimated_spend_usd);
        }
      }

      // 3. API Keys
      const keysRes = await apiFetch('/api/workspace/keys');
      if (keysRes.ok) {
        const keysData = await keysRes.json();
        setApiKeys(keysData.keys || []);
      }

      // 4. Members
      const membersRes = await apiFetch('/api/workspace/members');
      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData.members || []);
      }

      // 5. Groups
      const groupsRes = await apiFetch('/api/workspace/groups');
      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        setGroups(groupsData.groups || []);
      }

      // 6. Webhooks
      const whRes = await apiFetch('/api/workspace/webhooks');
      if (whRes.ok) {
        const whData = await whRes.json();
        setWebhooks(whData.webhooks || []);
      }

      // 7. Audit Logs
      const auditRes = await apiFetch('/api/workspace/audit-logs');
      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditLogs(auditData.logs || []);
      }

      // 8. Security Policy
      const secRes = await apiFetch('/api/workspace/security');
      if (secRes.ok) {
        const secData = await secRes.json();
        setSecurityPolicy(secData);
      }

      // 9. PVC Slots Fleet
      const pvcRes = await apiFetch('/api/pvc/slots');
      if (pvcRes.ok) {
        const pvcData = await pvcRes.json();
        setPvcOverview(pvcData);
      }
    } catch (err) {
      console.error('Failed to load enterprise data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEnterpriseData();
  }, []);

  const handleSaveQuickKey = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = quickApiKey.trim();
    if (cleanKey) {
      localStorage.setItem('elevenlabs_custom_api_key', cleanKey);
      setQuickKeyMsg(language === 'zh' ? '已保存 API Key！正在连接 ElevenLabs 官方接口获取实时数据...' : 'API Key saved! Connecting to ElevenLabs live data...');
    } else {
      localStorage.removeItem('elevenlabs_custom_api_key');
      setQuickKeyMsg(language === 'zh' ? '已清除自定义 Key，已回退为系统环境默认/评估模拟器模式' : 'Cleared custom key.');
    }
    setQuickKeySaving(true);
    setTimeout(() => {
      fetchEnterpriseData();
      setQuickKeySaving(false);
      window.location.reload();
    }, 1200);
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    try {
      const res = await apiFetch('/api/workspace/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName,
          department: newKeyDept,
          type: newKeyType,
          requested_source: newKeySource,
          character_quota: newKeyQuota
        })
      });
      if (res.ok) {
        const data = await res.json();
        setApiKeys(prev => [data.key, ...prev]);
        setNewKeyName('');
        setShowNewKeyModal(false);
        if (data.warning) {
          setKeyWarningAlert(data.warning);
          setTimeout(() => setKeyWarningAlert(null), 8000);
        } else {
          setKeyCreatedAlert(data.message || (language === 'zh' ? '新业务 API 密钥创建成功！' : 'New API Key successfully provisioned.'));
          setTimeout(() => setKeyCreatedAlert(null), 4500);
        }
      }
    } catch (err) {
      console.error('Failed to create key:', err);
    }
  };

  const copyKeyText = (key: ServiceApiKey) => {
    const textToCopy = key.raw_secret_key || key.prefix;
    navigator.clipboard.writeText(textToCopy);
    setCopiedKeyId(key.key_id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleDeleteKey = async (keyId: string) => {
    try {
      const res = await apiFetch(`/api/workspace/keys/${keyId}`, { method: 'DELETE' });
      if (res.ok) {
        setApiKeys(prev => prev.filter(k => k.key_id !== keyId));
      }
    } catch (err) {
      console.error('Failed to delete key:', err);
    }
  };

  const handleReleasePvcSlot = async (slotId: string) => {
    if (!confirm(language === 'zh' ? '确定要释放该专业声音克隆插槽吗？已训练的模型将被归档释放。' : 'Are you sure you want to release this PVC slot?')) return;
    try {
      setReleasingSlotId(slotId);
      const res = await apiFetch(`/api/pvc/slots/${slotId}/release`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setPvcOverview(data.overview);
      }
    } catch (err) {
      console.error('Failed to release slot:', err);
    } finally {
      setReleasingSlotId(null);
    }
  };

  const handleRetrainPvcSlot = async (slotId: string) => {
    try {
      setRetrainingSlotId(slotId);
      const res = await apiFetch(`/api/pvc/slots/${slotId}/retrain`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setPvcOverview(data.overview);
      }
    } catch (err) {
      console.error('Failed to retrain slot:', err);
    } finally {
      setRetrainingSlotId(null);
    }
  };

  const handlePlayPvcPreview = async (slot: PvcSlot) => {
    if (playingPvcSlotId === slot.slot_id) {
      setPlayingPvcSlotId(null);
      return;
    }
    try {
      setPlayingPvcSlotId(slot.slot_id);
      const res = await apiFetch(`/api/pvc/slots/${slot.slot_id}/preview`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => setPlayingPvcSlotId(null);
        audio.onerror = () => setPlayingPvcSlotId(null);
        await audio.play();
      } else {
        setPlayingPvcSlotId(null);
      }
    } catch (err) {
      console.error('Preview playback failed:', err);
      setPlayingPvcSlotId(null);
    }
  };

  // Member Handlers
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      const res = await apiFetch('/api/workspace/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          department: inviteDept,
          character_limit: inviteQuota
        })
      });
      if (res.ok) {
        const data = await res.json();
        setMembers(prev => [...prev, data.member]);
        setInviteEmail('');
        setShowInviteModal(false);
      }
    } catch (err) {
      console.error('Invite member error:', err);
    }
  };

  const handleDeleteMember = async (userId: string) => {
    try {
      const res = await apiFetch(`/api/workspace/members/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        setMembers(prev => prev.filter(m => m.user_id !== userId));
      }
    } catch (err) {
      console.error('Delete member error:', err);
    }
  };

  // Group Handlers
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      const res = await apiFetch('/api/workspace/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGroupName,
          description: newGroupDesc,
          allowed_models: newGroupModels,
          max_character_quota: newGroupQuota
        })
      });
      if (res.ok) {
        const data = await res.json();
        setGroups(prev => [...prev, data.group]);
        setNewGroupName('');
        setNewGroupDesc('');
        setShowNewGroupModal(false);
      }
    } catch (err) {
      console.error('Create group error:', err);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      const res = await apiFetch(`/api/workspace/groups/${groupId}`, { method: 'DELETE' });
      if (res.ok) {
        setGroups(prev => prev.filter(g => g.group_id !== groupId));
      }
    } catch (err) {
      console.error('Delete group error:', err);
    }
  };

  // Webhook Handlers
  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebhookName.trim() || !newWebhookUrl.trim()) return;

    try {
      const res = await apiFetch('/api/workspace/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newWebhookName,
          url: newWebhookUrl,
          events: newWebhookEvents
        })
      });
      if (res.ok) {
        const data = await res.json();
        setWebhooks(prev => [data.webhook, ...prev]);
        setNewWebhookName('');
        setShowNewWebhookModal(false);
      }
    } catch (err) {
      console.error('Create webhook error:', err);
    }
  };

  const handleTestWebhook = async (webhookId: string) => {
    try {
      setTestingWebhookId(webhookId);
      const res = await apiFetch(`/api/workspace/webhooks/${webhookId}/test`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setWebhookTestResult(data);
      }
    } catch (err) {
      console.error('Test webhook error:', err);
    } finally {
      setTestingWebhookId(null);
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    try {
      const res = await apiFetch(`/api/workspace/webhooks/${webhookId}`, { method: 'DELETE' });
      if (res.ok) {
        setWebhooks(prev => prev.filter(w => w.webhook_id !== webhookId));
      }
    } catch (err) {
      console.error('Delete webhook error:', err);
    }
  };

  const filteredCostItems = selectedDept === 'all'
    ? costItems
    : costItems.filter(item => item.department === selectedDept);

  const departmentsList = Array.from(new Set(costItems.map(c => c.department)));

  const charPercentage = subscription 
    ? Math.min(100, Math.round((subscription.character_count / (subscription.character_limit || 1)) * 100))
    : 36;

  return (
    <div id="enterprise_billing_container" className="space-y-6 animate-in fade-in duration-300">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <span>{language === 'zh' ? '企业级管理控制台 (Enterprise Workspace)' : 'Enterprise Workspace & Governance'}</span>
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            {language === 'zh'
              ? '全功能企业级矩阵：多席位权限分派、部门分账隔离、业务线 API 密钥、自动化 Webhooks 与审计合规'
              : 'Complete enterprise suite: Multi-seat RBAC, cost attribution, scoped keys, webhooks, and security audit trail.'}
          </p>
        </div>
        <button
          onClick={fetchEnterpriseData}
          disabled={refreshing}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-2 transition disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-emerald-400 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{language === 'zh' ? '同步云端最新数据' : 'Sync Live Cloud'}</span>
        </button>
      </div>

      {/* SUB-TABS NAVIGATION PILLS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800/80">
        {[
          { id: 'overview', icon: PieChart, label_zh: '用量与分账总览', label_en: 'Overview & Billing' },
          { id: 'pvc_slots', icon: Layers, label_zh: `专业音色插槽 (${pvcOverview ? `${pvcOverview.used_slots}/${pvcOverview.total_slots}` : '2/6'})`, label_en: `Voice Slots (${pvcOverview ? `${pvcOverview.used_slots}/${pvcOverview.total_slots}` : '2/6'})` },
          { id: 'keys', icon: Key, label_zh: `业务密钥 (${apiKeys.length})`, label_en: `Scoped Keys (${apiKeys.length})` },
          { id: 'members', icon: Users, label_zh: `多席位成员 (${members.length})`, label_en: `Members (${members.length})` },
          { id: 'groups', icon: Shield, label_zh: `部门权限组 (${groups.length})`, label_en: `Permission Groups (${groups.length})` },
          { id: 'webhooks', icon: Radio, label_zh: `事件 Webhooks (${webhooks.length})`, label_en: `Webhooks (${webhooks.length})` },
          { id: 'audit', icon: History, label_zh: '审计日志与合规', label_en: 'Audit Trail & SSO' }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                isActive
                  ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-sm shadow-purple-900/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-purple-400' : 'text-slate-500'}`} />
              <span>{language === 'zh' ? tab.label_zh : tab.label_en}</span>
            </button>
          );
        })}
      </div>

      {/* KEY CONFIGURATION & LIVE STATUS HERO BANNER */}
      <div className={`rounded-2xl p-4 border transition-all duration-300 ${
        apiStatus.configured 
          ? 'bg-purple-950/20 border-purple-500/30 shadow-lg shadow-purple-900/10' 
          : 'bg-amber-950/20 border-amber-500/30'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${
                apiStatus.configured
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                {apiStatus.configured ? (language === 'zh' ? '✓ 官方云端已连接 (Live API)' : '✓ Connected to Live API') : (language === 'zh' ? '⚡ 模拟评估演示数据 (Simulator)' : '⚡ Simulation Demo Data')}
              </span>
              <span className="text-xs text-slate-300 font-medium">
                {apiStatus.configured ? (language === 'zh' ? '当前正读取您的官方 ElevenLabs 订阅与真实用量' : 'Displaying real ElevenLabs subscription & usage') : (language === 'zh' ? '当前显示的是模拟企业数据，配置 Key 后即可查看真实数据' : 'Showing simulated data. Configure your API key to load real metrics.')}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {language === 'zh'
                ? '支持在下方直接输入 xi-api-key 连接官方 Scale/Enterprise 组织订阅，或使用网关密钥进行下属部门配额隔离。'
                : 'Enter your xi-api-key below to connect your official Scale/Enterprise plan or manage scoped gateway keys.'}
            </p>
          </div>

          {/* Quick Key Input Trigger */}
          <form onSubmit={handleSaveQuickKey} className="flex items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-72">
              <Key className="absolute left-3 top-2.5 h-3.5 w-3.5 text-purple-400" />
              <input
                type={showQuickKey ? 'text' : 'password'}
                value={quickApiKey}
                onChange={e => setQuickApiKey(e.target.value)}
                placeholder="xi-api-key (e.g. sk_...)"
                className="w-full bg-slate-950/80 border border-purple-500/30 focus:border-purple-400 rounded-xl pl-9 pr-8 py-1.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowQuickKey(!showQuickKey)}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200"
              >
                {showQuickKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            <button
              type="submit"
              disabled={quickKeySaving}
              className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-md shadow-purple-900/30 shrink-0"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{quickKeySaving ? (language === 'zh' ? '连接中...' : 'Saving...') : (language === 'zh' ? '保存 Key' : 'Save Key')}</span>
            </button>
          </form>
        </div>

        {quickKeyMsg && (
          <div className="mt-2.5 p-2 bg-purple-500/15 border border-purple-500/30 rounded-xl text-xs text-purple-300 font-medium">
            {quickKeyMsg}
          </div>
        )}
      </div>

      {/* SUBTAB 1: OVERVIEW & BILLING */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in">
          {/* SECTION 1: SUBSCRIPTION TIERS & REAL-TIME QUOTA CARDS */}
          {(() => {
            const resetDays = subscription?.next_character_count_reset_unix
              ? Math.max(0, Math.ceil((subscription.next_character_count_reset_unix - Math.floor(Date.now() / 1000)) / 86400))
              : 14;

            const resetDateFormatted = subscription?.next_character_count_reset_unix
              ? new Date(subscription.next_character_count_reset_unix * 1000).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
              : '';

            const getTierInfo = (rawTier?: string) => {
              const norm = (rawTier || 'free').toLowerCase();
              if (norm.includes('growing') || norm === 'growing_business' || norm === 'scale') {
                return {
                  displayName: language === 'zh' ? 'Scale 规模扩展版' : 'Scale Plan',
                  subCode: 'Scale ($299/mo)',
                  badge: language === 'zh' ? '团队规模版' : 'Scale Tier',
                  badgeClass: 'bg-purple-500/20 border-purple-400/40 text-purple-200',
                  desc: language === 'zh' ? '含 1,810,000 月度通用积分(Credits)与 30 并发通道' : 'Includes 1,810,000 credits & 30 concurrency',
                  baseMonthlyFee: 299,
                  isCommercial: true
                };
              } else if (norm.includes('business')) {
                return {
                  displayName: language === 'zh' ? '企业商业版' : 'Business Plan',
                  subCode: 'Business ($990/mo)',
                  badge: language === 'zh' ? '企业版' : 'Business Tier',
                  badgeClass: 'bg-purple-500/20 border-purple-400/40 text-purple-200',
                  desc: language === 'zh' ? '含 6,000,000 月度通用积分与大容量生产并发' : 'High concurrency production tier',
                  baseMonthlyFee: 990,
                  isCommercial: true
                };
              } else if (norm.includes('pro')) {
                return {
                  displayName: language === 'zh' ? '专业版' : 'Pro Plan',
                  subCode: 'Pro ($99/mo)',
                  badge: language === 'zh' ? '专业版' : 'Pro Tier',
                  badgeClass: 'bg-indigo-500/20 border-indigo-400/40 text-indigo-200',
                  desc: language === 'zh' ? '包含 500,000 月度通用积分' : 'Includes 500,000 credits/mo',
                  baseMonthlyFee: 99,
                  isCommercial: true
                };
              } else if (norm.includes('creator')) {
                return {
                  displayName: language === 'zh' ? '创作者版' : 'Creator Plan',
                  subCode: 'Creator ($22/mo)',
                  badge: language === 'zh' ? '创作者' : 'Creator Tier',
                  badgeClass: 'bg-teal-500/20 border-teal-400/40 text-teal-200',
                  desc: language === 'zh' ? '包含 100,000 月度通用积分' : 'Includes 100,000 credits/mo',
                  baseMonthlyFee: 22,
                  isCommercial: true
                };
              } else {
                return {
                  displayName: language === 'zh' ? 'Scale 规模扩展版 (企业默认)' : 'Scale Plan ($299/mo)',
                  subCode: 'Scale Tier',
                  badge: language === 'zh' ? '企业规模版' : 'Scale Tier',
                  badgeClass: 'bg-purple-500/20 border-purple-400/40 text-purple-200',
                  desc: language === 'zh' ? '1,810,000 通用积分 / $299 每月' : '1,810,000 credits / $299 monthly',
                  baseMonthlyFee: 299,
                  isCommercial: true
                };
              }
            };

            const tierInfo = getTierInfo(subscription?.tier);

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {/* Plan Tier Card */}
                <div className="bg-slate-900/40 border border-purple-500/20 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden shadow-xl shadow-purple-950/10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5 text-purple-400" />
                        <span>{t.ent_plan_tier}</span>
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${tierInfo.badgeClass}`}>
                        {tierInfo.badge}
                      </span>
                    </div>

                    <div className="mt-3">
                      <div className="text-xl font-black text-white flex items-baseline gap-2">
                        <span>{tierInfo.displayName}</span>
                      </div>
                      <p className="text-[11px] text-purple-300/80 mt-1 font-medium">{tierInfo.desc}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-purple-500/20 flex items-center justify-between text-xs">
                    <span className="text-slate-400">{t.ent_billing_period}:</span>
                    <span className="text-slate-200 font-medium">
                      {subscription?.next_character_count_reset_unix 
                        ? `${language === 'zh' ? '每月重置 (' + resetDateFormatted + ')' : 'Monthly reset (' + resetDateFormatted + ')'}` 
                        : (language === 'zh' ? '月度计费周期' : 'Monthly')}
                    </span>
                  </div>
                </div>

                {/* Character/Credits Quota Card */}
                <div className="bg-slate-900/40 border border-purple-500/20 rounded-2xl p-5 backdrop-blur-md shadow-xl shadow-purple-950/10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Coins className="h-3.5 w-3.5 text-indigo-400" />
                        <span>{language === 'zh' ? '月度积分用量' : 'Monthly Credits'}</span>
                      </span>
                      <button
                        onClick={() => setShowCreditsGuide(!showCreditsGuide)}
                        className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium underline"
                      >
                        <Info className="h-3 w-3" />
                        <span>{language === 'zh' ? '说明' : 'Ratio'}</span>
                      </button>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xl font-black text-white font-mono">
                          {(subscription?.character_count ?? 652400).toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          / {(subscription?.character_limit ?? 1810000).toLocaleString()}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-950 rounded-full h-2 mt-2.5 overflow-hidden border border-purple-500/20">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            charPercentage > 85 ? 'bg-gradient-to-r from-amber-500 to-red-500' : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                          }`}
                          style={{ width: `${charPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-purple-500/20 flex items-center justify-between text-xs">
                    <span className="text-slate-400">{t.ent_reset_in}:</span>
                    <span className="text-purple-300 font-semibold font-mono">
                      {resetDays} {language === 'zh' ? '天后重置' : 'Days Left'}
                    </span>
                  </div>
                </div>

                {/* PVC Voice Slots Card */}
                <div className="bg-slate-900/40 border border-purple-500/20 rounded-2xl p-5 backdrop-blur-md shadow-xl shadow-purple-950/10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-purple-400" />
                        <span>{language === 'zh' ? '专业音色插槽 (PVC)' : 'PVC Voice Slots'}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        44.1kHz 母带
                      </span>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xl font-black text-white font-mono">
                          {pvcOverview ? `${pvcOverview.used_slots} / ${pvcOverview.total_slots}` : '2 / 6'}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {pvcOverview ? `${pvcOverview.available_slots} ${language === 'zh' ? '可用' : 'Available'}` : '4 Available'}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-950 rounded-full h-2 mt-2.5 overflow-hidden border border-purple-500/20">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pvcOverview ? (pvcOverview.used_slots / pvcOverview.total_slots) * 100 : 33.3}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-purple-500/20 flex items-center justify-between text-xs">
                    <button
                      onClick={() => setActiveSubTab('pvc_slots')}
                      className="text-purple-300 hover:text-purple-100 font-bold flex items-center gap-1 transition text-[11px]"
                    >
                      <span>{language === 'zh' ? '管理插槽舰队 →' : 'Manage Fleet →'}</span>
                    </button>
                    {onNavigateToTab && (
                      <button
                        onClick={() => onNavigateToTab('cloning')}
                        className="text-emerald-400 hover:text-emerald-300 text-[11px] font-bold"
                      >
                        {language === 'zh' ? '+ 训练新模型' : '+ Train New'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Spend & Estimated Bill Card */}
                <div className="bg-slate-900/40 border border-purple-500/20 rounded-2xl p-5 backdrop-blur-md shadow-xl shadow-purple-950/10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                        <span>{t.ent_est_spend}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                        USD
                      </span>
                    </div>

                    <div className="mt-3">
                      <div className="text-xl font-black text-white font-mono flex items-baseline gap-1">
                        <span className="text-emerald-400">$</span>
                        <span>{subscription?.total_estimated_spend_usd ? subscription.total_estimated_spend_usd.toFixed(2) : totalCostUsd.toFixed(2)}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {language === 'zh' ? `基础月费 $${tierInfo.baseMonthlyFee} + 实时消耗` : `Base $${tierInfo.baseMonthlyFee} + usage`}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-purple-500/20 flex items-center justify-between text-xs">
                    <span className="text-slate-400">{t.ent_concurrency_limit}:</span>
                    <span className="text-emerald-300 font-semibold font-mono">
                      {subscription?.max_concurrency || 30} {language === 'zh' ? '路生产并发' : 'Concurrent'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Credits Explainer Accordion */}
          {showCreditsGuide && (
            <div className="p-4 bg-purple-950/30 border border-purple-500/30 rounded-2xl animate-in fade-in space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-purple-400" />
                  <h4 className="text-xs font-bold text-white">
                    {language === 'zh' ? '为什么 ElevenLabs 计费以「通用积分 (Credits)」为核心？' : 'Why does ElevenLabs use Universal Credits?'}
                  </h4>
                </div>
                <button onClick={() => setShowCreditsGuide(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {language === 'zh'
                  ? '在 ElevenLabs 官方底层机制中，订阅配额统一表现为「通用积分 (Credits)」，所有不同功能的消耗均按比例扣除：'
                  : 'ElevenLabs counts all operations in universal credits with specific conversion factors:'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div className="p-2 bg-slate-900/60 rounded-xl border border-purple-500/20">
                  <div className="font-bold text-purple-300">Flash v2.5 / Turbo v2.5</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">0.5 积分 / 字符 (省 50% 配额)</div>
                </div>
                <div className="p-2 bg-slate-900/60 rounded-xl border border-purple-500/20">
                  <div className="font-bold text-purple-300">Multilingual v2</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">1.0 积分 / 字符 (高保真情感)</div>
                </div>
                <div className="p-2 bg-slate-900/60 rounded-xl border border-purple-500/20">
                  <div className="font-bold text-purple-300">Sound Effects 音效</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">~100 积分 / 次生成</div>
                </div>
                <div className="p-2 bg-slate-900/60 rounded-xl border border-purple-500/20">
                  <div className="font-bold text-purple-300">Dubbing / Scribe STT</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">按音频时长等效换算扣除</div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: COST ATTRIBUTION BREAKDOWN TABLE */}
          <div className="bg-slate-900/40 border border-purple-500/20 rounded-2xl p-5 space-y-4 backdrop-blur-md shadow-xl shadow-purple-950/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-3">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-purple-400" />
                  <span>{t.ent_cost_breakdown}</span>
                </h3>
                <p className="text-slate-400 text-[11px] mt-0.5">{t.ent_cost_breakdown_desc}</p>
              </div>

              {/* Department Filter */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">{t.ent_filter_dept}:</span>
                <select
                  value={selectedDept}
                  onChange={e => setSelectedDept(e.target.value)}
                  className="bg-slate-950 border border-purple-500/30 focus:border-purple-400 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                >
                  <option value="all">{language === 'zh' ? '全业务线汇总' : 'All Departments'}</option>
                  {departmentsList.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Breakdown Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-purple-500/20 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">{t.ent_col_category}</th>
                    <th className="py-2.5 px-3">{t.ent_col_model}</th>
                    <th className="py-2.5 px-3">{t.ent_col_dept}</th>
                    <th className="py-2.5 px-3 text-right">{t.ent_col_chars}</th>
                    <th className="py-2.5 px-3 text-right">{t.ent_col_invocations}</th>
                    <th className="py-2.5 px-3 text-right">{t.ent_col_cost}</th>
                    <th className="py-2.5 px-3">{t.ent_col_share}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCostItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-500">
                        {language === 'zh' ? '暂无该业务线的费用记录' : 'No records found for this department.'}
                      </td>
                    </tr>
                  ) : (
                    filteredCostItems.map((item) => (
                      <tr key={item.id} className="border-b border-slate-800/60 hover:bg-purple-950/15 transition">
                        <td className="py-2.5 px-3 font-semibold text-white">
                          <span className="px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-500/30 text-purple-300 text-[11px]">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">{item.model_name}</td>
                        <td className="py-2.5 px-3 text-slate-400">{item.department}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-200">{item.characters.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-400">{item.invocations.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">${item.cost_usd.toFixed(3)}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-slate-950 rounded-full h-1.5 overflow-hidden border border-purple-500/20">
                              <div
                                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full"
                                style={{ width: `${item.percentage}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">{item.percentage}%</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB: PROFESSIONAL VOICE CLONING (PVC) SLOTS FLEET */}
      {activeSubTab === 'pvc_slots' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header & Fleet Metrics */}
          <div className="bg-slate-900/40 border border-purple-500/20 rounded-2xl p-5 backdrop-blur-md shadow-xl shadow-purple-950/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-500/20 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-purple-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    {language === 'zh' ? '企业级专业声音克隆 (PVC) 插槽舰队管理' : 'Enterprise Professional Voice Slots Fleet'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    44.1kHz 母带级 Hi-Fi
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] mt-1 max-w-2xl">
                  {language === 'zh'
                    ? '根据 Scale 企业订阅，工作区享有固定母带级声音克隆插槽。每个插槽独立训练深度声学网络，支持 100% 生物声学一致性与无限并发。'
                    : 'Each dedicated PVC slot hosts a custom 44.1kHz neural acoustic model with zero voice degradation and multi-region inference.'}
                </p>
              </div>

              {onNavigateToTab && (
                <button
                  onClick={() => onNavigateToTab('cloning')}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition shadow-md shadow-purple-900/30 shrink-0"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{language === 'zh' ? '训练新专业音色 (PVC Studio)' : 'Train in PVC Studio'}</span>
                </button>
              )}
            </div>

            {/* Quick Fleet Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-xs">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-purple-500/20">
                <div className="text-slate-400">{language === 'zh' ? '总插槽容量' : 'Total Slots'}</div>
                <div className="text-lg font-black text-white font-mono mt-0.5">
                  {pvcOverview?.total_slots ?? 6} <span className="text-xs text-slate-500 font-normal">{language === 'zh' ? '个专用模型槽位' : 'slots'}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-purple-500/20">
                <div className="text-slate-400">{language === 'zh' ? '当前已就绪 / 训练中' : 'Active / Training'}</div>
                <div className="text-lg font-black text-purple-300 font-mono mt-0.5">
                  {pvcOverview?.used_slots ?? 2} <span className="text-xs text-slate-500 font-normal">{language === 'zh' ? '个模型已部署' : 'models active'}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-purple-500/20">
                <div className="text-slate-400">{language === 'zh' ? '可用空闲插槽' : 'Available Empty Slots'}</div>
                <div className="text-lg font-black text-emerald-400 font-mono mt-0.5">
                  {pvcOverview?.available_slots ?? 4} <span className="text-xs text-slate-500 font-normal">{language === 'zh' ? '个可立即训练' : 'ready to train'}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-purple-500/20">
                <div className="text-slate-400">{language === 'zh' ? '生物授权合规' : 'Biometric Consent'}</div>
                <div className="text-lg font-black text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" />
                  <span>100% 审计合规</span>
                </div>
              </div>
            </div>
          </div>

          {/* Slot Fleet Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pvcOverview?.slots.map((slot) => {
              const isEmpty = slot.status === 'empty';
              const isTraining = slot.status === 'training';
              const isReady = slot.status === 'ready';

              return (
                <div
                  key={slot.slot_id}
                  className={`border rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between transition-all duration-300 ${
                    isEmpty
                      ? 'bg-slate-950/40 border-dashed border-slate-800 hover:border-purple-500/40'
                      : isTraining
                      ? 'bg-purple-950/20 border-purple-500/40 shadow-lg shadow-purple-950/20'
                      : 'bg-slate-900/50 border-purple-500/30 hover:border-purple-400/50 shadow-xl shadow-purple-950/10'
                  }`}
                >
                  {/* Top Slot Header */}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        SLOT #{slot.slot_number}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isEmpty
                            ? 'bg-slate-800 text-slate-400 border-slate-700'
                            : isTraining
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        {isEmpty ? (language === 'zh' ? '空闲插槽' : 'Empty') : isTraining ? (language === 'zh' ? '母带训练中...' : 'Training...') : (language === 'zh' ? '就绪 (Active)' : 'Ready')}
                      </span>
                    </div>

                    {/* Slot Content */}
                    {isEmpty ? (
                      <div className="py-8 text-center space-y-3">
                        <div className="h-10 w-10 mx-auto rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                          <Plus className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-300">
                            {language === 'zh' ? '可用专业插槽' : 'Empty PVC Slot'}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {language === 'zh' ? '支持上传 30 分钟母带样本训练' : 'Ready to accept high-fidelity studio datasets'}
                          </p>
                        </div>
                        {onNavigateToTab && (
                          <button
                            onClick={() => onNavigateToTab('cloning')}
                            className="px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 rounded-lg text-xs font-bold transition"
                          >
                            {language === 'zh' ? '立即在此插槽训练' : 'Train this Slot'}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="mt-3 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-bold text-white tracking-tight">{slot.name}</h4>
                            <p className="text-[11px] text-purple-300/80 font-medium">{slot.speaker_name}</p>
                          </div>
                          {slot.fidelity_score && (
                            <span className="px-2 py-0.5 bg-purple-950/80 border border-purple-500/30 rounded text-[10px] font-mono text-purple-200 font-bold">
                              {slot.fidelity_score}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                          {slot.description}
                        </p>

                        {/* Specs Grid */}
                        <div className="grid grid-cols-2 gap-1.5 pt-2 text-[10px] font-mono">
                          <div className="p-1.5 bg-slate-950/60 rounded border border-slate-850 text-slate-400">
                            采样率: <span className="text-slate-200">{slot.sample_rate || '44.1 kHz'}</span>
                          </div>
                          <div className="p-1.5 bg-slate-950/60 rounded border border-slate-850 text-slate-400">
                            母带时长: <span className="text-slate-200">{slot.audio_duration_minutes || 30}m</span>
                          </div>
                          <div className="p-1.5 bg-slate-950/60 rounded border border-slate-850 text-slate-400">
                            语言: <span className="text-slate-200">{slot.language || '多语言通用'}</span>
                          </div>
                          <div className="p-1.5 bg-slate-950/60 rounded border border-slate-850 text-slate-400">
                            并发上限: <span className="text-emerald-400">{slot.concurrency_limit || 30} 路</span>
                          </div>
                        </div>

                        {/* Training progress if training */}
                        {isTraining && (
                          <div className="space-y-1 pt-2">
                            <div className="flex justify-between text-[10px] text-amber-300 font-mono">
                              <span>深度声学嵌入训练中...</span>
                              <span>{slot.training_progress ?? 45}%</span>
                            </div>
                            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-amber-500/30">
                              <div
                                className="bg-amber-400 h-full rounded-full transition-all duration-300"
                                style={{ width: `${slot.training_progress ?? 45}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Slot Actions Footer */}
                  {!isEmpty && (
                    <div className="mt-4 pt-3 border-t border-purple-500/20 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {isReady && (
                          <button
                            onClick={() => handlePlayPvcPreview(slot)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition ${
                              playingPvcSlotId === slot.slot_id
                                ? 'bg-purple-500 text-slate-950'
                                : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30'
                            }`}
                          >
                            <Play className="h-3 w-3" />
                            <span>{playingPvcSlotId === slot.slot_id ? (language === 'zh' ? '播放中...' : 'Playing') : (language === 'zh' ? '母带试听' : 'Preview')}</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleRetrainPvcSlot(slot.slot_id)}
                          disabled={retrainingSlotId === slot.slot_id || isTraining}
                          className="px-2 py-1 bg-slate-800/80 hover:bg-slate-800 text-slate-300 rounded-lg text-[10px] font-semibold transition disabled:opacity-50"
                          title={language === 'zh' ? '使用新样本微调' : 'Retrain with new data'}
                        >
                          {retrainingSlotId === slot.slot_id ? '...' : (language === 'zh' ? '微调重训' : 'Retrain')}
                        </button>
                      </div>

                      <button
                        onClick={() => handleReleasePvcSlot(slot.slot_id)}
                        disabled={releasingSlotId === slot.slot_id}
                        className="px-2 py-1 text-slate-500 hover:text-red-400 text-[10px] font-semibold transition flex items-center gap-1"
                        title={language === 'zh' ? '释放该插槽' : 'Release Slot'}
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>{releasingSlotId === slot.slot_id ? '...' : (language === 'zh' ? '释放' : 'Release')}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 2: WORKSPACE SCOPED KEYS & SERVICE ACCOUNTS */}
      {activeSubTab === 'keys' && (
        <div className="bg-slate-900/40 border border-purple-500/20 rounded-2xl p-5 space-y-4 backdrop-blur-md shadow-xl shadow-purple-950/10 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-3">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Key className="h-4 w-4 text-purple-400" />
                <span>{language === 'zh' ? '业务线独立 API 密钥与 Service Account 分发' : 'Scoped API Keys & Service Accounts'}</span>
              </h3>
              <p className="text-slate-400 text-[11px] mt-0.5">
                {language === 'zh'
                  ? '支持一键签发 ElevenLabs 官方 Service Account 或应用层代理路由 Key，精准隔离各业务线配额。'
                  : 'Provision official Service Accounts or application gateway proxy keys for isolated quota governance.'}
              </p>
            </div>

            <button
              onClick={() => setShowNewKeyModal(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-md shadow-purple-900/30"
            >
              <Plus className="h-4 w-4" />
              <span>{t.ent_btn_create_key}</span>
            </button>
          </div>

          {/* Modal for creating a new scoped key */}
          {showNewKeyModal && (
            <div className="p-4 bg-slate-950/90 border border-purple-500/30 rounded-xl space-y-3 animate-in fade-in">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-purple-400" />
                <span>{language === 'zh' ? '新建业务线授权 API 密钥' : 'Issue New Scoped API Key'}</span>
              </h4>
              <form onSubmit={handleCreateKey} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[11px] text-slate-400 mb-1">{language === 'zh' ? '密钥签发模式' : 'Provisioning Mode'}</label>
                  <select
                    value={newKeySource}
                    onChange={e => setNewKeySource(e.target.value as any)}
                    className="w-full bg-slate-900 border border-purple-500/30 focus:border-purple-400 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="elevenlabs_cloud">🌐 ElevenLabs 官方云端 Service Account (实时同步到 11labs 官网后台)</option>
                    <option value="gateway_proxy">⚡ 应用层网关分发 Key (企业内部分账与配额隔离，无需 11labs 加席位)</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {newKeySource === 'elevenlabs_cloud' 
                      ? '💡 调用 ElevenLabs 官方 POST /v1/service-accounts 接口生成，需主 Key 具备 Workspace Admin 权限。'
                      : '💡 本地应用网关虚拟 Key，请求打入后记录部门用量并转发至 Master Key，适合低成本灵活分账。'}
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">{t.ent_key_name}</label>
                  <input
                    type="text"
                    required
                    value={newKeyName}
                    onChange={e => setNewKeyName(e.target.value)}
                    placeholder="e.g. 视频生产流水线 Key"
                    className="w-full bg-slate-900 border border-purple-500/30 focus:border-purple-400 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">{t.ent_key_dept}</label>
                  <input
                    type="text"
                    value={newKeyDept}
                    onChange={e => setNewKeyDept(e.target.value)}
                    placeholder="e.g. 智能客服 AI 组"
                    className="w-full bg-slate-900 border border-purple-500/30 focus:border-purple-400 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">{t.ent_key_type}</label>
                  <select
                    value={newKeyType}
                    onChange={e => setNewKeyType(e.target.value as any)}
                    className="w-full bg-slate-900 border border-purple-500/30 focus:border-purple-400 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="service_account">{t.ent_key_type_sa}</option>
                    <option value="proxy_router">{t.ent_key_type_proxy}</option>
                    <option value="user">{t.ent_key_type_user}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">{t.ent_key_quota}</label>
                  <input
                    type="number"
                    value={newKeyQuota}
                    onChange={e => setNewKeyQuota(Number(e.target.value))}
                    placeholder="0 = Unlimited"
                    className="w-full bg-slate-900 border border-purple-500/30 focus:border-purple-400 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="md:col-span-4 flex justify-end gap-2 pt-2 border-t border-slate-900">
                  <button
                    type="button"
                    onClick={() => setShowNewKeyModal(false)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-lg text-xs"
                  >
                    {language === 'zh' ? '取消' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-lg text-xs transition"
                  >
                    {language === 'zh' ? '确认创建' : 'Confirm Issue'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* API Keys Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-purple-500/20 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">{t.ent_key_name}</th>
                  <th className="py-2.5 px-3">{language === 'zh' ? '架构来源' : 'Source'}</th>
                  <th className="py-2.5 px-3">{t.ent_key_type}</th>
                  <th className="py-2.5 px-3">{t.ent_key_dept}</th>
                  <th className="py-2.5 px-3">{t.ent_key_quota}</th>
                  <th className="py-2.5 px-3">{t.ent_key_status}</th>
                  <th className="py-2.5 px-3 text-right">{language === 'zh' ? '操作' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.map((k) => (
                  <tr key={k.key_id} className="border-b border-slate-800/60 hover:bg-purple-950/15 transition">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{k.name}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-400 font-mono">{k.prefix}</span>
                        <button
                          onClick={() => copyKeyText(k)}
                          className="text-[10px] text-purple-400 hover:text-purple-300 underline font-mono"
                        >
                          {copiedKeyId === k.key_id ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>
                      {k.warning_note && (
                        <div className="text-[10px] text-amber-400/90 mt-1 max-w-md line-clamp-2" title={k.warning_note}>
                          ⚠️ {k.warning_note}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {k.source === 'elevenlabs_cloud' ? (
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-950/60 border border-emerald-500/30 rounded-md text-emerald-300 font-medium inline-flex items-center gap-1">
                          <span>🌐 11Labs 官方云端</span>
                        </span>
                      ) : k.source === 'master_account' ? (
                        <span className="text-[10px] px-2 py-0.5 bg-purple-950/60 border border-purple-500/30 rounded-md text-purple-200 font-medium inline-flex items-center gap-1">
                          <span>👑 全局根主密钥</span>
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 bg-indigo-950/60 border border-indigo-500/30 rounded-md text-indigo-300 font-medium inline-flex items-center gap-1">
                          <span>⚡ 应用网关路由</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[11px] px-2 py-0.5 bg-slate-900 border border-purple-500/20 rounded-md text-purple-300">
                        {k.type === 'master_account' ? (language === 'zh' ? '主账户直连' : 'Master Account') : k.type === 'service_account' ? t.ent_key_type_sa : k.type === 'proxy_router' ? t.ent_key_type_proxy : t.ent_key_type_user}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{k.department}</td>
                    <td className="py-2.5 px-3 font-mono">
                      <div className="text-slate-200">
                        {k.type === 'master_account' 
                          ? (typeof k.character_used === 'string' ? k.character_used : `${k.character_used}`)
                          : k.character_quota > 0 
                            ? `${k.character_used.toLocaleString()} / ${k.character_quota.toLocaleString()}` 
                            : t.ent_key_unlimited}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                        k.status === 'active' 
                          ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' 
                          : 'bg-red-500/15 text-red-400 border border-red-500/30'
                      }`}>
                        {k.status === 'active' ? t.ent_key_status_active : t.ent_key_status_revoked}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {k.key_id !== 'master_elevenlabs_key' ? (
                        <button
                          onClick={() => handleDeleteKey(k.key_id)}
                          className="p-1 text-slate-500 hover:text-red-400 transition"
                          title="Revoke Key"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-purple-400 font-mono font-semibold px-2 py-0.5 bg-purple-950/40 rounded border border-purple-500/20">
                          Active Master
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: WORKSPACE MEMBERS & MULTI-SEAT */}
      {activeSubTab === 'members' && (
        <div className="bg-slate-900/40 border border-purple-500/20 rounded-2xl p-5 space-y-4 backdrop-blur-md shadow-xl shadow-purple-950/10 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-3">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-400" />
                <span>{language === 'zh' ? '工作区企业席位与成员角色授权 (RBAC)' : 'Workspace Members & Role Grants'}</span>
              </h3>
              <p className="text-slate-400 text-[11px] mt-0.5">
                {language === 'zh'
                  ? '支持细粒度权限控制 (Workspace Admin, Admin, Member, Financial Admin) 与单人月度积分额度配额。'
                  : 'Manage workspace seats, roles (Admin, Financial Admin, Member), and per-seat credit quotas.'}
              </p>
            </div>

            <button
              onClick={() => setShowInviteModal(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-md shadow-purple-900/30"
            >
              <UserPlus className="h-4 w-4" />
              <span>{language === 'zh' ? '邀请新成员加入' : 'Invite Member'}</span>
            </button>
          </div>

          {/* Invite Member Modal */}
          {showInviteModal && (
            <div className="p-4 bg-slate-950/90 border border-purple-500/30 rounded-xl space-y-3 animate-in fade-in">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-purple-400" />
                <span>{language === 'zh' ? '向新成员发送工作区邀请' : 'Send Workspace Invite'}</span>
              </h4>
              <form onSubmit={handleInviteMember} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-slate-400 mb-1">{language === 'zh' ? '成员工作邮箱' : 'Work Email'}</label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="colleague@enterprise.com"
                    className="w-full bg-slate-900 border border-purple-500/30 focus:border-purple-400 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">{language === 'zh' ? '角色权限' : 'Role'}</label>
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value as any)}
                    className="w-full bg-slate-900 border border-purple-500/30 focus:border-purple-400 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="member">Member (普通成员)</option>
                    <option value="admin">Admin (管理管理员)</option>
                    <option value="workspace_admin">Workspace Admin (工作区总管)</option>
                    <option value="financial_admin">Financial Admin (财务主管)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">{language === 'zh' ? '月度额度上限 (字符)' : 'Monthly Quota'}</label>
                  <input
                    type="number"
                    value={inviteQuota}
                    onChange={e => setInviteQuota(Number(e.target.value))}
                    placeholder="0 = 不设上限"
                    className="w-full bg-slate-900 border border-purple-500/30 focus:border-purple-400 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-4 flex justify-end gap-2 pt-2 border-t border-slate-900">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-lg text-xs"
                  >
                    {language === 'zh' ? '取消' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-lg text-xs transition"
                  >
                    {language === 'zh' ? '发送邀请函' : 'Send Invite'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Members Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-purple-500/20 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">{language === 'zh' ? '成员与邮箱' : 'Member'}</th>
                  <th className="py-2.5 px-3">{language === 'zh' ? '所属部门' : 'Department'}</th>
                  <th className="py-2.5 px-3">{language === 'zh' ? '角色级别' : 'Role'}</th>
                  <th className="py-2.5 px-3">{language === 'zh' ? '已用 / 配额上限' : 'Usage / Limit'}</th>
                  <th className="py-2.5 px-3">{language === 'zh' ? '加入时间' : 'Joined'}</th>
                  <th className="py-2.5 px-3 text-right">{language === 'zh' ? '操作' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.user_id} className="border-b border-slate-800/60 hover:bg-purple-950/15 transition">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-white flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-[10px] text-purple-200 font-mono">
                          {m.first_name ? m.first_name[0] : m.email[0].toUpperCase()}
                        </div>
                        <div>
                          <div>{m.first_name ? `${m.first_name} ${m.last_name || ''}` : m.email.split('@')[0]}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{m.department || '通用业务组'}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        m.role === 'workspace_admin' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                        m.role === 'financial_admin' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                        m.role === 'admin' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' :
                        'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {m.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-200">
                      {m.character_count_used.toLocaleString()} / {m.character_limit_assigned ? m.character_limit_assigned.toLocaleString() : '无上限'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">{m.joined_at || '2026-01-15'}</td>
                    <td className="py-2.5 px-3 text-right">
                      {m.role !== 'workspace_admin' && (
                        <button
                          onClick={() => handleDeleteMember(m.user_id)}
                          className="p-1 text-slate-500 hover:text-red-400 transition"
                          title="Remove Member"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 4: WORKSPACE GROUPS & ACCESS POLICIES */}
      {activeSubTab === 'groups' && (
        <div className="bg-slate-900/40 border border-purple-500/20 rounded-2xl p-5 space-y-4 backdrop-blur-md shadow-xl shadow-purple-950/10 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-3">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Shield className="h-4 w-4 text-purple-400" />
                <span>{language === 'zh' ? '部门权限组与模型白名单管理' : 'Permission Groups & Model Whitelists'}</span>
              </h3>
              <p className="text-slate-400 text-[11px] mt-0.5">
                {language === 'zh'
                  ? '为不同部门配置专属配额上限与允许调用的语音模型（如仅允许智能客服组调用低延迟 Flash 模型）。'
                  : 'Restrict allowed models and set character caps per business department.'}
              </p>
            </div>

            <button
              onClick={() => setShowNewGroupModal(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-md shadow-purple-900/30"
            >
              <Plus className="h-4 w-4" />
              <span>{language === 'zh' ? '新建权限组' : 'Create Group'}</span>
            </button>
          </div>

          {/* New Group Modal */}
          {showNewGroupModal && (
            <div className="p-4 bg-slate-950/90 border border-purple-500/30 rounded-xl space-y-3 animate-in fade-in">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Shield className="h-4 w-4 text-purple-400" />
                <span>{language === 'zh' ? '创建新部门权限组' : 'Create New Permission Group'}</span>
              </h4>
              <form onSubmit={handleCreateGroup} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">{language === 'zh' ? '组名称' : 'Group Name'}</label>
                    <input
                      type="text"
                      required
                      value={newGroupName}
                      onChange={e => setNewGroupName(e.target.value)}
                      placeholder="e.g. 跨境电商营销推广组"
                      className="w-full bg-slate-900 border border-purple-500/30 focus:border-purple-400 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">{language === 'zh' ? '月度总额度配额 (字符)' : 'Monthly Cap'}</label>
                    <input
                      type="number"
                      value={newGroupQuota}
                      onChange={e => setNewGroupQuota(Number(e.target.value))}
                      placeholder="300000"
                      className="w-full bg-slate-900 border border-purple-500/30 focus:border-purple-400 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">{language === 'zh' ? '职责与用途描述' : 'Description'}</label>
                  <input
                    type="text"
                    value={newGroupDesc}
                    onChange={e => setNewGroupDesc(e.target.value)}
                    placeholder="负责自动化多语种推广广告制作..."
                    className="w-full bg-slate-900 border border-purple-500/30 focus:border-purple-400 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-900">
                  <button
                    type="button"
                    onClick={() => setShowNewGroupModal(false)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-lg text-xs"
                  >
                    {language === 'zh' ? '取消' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-lg text-xs transition"
                  >
                    {language === 'zh' ? '确认创建' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Groups Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {groups.map(g => (
              <div key={g.group_id} className="p-4 bg-slate-950/60 border border-purple-500/20 rounded-xl space-y-3 relative hover:border-purple-500/40 transition">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">{g.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{g.description}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteGroup(g.group_id)}
                    className="text-slate-500 hover:text-red-400 p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{language === 'zh' ? '席位成员数' : 'Members'}:</span>
                    <span className="text-slate-200 font-semibold">{g.members_count} 人</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{language === 'zh' ? '月度配额上限' : 'Max Quota'}:</span>
                    <span className="text-purple-300 font-mono font-semibold">{g.max_character_quota.toLocaleString()} 字符</span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[10px] text-slate-400 block mb-1">{language === 'zh' ? '允许调用的模型白名单' : 'Allowed Models'}:</span>
                  <div className="flex flex-wrap gap-1">
                    {g.allowed_models.map(m => (
                      <span key={m} className="px-1.5 py-0.5 bg-purple-950/80 border border-purple-500/30 rounded text-[10px] text-purple-200 font-mono">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 5: WORKSPACE WEBHOOKS & EVENT SUBSCRIPTIONS */}
      {activeSubTab === 'webhooks' && (
        <div className="bg-slate-900/40 border border-purple-500/20 rounded-2xl p-5 space-y-4 backdrop-blur-md shadow-xl shadow-purple-950/10 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-3">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Radio className="h-4 w-4 text-emerald-400" />
                <span>{language === 'zh' ? '自动化事件 Webhooks 实时订阅' : 'Automated Event Webhooks'}</span>
              </h3>
              <p className="text-slate-400 text-[11px] mt-0.5">
                {language === 'zh'
                  ? '当视频配音完成、语音生成就绪、额度达到 80% 阈值或账单生成时，自动向您的业务后端发送 HTTP POST 签名通知。'
                  : 'Receive instantaneous signed JSON payloads when dubbing finishes, quotas hit thresholds, or speech completes.'}
              </p>
            </div>

            <button
              onClick={() => setShowNewWebhookModal(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-md shadow-purple-900/30"
            >
              <Plus className="h-4 w-4" />
              <span>{language === 'zh' ? '添加 Webhook 端点' : 'Add Webhook'}</span>
            </button>
          </div>

          {/* Test Result Banner */}
          {webhookTestResult && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-2 text-xs text-emerald-300 animate-in fade-in">
              <div className="flex items-center justify-between font-bold">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>{language === 'zh' ? 'Webhook 联调测试 Ping 成功送达 (HTTP 200 OK)' : 'Webhook Ping Delivered (200 OK)'}</span>
                </div>
                <span className="font-mono">{webhookTestResult.latency_ms} ms</span>
              </div>
              <pre className="p-2 bg-slate-950/90 rounded-lg text-[10px] text-slate-300 font-mono overflow-x-auto">
                {JSON.stringify(webhookTestResult.payload, null, 2)}
              </pre>
            </div>
          )}

          {/* New Webhook Modal */}
          {showNewWebhookModal && (
            <div className="p-4 bg-slate-950/90 border border-purple-500/30 rounded-xl space-y-3 animate-in fade-in">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Radio className="h-4 w-4 text-purple-400" />
                <span>{language === 'zh' ? '注册新 Webhook 端点' : 'Register New Webhook Endpoint'}</span>
              </h4>
              <form onSubmit={handleCreateWebhook} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">{language === 'zh' ? '名称备注' : 'Name'}</label>
                    <input
                      type="text"
                      required
                      value={newWebhookName}
                      onChange={e => setNewWebhookName(e.target.value)}
                      placeholder="e.g. 视频本地化流水线自动通知"
                      className="w-full bg-slate-900 border border-purple-500/30 focus:border-purple-400 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">{language === 'zh' ? '接收端 URL (POST)' : 'Endpoint URL'}</label>
                    <input
                      type="url"
                      required
                      value={newWebhookUrl}
                      onChange={e => setNewWebhookUrl(e.target.value)}
                      placeholder="https://api.yourdomain.com/webhooks"
                      className="w-full bg-slate-900 border border-purple-500/30 focus:border-purple-400 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-900">
                  <button
                    type="button"
                    onClick={() => setShowNewWebhookModal(false)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-lg text-xs"
                  >
                    {language === 'zh' ? '取消' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-lg text-xs transition"
                  >
                    {language === 'zh' ? '保存端点' : 'Save Endpoint'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Webhooks Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-purple-500/20 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">{language === 'zh' ? '端点名称' : 'Name'}</th>
                  <th className="py-2.5 px-3">{language === 'zh' ? '目标 URL' : 'Target URL'}</th>
                  <th className="py-2.5 px-3">{language === 'zh' ? '订阅事件' : 'Events'}</th>
                  <th className="py-2.5 px-3">{language === 'zh' ? '状态' : 'Status'}</th>
                  <th className="py-2.5 px-3">{language === 'zh' ? '最近触发' : 'Last Triggered'}</th>
                  <th className="py-2.5 px-3 text-right">{language === 'zh' ? '操作' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {webhooks.map(w => (
                  <tr key={w.webhook_id} className="border-b border-slate-800/60 hover:bg-purple-950/15 transition">
                    <td className="py-2.5 px-3 font-bold text-white">{w.name}</td>
                    <td className="py-2.5 px-3 font-mono text-purple-300 text-[11px]">{w.url}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-1">
                        {w.events.map(ev => (
                          <span key={ev} className="px-1.5 py-0.5 bg-slate-900 border border-purple-500/20 rounded text-[10px] text-slate-300 font-mono">
                            {ev}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        {w.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">{w.last_triggered_at || 'Never'}</td>
                    <td className="py-2.5 px-3 text-right space-x-2">
                      <button
                        onClick={() => handleTestWebhook(w.webhook_id)}
                        disabled={testingWebhookId === w.webhook_id}
                        className="px-2 py-1 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 rounded text-[10px] font-bold transition disabled:opacity-50"
                      >
                        {testingWebhookId === w.webhook_id ? 'Pinging...' : (language === 'zh' ? '⚡ 测试 Ping' : 'Test Ping')}
                      </button>
                      <button
                        onClick={() => handleDeleteWebhook(w.webhook_id)}
                        className="p-1 text-slate-500 hover:text-red-400 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 6: AUDIT LOGS & SECURITY POLICIES */}
      {activeSubTab === 'audit' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Security Profiles Card */}
          {securityPolicy && (
            <div className="bg-slate-900/40 border border-purple-500/20 rounded-2xl p-5 backdrop-blur-md shadow-xl shadow-purple-950/10">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-3">
                <LockKeyhole className="h-4 w-4 text-emerald-400" />
                <span>{language === 'zh' ? '企业安全、SAML SSO 与生物合规策略' : 'Enterprise Security & Compliance'}</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-950/60 rounded-xl border border-purple-500/20 space-y-1">
                  <div className="text-slate-400">单点登录 (SSO)</div>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{securityPolicy.sso_provider}</span>
                  </div>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-purple-500/20 space-y-1">
                  <div className="text-slate-400">零数据留存承诺 (ZDR)</div>
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Zero Data Retention Signed</span>
                  </div>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-purple-500/20 space-y-1">
                  <div className="text-slate-400">声音克隆生物授权审核</div>
                  <div className="font-bold text-purple-300 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                    <span>Strict Biometric Voice Consent</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Audit Logs Stream */}
          <div className="bg-slate-900/40 border border-purple-500/20 rounded-2xl p-5 space-y-4 backdrop-blur-md shadow-xl shadow-purple-950/10">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <History className="h-4 w-4 text-purple-400" />
                  <span>{language === 'zh' ? '企业级全量实时操作与计费审计流水 (Audit Trail)' : 'Enterprise Audit Trail'}</span>
                </h3>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  {language === 'zh'
                    ? '精确记录每一次 API 调用、合成动作、密钥签发、席位分配与对应 IP 和费用消耗。'
                    : 'Real-time immutable log of every synthesis, key issue, seat allocation, and associated USD cost.'}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-purple-500/20 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">{language === 'zh' ? '时间戳' : 'Timestamp'}</th>
                    <th className="py-2.5 px-3">{language === 'zh' ? '操作主体 / API Key' : 'Actor'}</th>
                    <th className="py-2.5 px-3">{language === 'zh' ? '操作类型' : 'Action'}</th>
                    <th className="py-2.5 px-3">{language === 'zh' ? '业务细节' : 'Details'}</th>
                    <th className="py-2.5 px-3 text-right">{language === 'zh' ? '字符 / 费用' : 'Chars / Cost'}</th>
                    <th className="py-2.5 px-3">{language === 'zh' ? '客户端 IP' : 'IP'}</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(log => (
                    <tr key={log.id} className="border-b border-slate-800/60 hover:bg-purple-950/15 transition">
                      <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">{log.timestamp}</td>
                      <td className="py-2.5 px-3 font-bold text-white">{log.actor}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 bg-purple-950/60 border border-purple-500/30 rounded text-[10px] text-purple-200 font-mono">
                          {log.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 text-[11px] max-w-xs truncate" title={log.details}>
                        {log.details}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        <div className="text-slate-200">{log.characters > 0 ? `${log.characters.toLocaleString()} 字符` : '-'}</div>
                        <div className="text-emerald-400 font-bold text-[10px]">${log.cost_usd.toFixed(3)}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400 text-[10px]">{log.ip_address}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
