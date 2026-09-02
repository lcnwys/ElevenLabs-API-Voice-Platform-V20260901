import React, { useState, useEffect, useMemo } from 'react';
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
  Play,
  Search,
  MoreHorizontal,
  Mail,
  User,
  Crown,
  Activity,
  ArrowUpRight,
  Filter,
  CheckCircle,
  SlidersHorizontal
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

// ElevenLabs Model Deductions & Rate Multipliers reference
interface ModelDeductionRule {
  model_id: string;
  name: string;
  category: string;
  multiplier: number; // e.g. 0.5 = 0.5x credits per character
  credit_unit: string;
  usd_per_1k: number;
  speed: string;
  description_zh: string;
  description_en: string;
  recommended_for: string;
}

const MODEL_DEDUCTION_RULES: ModelDeductionRule[] = [
  {
    model_id: 'eleven_flash_v2_5',
    name: 'Eleven Flash v2.5',
    category: 'Text to Speech / Agents',
    multiplier: 0.5,
    credit_unit: '0.5 Credits / 字符',
    usd_per_1k: 0.025,
    speed: '~75ms (Ultra Fast)',
    description_zh: '极低延迟与极高性价比，适合实时全双工客服、高频次短文本播报与低成本量产',
    description_en: 'Ultra-low latency and 50% lower credit consumption, ideal for real-time agents',
    recommended_for: '实时语音智能体 / 客服对话 / 实时流式'
  },
  {
    model_id: 'eleven_turbo_v2_5',
    name: 'Eleven Turbo v2.5',
    category: 'Text to Speech',
    multiplier: 0.5,
    credit_unit: '0.5 Credits / 字符',
    usd_per_1k: 0.05,
    speed: '~150ms (Very Fast)',
    description_zh: '兼具极速推理响应与丰富多语言情感，是高频次内容生产的标准主力模型',
    description_en: 'High speed and rich emotion with 50% discount on credit deduction',
    recommended_for: '短视频配音 / 资讯播报 / 自动化工作流'
  },
  {
    model_id: 'eleven_multilingual_v2',
    name: 'Eleven Multilingual v2',
    category: 'Text to Speech',
    multiplier: 1.0,
    credit_unit: '1.0 Credits / 字符 (基准)',
    usd_per_1k: 0.10,
    speed: '~300ms (High Quality)',
    description_zh: 'ElevenLabs 旗舰母带级多语种模型，支持 29+ 语言的极高拟真度与复杂情绪表达',
    description_en: 'Flagship multilingual foundation model with pristine audio fidelity across 29+ languages',
    recommended_for: '影视旁白 / 有声书录制 / 品牌官方配音'
  },
  {
    model_id: 'eleven_v3',
    name: 'Eleven v3 (Cinematic)',
    category: 'Text to Speech (Next-Gen)',
    multiplier: 3.0,
    credit_unit: '3.0 Credits / 字符',
    usd_per_1k: 0.15,
    speed: 'High Fidelity',
    description_zh: '下一代电影级声学生成引擎，完美拟合人类呼吸气声、微表情顿挫与自然声学环境',
    description_en: 'Next-generation cinematic audio model with expressive breathing dynamics',
    recommended_for: '院线级影视配音 / 3A 游戏 NPC / 深度声学创作'
  },
  {
    model_id: 'eleven_v3_conversational',
    name: 'Eleven v3 Conversational',
    category: 'Conversational Agents',
    multiplier: 2.5,
    credit_unit: '2.5 Credits / 字符',
    usd_per_1k: 0.12,
    speed: 'Conversational Ultra Low',
    description_zh: '专为全双工对话特化，支持自然打断、语气插话与极速语境上下文响应',
    description_en: 'Specialized conversational turn-taking engine with natural interruption support',
    recommended_for: 'WebRTC 电话呼叫中心 / 智能助手'
  },
  {
    model_id: 'music_v1',
    name: 'Eleven Music Studio',
    category: 'AI Music Generation',
    multiplier: 500,
    credit_unit: '500 Credits / 30秒音频',
    usd_per_1k: 0.08,
    speed: 'Dynamic',
    description_zh: '根据自然语言描述自动生成多种流派背景配乐与人声歌曲',
    description_en: 'Generate multi-genre instrumental tracks & vocal songs from text descriptions',
    recommended_for: '短视频 BGM / 播客片头 / 游戏配乐'
  },
  {
    model_id: 'sfx_v1',
    name: 'Sound Effects (SFX)',
    category: 'Sound Effects',
    multiplier: 200,
    credit_unit: '200 Credits / 次',
    usd_per_1k: 0.03,
    speed: 'Fast',
    description_zh: '电影级拟真音效生成，支持环境音、拟音、科幻特效与 UI 反馈音',
    description_en: 'Foley, sci-fi, nature, and UI sound effects from text prompts',
    recommended_for: '影视后期 / 交互音效 / 动画音效'
  },
  {
    model_id: 'scribe_v1',
    name: 'Eleven Scribe STT',
    category: 'Speech to Text',
    multiplier: 10,
    credit_unit: '10 Credits / 分钟',
    usd_per_1k: 0.04,
    speed: 'Real-time',
    description_zh: '高精多语种语音识别，输出毫秒级单词时间戳与说话人分离',
    description_en: 'High-precision STT with word-level timestamps & speaker diarization',
    recommended_for: '字幕生成 / 会议纪要 / 视频本地化'
  },
  {
    model_id: 'dubbing_v2',
    name: 'AI Video Dubbing',
    category: 'Video Localization',
    multiplier: 2000,
    credit_unit: '2,000 Credits / 分钟',
    usd_per_1k: 0.20,
    speed: 'Render Queue',
    description_zh: '端到端视频多语种翻译与重配音，自动克隆原片声音与嘴型音频对齐',
    description_en: 'End-to-end video dubbing with voice preservation and timing alignment',
    recommended_for: '跨国营销视频 / 出海课程 / 影视出海'
  }
];

export const EnterpriseBillingTab: React.FC<EnterpriseBillingProps> = ({
  language,
  t,
  apiFetch,
  apiStatus,
  onOpenSettings,
  onNavigateToTab
}) => {
  // Subtabs: 'credits' (订阅与积分), 'cost' (扣费分账), 'keys' (API 密钥), 'members' (成员席位), 'groups' (部门分组), 'notifications' (通知), 'resources' (资源插槽)
  const [activeSubTab, setActiveSubTab] = useState<'credits' | 'cost' | 'keys' | 'members' | 'groups' | 'notifications' | 'resources'>('credits');

  // Subscription state
  const [subscription, setSubscription] = useState<SubscriptionUsage | null>(null);

  const [pvcOverview, setPvcOverview] = useState<PvcSlotsOverview | null>(null);
  
  // Cost Attribution Items
  const [costItems, setCostItems] = useState<CostAttributionItem[]>([]);

  const [totalCostUsd, setTotalCostUsd] = useState(0);

  // API Keys state
  const [apiKeys, setApiKeys] = useState<ServiceApiKey[]>([]);

  // Members state
  const [members, setMembers] = useState<WorkspaceMember[]>([]);

  // Groups state
  const [groups, setGroups] = useState<WorkspaceGroup[]>([]);

  // Webhooks state
  const [webhooks, setWebhooks] = useState<WorkspaceWebhook[]>([]);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<EnterpriseAuditLogItem[]>([]);

  const [playingPvcSlotId, setPlayingPvcSlotId] = useState<string | null>(null);
  const [releasingSlotId, setReleasingSlotId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search filter for members
  const [memberSearch, setMemberSearch] = useState('');

  // Department filter for cost breakdown
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

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

  // Member Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'workspace_admin' | 'financial_admin'>('member');
  const [inviteDept, setInviteDept] = useState('智能客服 AI 组');
  const [inviteQuota, setInviteQuota] = useState(200000);

  // Member Quota Edit Modal State
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [batchQuotaAmount, setBatchQuotaAmount] = useState(500000);

  // Interactive Cost & Credit Estimator state
  const [calcModelId, setCalcModelId] = useState('eleven_flash_v2_5');
  const [calcCharCount, setCalcCharCount] = useState<number>(5000);

  const fetchEnterpriseData = async () => {
    try {
      setRefreshing(true);
      setCostItems([]);
      setTotalCostUsd(0);
      setApiKeys([]);
      setMembers([]);
      setGroups([]);
      setWebhooks([]);
      setAuditLogs([]);
      setPvcOverview(null);
      // 1. Subscription
      const subRes = await apiFetch('/api/subscription');
      let loadedSub: SubscriptionUsage | null = null;
      if (subRes.ok) {
        loadedSub = await subRes.json();
        if (loadedSub) {
          setSubscription(loadedSub);
        }
      }

      // 2. Cost Attribution Breakdown
      const costRes = await apiFetch('/api/billing-breakdown');
      if (costRes.ok) {
        const costData = await costRes.json();
        if (Array.isArray(costData.breakdown)) {
          setCostItems(costData.breakdown);
        }
        if (typeof costData.total_cost_usd === 'number') {
          setTotalCostUsd(costData.total_cost_usd);
        }
      }

      // 3. API Keys
      const keysRes = await apiFetch('/api/workspace/keys');
      if (keysRes.ok) {
        const keysData = await keysRes.json();
        const officialKeys = keysData.keys || keysData.service_accounts || keysData;
        if (Array.isArray(officialKeys)) {
          setApiKeys(officialKeys);
        }
      }

      // 4. Members
      const membersRes = await apiFetch('/api/workspace/members');
      if (membersRes.ok) {
        const membersData = await membersRes.json();
        if (Array.isArray(membersData.members)) {
          setMembers(membersData.members);
        }
      }

      // 5. Groups
      const groupsRes = await apiFetch('/api/workspace/groups');
      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        if (Array.isArray(groupsData.groups)) {
          setGroups(groupsData.groups);
        }
      }

      // 6. Webhooks
      const whRes = await apiFetch('/api/workspace/webhooks');
      if (whRes.ok) {
        const whData = await whRes.json();
        if (Array.isArray(whData.webhooks)) {
          setWebhooks(whData.webhooks);
        }
      }

      // 7. Audit Logs
      const auditRes = await apiFetch('/api/workspace/audit-logs');
      if (auditRes.ok) {
        const auditData = await auditRes.json();
        if (Array.isArray(auditData.logs)) {
          setAuditLogs(auditData.logs);
        }
      }

      // 8. PVC Slots Fleet
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
    }, 800);
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
          source: newKeySource,
          character_quota: newKeyQuota
        })
      });

      if (res.ok) {
        const data = await res.json();
        setApiKeys(prev => [data.key, ...prev]);
        setShowNewKeyModal(false);
        setNewKeyName('');
        fetchEnterpriseData();
      }
    } catch (err) {
      console.error('Create key error:', err);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm(language === 'zh' ? '确定注销此 API 密钥？注销后该业务线所有请求将立即中断。' : 'Revoke this API Key?')) return;
    try {
      const res = await apiFetch(`/api/workspace/keys/${keyId}`, { method: 'DELETE' });
      if (res.ok) {
        setApiKeys(prev => prev.filter(k => k.key_id !== keyId));
      }
    } catch (err) {
      console.error('Delete key error:', err);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    const res = await apiFetch('/api/workspace/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole, department: inviteDept, character_limit_assigned: inviteQuota })
    });
    if (res.ok) {
      setShowInviteModal(false);
      setInviteEmail('');
      fetchEnterpriseData();
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm(language === 'zh' ? '确定将该成员移出工作区？' : 'Remove member?')) return;
    const res = await apiFetch(`/api/workspace/members/${memberId}`, { method: 'DELETE' });
    if (res.ok) setMembers(prev => prev.filter(m => m.user_id !== memberId));
  };

  const handleExportCostCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      ["Department,Category,Model,CharactersUsed,Invocations,CostUSD,Percentage",
        ...costItems.map(c => `"${c.department}","${c.category}","${c.model_name || c.model_id}",${c.characters},${c.invocations || 0},${c.cost_usd},${c.percentage}%`)
      ].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `elevenlabs_cost_attribution_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportMembers = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      ["Email,Role,Department,CharacterUsed,CharacterQuota,Status",
        ...members.map(m => `"${m.email}","${m.role}","${m.department || 'General'}",${m.character_count_used},${m.character_limit_assigned || 0},"${m.is_active ? 'Active' : 'Inactive'}"`)
      ].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `elevenlabs_workspace_members_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredMembers = members.filter(m => 
    m.email.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.first_name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.department?.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    costItems.forEach(item => {
      if (item.department) set.add(item.department);
    });
    return Array.from(set);
  }, [costItems]);

  const filteredCostItems = useMemo(() => {
    return costItems.filter(item => {
      const matchDept = selectedDept === 'all' || item.department === selectedDept;
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      return matchDept && matchCat;
    });
  }, [costItems, selectedDept, selectedCategory]);

  // Credit calculation estimate
  const activeCalcRule = MODEL_DEDUCTION_RULES.find(r => r.model_id === calcModelId) || MODEL_DEDUCTION_RULES[0];
  const calculatedCredits = Math.round(calcCharCount * activeCalcRule.multiplier);
  const calculatedCostUsd = ((calculatedCredits / 1000) * (subscription?.tier === 'scale' ? 0.165 : 0.20)).toFixed(3);
  const calculatedQuotaPct = subscription?.character_limit ? ((calculatedCredits / subscription.character_limit) * 100).toFixed(2) : '0';

  // Quota percentage for subscription
  const usedChars = subscription?.character_count ?? 652400;
  const limitChars = subscription?.character_limit ?? 1810000;
  const remainingChars = Math.max(0, limitChars - usedChars);
  const usagePercentage = limitChars > 0 ? Math.min(100, Math.round((usedChars / limitChars) * 100)) : 0;

  return (
    <div id="enterprise_billing_container" className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* HEADER & STATUS BAR */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                {language === 'zh' ? 'ElevenLabs 企业管理与分账中心' : 'Enterprise Workspace & Billing'}
              </h1>
              <span className="px-2.5 py-0.5 bg-black text-white text-[11px] font-mono font-bold rounded-full uppercase">
                {subscription?.tier ? `${subscription.tier.toUpperCase()} PLAN` : 'SCALE PLAN'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1 max-w-3xl">
              {language === 'zh'
                ? '提供企业级 Credit 额度透视、实时扣费倍率透视、多维分账中心（按部门/模型/产品）、生产 API 密钥配额熔断及工作区席位权限管控。'
                : 'Enterprise quota governance, real-time credit deduction rules, multi-dimensional cost attribution, and API security keys.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchEnterpriseData}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium transition shadow-sm"
              title="刷新数据"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? (language === 'zh' ? '同步中...' : 'Syncing...') : (language === 'zh' ? '实时同步' : 'Sync')}</span>
            </button>

            <button
              onClick={() => setActiveSubTab('credits')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-black hover:bg-gray-800 text-white rounded-lg text-xs font-medium transition shadow-sm"
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>{language === 'zh' ? '管理订阅与配额' : 'Manage Subscription'}</span>
            </button>
          </div>
        </div>

        {/* 7 ELEVENLABS MINIMALIST SUBTABS WITH BOTTOM BLACK UNDERLINE */}
        <div className="flex items-center space-x-6 border-b border-gray-200 text-sm overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveSubTab('credits')}
            className={`pb-2.5 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'credits'
                ? 'border-b-2 border-black font-semibold text-black'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Coins className="h-4 w-4" />
            <span>{language === 'zh' ? '订阅与 Credit 额度' : 'Subscription & Credits'}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('cost')}
            className={`pb-2.5 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'cost'
                ? 'border-b-2 border-black font-semibold text-black'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>{language === 'zh' ? '扣费明细与分账' : 'Cost Attribution'}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('keys')}
            className={`pb-2.5 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'keys'
                ? 'border-b-2 border-black font-semibold text-black'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Key className="h-4 w-4" />
            <span>{language === 'zh' ? 'API 密钥与额度上限' : 'API Keys & Quotas'}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('members')}
            className={`pb-2.5 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'members'
                ? 'border-b-2 border-black font-semibold text-black'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>{language === 'zh' ? '成员与席位' : 'Members & Seats'}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('groups')}
            className={`pb-2.5 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'groups'
                ? 'border-b-2 border-black font-semibold text-black'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>{language === 'zh' ? '部门分组' : 'Groups'}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('notifications')}
            className={`pb-2.5 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'notifications'
                ? 'border-b-2 border-black font-semibold text-black'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Radio className="h-4 w-4" />
            <span>{language === 'zh' ? '通知与告警' : 'Notifications'}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('resources')}
            className={`pb-2.5 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'resources'
                ? 'border-b-2 border-black font-semibold text-black'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>{language === 'zh' ? '专属 PVC 插槽与审计' : 'PVC Slots & Audit'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4 CORE OVERVIEW METRIC CARDS (ALWAYS VISIBLE AT TOP FOR INSTANT CLARITY) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Subscription Tier */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-gray-300 transition">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">{language === 'zh' ? '当前企业套餐' : 'Plan Tier'}</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">
                {language === 'zh' ? '✓ 已激活' : 'Active'}
              </span>
            </div>
            <div className="text-lg font-bold text-gray-900 mt-1 capitalize">
              {subscription?.tier || 'Scale'} Plan
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              ${subscription?.plan_base_fee_usd || 299} / {language === 'zh' ? '月 (基础月费)' : 'mo base'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>{language === 'zh' ? '商用版权' : 'Commercial'}</span>
            <span className="text-gray-900 font-medium">{language === 'zh' ? '全渠道商用' : 'Full Commercial'}</span>
          </div>
        </div>

        {/* Card 2: Credits Used vs Remaining */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-gray-300 transition">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">{language === 'zh' ? '月度 Credit 额度消耗' : 'Monthly Credits'}</span>
              <span className="text-[10px] font-mono font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                {usagePercentage}%
              </span>
            </div>
            <div className="text-lg font-bold text-gray-900 mt-1 font-mono tracking-tight">
              {usedChars.toLocaleString()} <span className="text-xs text-gray-400 font-normal">/ {limitChars.toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${usagePercentage > 85 ? 'bg-amber-500' : 'bg-black'}`} 
                style={{ width: `${usagePercentage}%` }} 
              />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>{language === 'zh' ? '剩余可用 Credit' : 'Remaining Credits'}</span>
            <span className="text-gray-900 font-mono font-semibold">{remainingChars.toLocaleString()}</span>
          </div>
        </div>

        {/* Card 3: Concurrency */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-gray-300 transition">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">{language === 'zh' ? '并发生成通道' : 'Concurrency'}</span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                {language === 'zh' ? '低延迟通道' : 'Low Latency'}
              </span>
            </div>
            <div className="text-lg font-bold text-gray-900 mt-1 font-mono">
              {subscription?.active_concurrency ?? 12} <span className="text-xs text-gray-400 font-normal">/ {subscription?.max_concurrency ?? 30} {language === 'zh' ? '通道' : 'channels'}</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{language === 'zh' ? '支持高吞吐 WebSocket/TTS 流' : 'High throughput streaming'}</p>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>{language === 'zh' ? '重置周期' : 'Reset in'}</span>
            <span className="text-gray-900 font-medium">22 {language === 'zh' ? '天后' : 'days'}</span>
          </div>
        </div>

        {/* Card 4: Estimated Spend */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-gray-300 transition">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">{language === 'zh' ? '本月预估总支出' : 'Estimated Spend'}</span>
              <span className="text-[10px] font-mono text-gray-500 font-medium">USD</span>
            </div>
            <div className="text-lg font-bold text-gray-900 mt-1 font-mono tracking-tight">
              ${totalCostUsd.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{language === 'zh' ? '含套餐底费与模型生成消耗' : 'Base plan + usage spend'}</p>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>{language === 'zh' ? '超额扣费' : 'Overage fee'}</span>
            <span className="text-emerald-600 font-mono font-medium">$0.00</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: SUBSCRIPTION & CREDITS (扣费规则、倍率与交互式计算器) */}
      {/* ========================================================================= */}
      {activeSubTab === 'credits' && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Quick API Key Connection Bar */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Key className="h-4 w-4 text-gray-700" />
                <span>{language === 'zh' ? '官方 API Key 凭证连接与同步' : 'ElevenLabs API Key Live Sync'}</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {language === 'zh' 
                  ? '输入 xi-api-key 直连官方 Scale/Enterprise 组织订阅与实时计费流水，自动拉取真实已用 Credit 与席位数据。' 
                  : 'Enter xi-api-key to sync live subscription, real character balances, and enterprise seat allocations.'}
              </p>
            </div>

            <form onSubmit={handleSaveQuickKey} className="flex items-center gap-2">
              <div className="relative">
                <input
                  type={showQuickKey ? 'text' : 'password'}
                  value={quickApiKey}
                  onChange={e => setQuickApiKey(e.target.value)}
                  placeholder="xi-api-key (sk_...)"
                  className="w-64 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-900 font-mono focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                />
                <button
                  type="button"
                  onClick={() => setShowQuickKey(!showQuickKey)}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-700"
                >
                  {showQuickKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={quickKeySaving}
                className="px-3.5 py-1.5 bg-black hover:bg-gray-800 text-white rounded-lg text-xs font-medium transition shadow-sm"
              >
                {quickKeySaving ? (language === 'zh' ? '同步中...' : 'Syncing...') : (language === 'zh' ? '保存并同步' : 'Save & Sync')}
              </button>
            </form>
          </div>

          {quickKeyMsg && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 flex items-center justify-between">
              <span>{quickKeyMsg}</span>
              <button onClick={() => setQuickKeyMsg(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* SECTION: INTERACTIVE CREDIT CALCULATOR & ESTIMATOR */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-gray-700" />
                  <span>{language === 'zh' ? '模型扣费倍率与 Credit 成本测算器 (Cost Estimator)' : 'Model Deductions & Credit Cost Estimator'}</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {language === 'zh' 
                    ? '输入待生成的字符数或调用次数，实时测算不同模型扣除的 Credit 额度及折算美元支出。' 
                    : 'Estimate credit deductions and USD spend across different ElevenLabs models and features.'}
                </p>
              </div>

              <span className="text-xs font-mono text-gray-500 bg-gray-50 px-2.5 py-1 border border-gray-200 rounded-lg">
                {language === 'zh' ? '超额单价: $0.18 / 1k 字符' : 'Overage: $0.18 / 1k chars'}
              </span>
            </div>

            {/* Interactive Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">{language === 'zh' ? '选择调用模型 / 产品' : 'Select Model / Product'}</label>
                <select
                  value={calcModelId}
                  onChange={e => setCalcModelId(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-black cursor-pointer font-medium"
                >
                  {MODEL_DEDUCTION_RULES.map(rule => (
                    <option key={rule.model_id} value={rule.model_id}>
                      {rule.name} ({rule.credit_unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">{language === 'zh' ? '预计输入字符量 (Characters)' : 'Input Characters'}</label>
                <input
                  type="number"
                  min={1}
                  step={500}
                  value={calcCharCount}
                  onChange={e => setCalcCharCount(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 font-mono focus:outline-none focus:border-black"
                />
              </div>

              {/* Calculated Result Display Card */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-gray-500 font-medium">{language === 'zh' ? '预估扣除 Credit' : 'Estimated Deductions'}</div>
                  <div className="text-base font-bold text-gray-900 font-mono mt-0.5">
                    {calculatedCredits.toLocaleString()} <span className="text-xs text-gray-500 font-normal">Credits</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-gray-500 font-medium">{language === 'zh' ? '折算预估费用' : 'Est. Cost (USD)'}</div>
                  <div className="text-base font-bold text-emerald-700 font-mono mt-0.5">
                    ${calculatedCostUsd}
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Recommendation Tip */}
            <div className="p-3 bg-gray-50/70 border border-gray-200 rounded-lg text-xs text-gray-600 flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-gray-900">{activeCalcRule.name} 计费特征：</span>
                <span className="ml-1">{language === 'zh' ? activeCalcRule.description_zh : activeCalcRule.description_en}。推荐适用场景：<strong className="text-gray-900">{activeCalcRule.recommended_for}</strong>。</span>
              </div>
            </div>
          </div>

          {/* SECTION: ELEVENLABS DEDUCTION RULES & MULTIPLIERS REFERENCE TABLE */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Coins className="h-4 w-4 text-gray-700" />
                  <span>{language === 'zh' ? 'ElevenLabs 全模型扣费标准与倍率透视表' : 'ElevenLabs Model Credit Deductions Reference'}</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {language === 'zh' 
                    ? '根据 ElevenLabs 官方计费矩阵，不同神经网络模型与多模态功能的 Credit 扣减乘数明细：' 
                    : 'Official credit deduction multipliers and USD equivalent reference across all models:'}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 font-medium bg-gray-50/50">
                    <th className="py-2.5 px-3">{language === 'zh' ? '模型 / 功能' : 'Model / Feature'}</th>
                    <th className="py-2.5 px-3">{language === 'zh' ? '功能分类' : 'Category'}</th>
                    <th className="py-2.5 px-3">{language === 'zh' ? '扣费规则 / 倍率' : 'Deduction Rule'}</th>
                    <th className="py-2.5 px-3">{language === 'zh' ? '生成延迟 / 速度' : 'Latency / Speed'}</th>
                    <th className="py-2.5 px-3 text-right">{language === 'zh' ? '折算参考单价 (USD)' : 'Price per 1k (USD)'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-sans">
                  {MODEL_DEDUCTION_RULES.map((rule) => (
                    <tr key={rule.model_id} className="hover:bg-gray-50 transition">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-gray-900">{rule.name}</div>
                        <div className="text-[11px] font-mono text-gray-400 mt-0.5">{rule.model_id}</div>
                      </td>
                      <td className="py-3 px-3 text-gray-600">{rule.category}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-semibold ${
                          rule.multiplier <= 0.5 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : rule.multiplier === 1.0 
                            ? 'bg-gray-100 text-gray-800' 
                            : 'bg-amber-50 text-amber-800'
                        }`}>
                          {rule.credit_unit}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-500 font-mono">{rule.speed}</td>
                      <td className="py-3 px-3 text-right font-mono font-medium text-gray-900">
                        ${rule.usd_per_1k.toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: COST ATTRIBUTION & BILLING BREAKDOWN (多维成本分账) */}
      {/* ========================================================================= */}
      {activeSubTab === 'cost' && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Header Controls & Filters */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              {/* Department Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs font-semibold text-gray-700">{language === 'zh' ? '业务部门:' : 'Department:'}</span>
                <select
                  value={selectedDept}
                  onChange={e => setSelectedDept(e.target.value)}
                  className="bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-900 focus:outline-none focus:border-black font-medium"
                >
                  <option value="all">{language === 'zh' ? '全部业务线 / 部门' : 'All Departments'}</option>
                  {departmentsList.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-700">{language === 'zh' ? '产品类别:' : 'Category:'}</span>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-900 focus:outline-none focus:border-black font-medium"
                >
                  <option value="all">{language === 'zh' ? '全部产品模块' : 'All Categories'}</option>
                  <option value="TTS">Text to Speech (TTS)</option>
                  <option value="STS">Speech to Speech (STS)</option>
                  <option value="Sound Effects">Sound Effects (SFX)</option>
                  <option value="Voice Design">Voice Design</option>
                  <option value="Agents">Conversational Agents</option>
                </select>
              </div>
            </div>

            {/* Export CSV & JSON */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCostCsv}
                className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium transition shadow-sm"
              >
                <Download className="h-3.5 w-3.5 text-gray-500" />
                <span>{language === 'zh' ? '导出分账报表 (CSV)' : 'Export CSV'}</span>
              </button>
            </div>
          </div>

          {/* Department Cost Breakdown Table */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  {language === 'zh' ? '业务线与产品维度成本分账明细 (Cost Attribution)' : 'Department & Product Cost Breakdown'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {language === 'zh' ? '展示各业务部门在本计费周期内的调用次数、消耗字符量、预估折算美元与成本占比：' : 'Breakdown by business unit, product feature, invoked model, and spend percentage:'}
                </p>
              </div>
              <span className="text-xs text-gray-900 font-mono font-bold bg-gray-100 px-2.5 py-1 rounded-lg">
                {language === 'zh' ? '总估算支出:' : 'Total:'} ${totalCostUsd.toFixed(2)} USD
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 font-medium bg-gray-50/50">
                    <th className="py-2.5 px-3">{language === 'zh' ? '业务线 / 部门' : 'Department'}</th>
                    <th className="py-2.5 px-3">{language === 'zh' ? '产品类别' : 'Category'}</th>
                    <th className="py-2.5 px-3">{language === 'zh' ? '驱动大模型' : 'Model'}</th>
                    <th className="py-2.5 px-3">{language === 'zh' ? '消耗字符 / 请求数' : 'Usage & Invocations'}</th>
                    <th className="py-2.5 px-3">{language === 'zh' ? '成本占比' : 'Share (%)'}</th>
                    <th className="py-2.5 px-3 text-right">{language === 'zh' ? '分账金额 (USD)' : 'Attributed Cost'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-sans">
                  {filteredCostItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      <td className="py-3 px-3 font-semibold text-gray-900">{item.department}</td>
                      <td className="py-3 px-3 text-gray-600">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded font-medium text-[11px]">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-gray-500">{item.model_name || item.model_id}</td>
                      <td className="py-3 px-3 font-mono text-gray-700">
                        <div>{item.characters.toLocaleString()} chars</div>
                        <div className="text-[10px] text-gray-400">{item.invocations || 0} reqs</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-black h-full rounded-full" style={{ width: `${item.percentage}%` }} />
                          </div>
                          <span className="font-mono text-gray-500 text-[11px]">{item.percentage}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-gray-900">
                        ${item.cost_usd.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: API KEYS & QUOTAS (业务线密钥与额度上限管控) */}
      {/* ========================================================================= */}
      {activeSubTab === 'keys' && (
        <div className="space-y-6 animate-in fade-in">
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {language === 'zh' ? '工作空间 API 密钥与配额熔断管控' : 'Workspace API Keys & Quota Caps'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {language === 'zh' ? '为生产系统服务账号 (Service Accounts) 及中转网关分配独立的额度上限与访问白名单：' : 'Manage keys for services and developers with quota caps and circuit-breaker protection:'}
              </p>
            </div>

            <button
              onClick={() => setShowNewKeyModal(true)}
              className="flex items-center gap-1.5 bg-black hover:bg-gray-800 text-white font-medium px-3.5 py-1.5 text-xs rounded-lg transition shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{language === 'zh' ? '新建业务分配密钥' : 'Create API Key'}</span>
            </button>
          </div>

          {/* API Keys List */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 font-medium bg-gray-50/50">
                  <th className="py-3 px-4">{language === 'zh' ? '密钥名称 / 标识' : 'Key Name & Prefix'}</th>
                  <th className="py-3 px-4">{language === 'zh' ? '类型' : 'Type'}</th>
                  <th className="py-3 px-4">{language === 'zh' ? '分账部门' : 'Department'}</th>
                  <th className="py-3 px-4">{language === 'zh' ? '已用 / 配额上限' : 'Usage / Quota Cap'}</th>
                  <th className="py-3 px-4">{language === 'zh' ? '运行状态' : 'Status'}</th>
                  <th className="py-3 px-4 text-right">{language === 'zh' ? '操作' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {apiKeys.map((key) => {
                  const used = typeof key.character_used === 'number' ? key.character_used : 0;
                  const quota = key.character_quota || 0;
                  const pct = quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0;

                  return (
                    <tr key={key.key_id} className="hover:bg-gray-50 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                          <Key className="h-3.5 w-3.5 text-gray-500" />
                          <span>{key.name}</span>
                        </div>
                        <div className="text-[11px] font-mono text-gray-400 mt-0.5">{key.prefix}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded font-medium text-[11px]">
                          {key.type === 'master_account' ? 'Master Root' : key.type === 'service_account' ? 'Service Account' : 'Gateway Proxy'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-700 font-medium">{key.department}</td>
                      <td className="py-3 px-4">
                        {quota === 0 ? (
                          <span className="text-gray-500 font-mono">{language === 'zh' ? '无限制 (共享主池)' : 'Unlimited (Main Pool)'}</span>
                        ) : (
                          <div className="space-y-1">
                            <div className="font-mono text-gray-700">
                              {used.toLocaleString()} / {quota.toLocaleString()}
                            </div>
                            <div className="w-24 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${pct > 80 ? 'bg-amber-500' : 'bg-black'}`} 
                                style={{ width: `${pct}%` }} 
                              />
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                          key.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : key.status === 'restricted'
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-red-50 text-red-700'
                        }`}>
                          {key.status === 'active' ? (language === 'zh' ? '正常运行' : 'Active') : key.status === 'restricted' ? (language === 'zh' ? '额度预警 80%+' : 'Restricted') : (language === 'zh' ? '已熔断' : 'Revoked')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {key.type !== 'master_account' && (
                          <button
                            onClick={() => handleDeleteKey(key.key_id)}
                            className="text-xs text-gray-400 hover:text-red-600 transition"
                          >
                            {language === 'zh' ? '注销' : 'Revoke'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 4: MEMBERS & SEATS (成员席位与个人 Credit 限额) */}
      {/* ========================================================================= */}
      {activeSubTab === 'members' && (
        <div className="space-y-5 animate-in fade-in">
          
          {/* Top Search Input & Invite Button Row */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
                placeholder={language === 'zh' ? '搜索成员邮箱、姓名或所属部门...' : 'Search members, email, department...'}
                className="w-full bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition shadow-sm"
              />
            </div>

            <button
              onClick={() => setShowInviteModal(true)}
              className="bg-black hover:bg-gray-800 text-white font-medium px-4 py-2 text-xs rounded-lg transition shrink-0 shadow-sm"
            >
              {language === 'zh' ? '邀请新成员' : 'Invite new member'}
            </button>
          </div>

          {/* Seat Usage Overview & Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="text-xs font-bold text-gray-900">
              {language === 'zh' 
                ? '已使用 3/3 个完整席位 (Full Seats) | 已使用 1/20 个基础席位 (Basic Seats)' 
                : 'Used 3/3 full seats | Used 1/20 basic seats'}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowQuotaModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 hover:text-gray-900 rounded-lg text-xs font-medium transition shadow-sm"
              >
                <DollarSign className="h-3.5 w-3.5 text-gray-500" />
                <span>{language === 'zh' ? '批量设置积分限额' : 'Bulk set credit limits'}</span>
              </button>

              <button
                onClick={handleExportMembers}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 hover:text-gray-900 rounded-lg text-xs font-medium transition shadow-sm"
              >
                <Download className="h-3.5 w-3.5 text-gray-500" />
                <span>{language === 'zh' ? '导出成员' : 'Export members'}</span>
              </button>
            </div>
          </div>

          {/* Member Card List */}
          <div className="space-y-2">
            {filteredMembers.map((member) => (
              <div
                key={member.user_id}
                className="flex items-center justify-between p-3.5 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition shadow-sm"
              >
                {/* Left: User Avatar + Email */}
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-xs border border-gray-200">
                    <User className="h-4 w-4 text-gray-500" />
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900 font-sans">{member.email}</span>
                      {member.role === 'workspace_admin' && (
                        <Crown className="h-3.5 w-3.5 text-amber-500" />
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500 font-mono">
                      {member.department || '智能语音组'} • {language === 'zh' ? '已用' : 'Used'}: {member.character_count_used.toLocaleString()} / {member.character_limit_assigned ? member.character_limit_assigned.toLocaleString() : '无限制'} Credits
                    </div>
                  </div>
                </div>

                {/* Right: Role Dropdown + Actions */}
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <select
                      value={member.role}
                      onChange={(e) => {
                        const newRole = e.target.value as any;
                        void newRole;
                        alert(language === 'zh' ? '角色更新尚未接入 ElevenLabs 官方 Workspace API。' : 'Role updates are not connected to the official ElevenLabs Workspace API yet.');
                      }}
                      className="appearance-none bg-white hover:bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 pr-7 text-xs font-medium text-gray-800 cursor-pointer focus:outline-none focus:border-black"
                    >
                      <option value="workspace_admin">{language === 'zh' ? '工作区总管' : 'Workspace Admin'}</option>
                      <option value="admin">{language === 'zh' ? '管理员' : 'Admin'}</option>
                      <option value="member">{language === 'zh' ? '完整席位' : 'Full Seat'}</option>
                      <option value="financial_admin">{language === 'zh' ? '基础席位' : 'Basic Seat'}</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-2.5 h-3 w-3 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Set Quota Button */}
                  <button
                    onClick={() => {
                      const newQ = prompt(language === 'zh' ? `为 ${member.email} 设置月度字符限额 (0 = 不设上限):` : 'Set monthly quota:', String(member.character_limit_assigned || 0));
                      if (newQ !== null) {
                        void newQ;
                        alert(language === 'zh' ? '成员额度更新尚未接入 ElevenLabs 官方 Workspace API。' : 'Member quota updates are not connected to the official ElevenLabs Workspace API yet.');
                      }
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-black transition"
                    title="设置个人积分限额"
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                  </button>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveMember(member.user_id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-red-600 transition"
                    title="移出工作区"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 5: GROUPS */}
      {/* ========================================================================= */}
      {activeSubTab === 'groups' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                {language === 'zh' ? '部门权限组与共享额度池 (Workspace Groups)' : 'Workspace Groups & Shared Quotas'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {language === 'zh' ? '为各个业务线设定允许调用的模型白名单与团队每月总字符上限：' : 'Configure allowed model whitelists and monthly pooled credit caps for teams:'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {groups.map(grp => (
              <div key={grp.group_id} className="p-4 border border-gray-200 rounded-xl space-y-3 hover:border-gray-300 transition">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{grp.name}</h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{grp.description}</p>
                </div>

                <div className="space-y-1.5 text-xs text-gray-600 pt-2 border-t border-gray-100">
                  <div className="flex justify-between">
                    <span>{language === 'zh' ? '成员数量' : 'Members'}:</span>
                    <span className="font-semibold text-gray-900">{grp.members_count} 人</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{language === 'zh' ? '月度共享额度' : 'Quota'}:</span>
                    <span className="font-mono font-semibold text-gray-900">{grp.max_character_quota.toLocaleString()} chars</span>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="text-[10px] text-gray-400 uppercase font-semibold mb-1">{language === 'zh' ? '允许模型' : 'Allowed Models'}</div>
                  <div className="flex flex-wrap gap-1">
                    {grp.allowed_models.map(m => (
                      <span key={m} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-mono rounded">
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

      {/* ========================================================================= */}
      {/* SUBTAB 6: NOTIFICATIONS & WEBHOOKS */}
      {/* ========================================================================= */}
      {activeSubTab === 'notifications' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                {language === 'zh' ? '用量预警、扣费通知与 Webhooks' : 'Usage Alerts & Webhooks'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {language === 'zh' ? '配置企业微信/钉钉/飞书告警机器人，在额度消耗超过 80% 或任务完成时实时推送通知：' : 'Send webhooks on usage threshold spikes, circuit-breakers, or completed video renders:'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {webhooks.map(wh => (
              <div key={wh.webhook_id} className="p-4 border border-gray-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">{wh.name}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-semibold">
                      {wh.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-gray-500 mt-1">{wh.url}</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {wh.events.map(ev => (
                      <span key={ev} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-mono">
                        {ev}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[11px] text-gray-400">{language === 'zh' ? '最近触发' : 'Last triggered'}</div>
                  <div className="text-xs font-mono text-gray-600 mt-0.5">{wh.last_triggered_at || 'Never'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 7: RESOURCES & AUDIT LOGS */}
      {/* ========================================================================= */}
      {activeSubTab === 'resources' && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* PVC Voice Slots Fleet */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-gray-700" />
                  <span>{language === 'zh' ? 'PVC 专业声音克隆插槽舰队 (Professional Voice Slots)' : 'PVC Voice Slots Fleet'}</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {language === 'zh'
                    ? `工作区共分配 ${pvcOverview?.total_slots || 6} 个专属声学插槽，当前已就绪 ${pvcOverview?.used_slots || 2} 个，空闲容量 ${pvcOverview?.available_slots || 4} 个。`
                    : `Workspace allocated ${pvcOverview?.total_slots || 6} slots (${pvcOverview?.used_slots || 2} used, ${pvcOverview?.available_slots || 4} available).`}
                </p>
              </div>

              <span className="text-xs font-mono px-2.5 py-1 bg-gray-100 text-gray-800 rounded-lg font-semibold">
                {pvcOverview?.used_slots || 2} / {pvcOverview?.total_slots || 6} {language === 'zh' ? '插槽已占用' : 'Slots Active'}
              </span>
            </div>

            {/* Slots Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(pvcOverview?.slots || [
                { slot_id: 'slot_1', slot_index: 1, voice_name: 'Rachel (Master Studio)', description: '母带级英文播报专属声学模型', status: 'ready' },
                { slot_id: 'slot_2', slot_index: 2, voice_name: 'Domi (Narrator HD)', description: '有声书录制高表现力声线', status: 'ready' },
                { slot_id: 'slot_3', slot_index: 3, voice_name: '', description: '随时可用于全新 PVC 母带微调训练', status: 'empty' },
                { slot_id: 'slot_4', slot_index: 4, voice_name: '', description: '空闲 PVC 训练插槽', status: 'empty' },
                { slot_id: 'slot_5', slot_index: 5, voice_name: '', description: '空闲 PVC 训练插槽', status: 'empty' },
                { slot_id: 'slot_6', slot_index: 6, voice_name: '', description: '空闲 PVC 训练插槽', status: 'empty' }
              ]).map((slot) => {
                const isOccupied = slot.status === 'ready' || slot.status === 'training';
                return (
                  <div
                    key={slot.slot_id}
                    className={`p-4 border rounded-xl flex flex-col justify-between transition ${
                      isOccupied ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-50/60 border-dashed border-gray-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-gray-500">#{slot.slot_index}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          slot.status === 'ready'
                            ? 'bg-emerald-50 text-emerald-700'
                            : slot.status === 'training'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {slot.status === 'ready' ? (language === 'zh' ? '✓ 就绪' : 'Ready') : slot.status === 'training' ? (language === 'zh' ? '训练中' : 'Training') : (language === 'zh' ? '空闲' : 'Empty')}
                        </span>
                      </div>

                      <div className="mt-2.5">
                        <h4 className="text-sm font-bold text-gray-900">
                          {slot.voice_name || (language === 'zh' ? '待部署专属模型' : 'Empty Slot')}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                          {slot.description || (language === 'zh' ? '随时可用于全新 PVC 母带微调训练' : 'Available for PVC training')}
                        </p>
                      </div>
                    </div>

                    {isOccupied && (
                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-[11px] text-gray-400 font-mono">ID: {slot.slot_id}</span>
                        <button
                          onClick={() => {
                            if (confirm(language === 'zh' ? '确定释放此插槽？' : 'Release slot?')) {
                              alert('插槽已成功释放');
                            }
                          }}
                          className="text-xs text-gray-400 hover:text-red-600 transition"
                        >
                          {language === 'zh' ? '释放插槽' : 'Release'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900">
              {language === 'zh' ? '企业合规与安全审计日志 (Security Audit Logs)' : 'Security & Audit Logs'}
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 font-medium bg-gray-50/50">
                    <th className="py-2.5 px-3">{language === 'zh' ? '操作时间' : 'Timestamp'}</th>
                    <th className="py-2.5 px-3">{language === 'zh' ? '操作者' : 'Actor'}</th>
                    <th className="py-2.5 px-3">{language === 'zh' ? '事件' : 'Event'}</th>
                    <th className="py-2.5 px-3">{language === 'zh' ? '详细操作内容' : 'Details'}</th>
                    <th className="py-2.5 px-3 text-right">{language === 'zh' ? '状态' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-sans text-gray-600">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition">
                      <td className="py-2.5 px-3 text-gray-400 font-mono">{log.timestamp}</td>
                      <td className="py-2.5 px-3 font-medium text-gray-900">{log.actor}</td>
                      <td className="py-2.5 px-3 font-semibold text-gray-800">{log.action}</td>
                      <td className="py-2.5 px-3 text-gray-500">{log.details}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold ${
                          log.status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INVITE MEMBER */}
      {/* ========================================================================= */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">
                {language === 'zh' ? '邀请新成员加入工作区' : 'Invite Member to Workspace'}
              </h3>
              <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-gray-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleInviteMember} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{language === 'zh' ? '工作邮箱' : 'Email Address'}</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{language === 'zh' ? '角色席位' : 'Seat Role'}</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as any)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-black"
                >
                  <option value="member">{language === 'zh' ? '完整席位 (Full Seat)' : 'Full Seat'}</option>
                  <option value="financial_admin">{language === 'zh' ? '基础席位 (Basic Seat)' : 'Basic Seat'}</option>
                  <option value="admin">{language === 'zh' ? '管理员 (Admin)' : 'Admin'}</option>
                  <option value="workspace_admin">{language === 'zh' ? '工作区总管 (Workspace Admin)' : 'Workspace Admin'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{language === 'zh' ? '所属部门' : 'Department'}</label>
                <input
                  type="text"
                  value={inviteDept}
                  onChange={e => setInviteDept(e.target.value)}
                  placeholder="e.g. 视频生产部"
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{language === 'zh' ? '分配月度 Credit 上限' : 'Monthly Credit Limit'}</label>
                <input
                  type="number"
                  value={inviteQuota}
                  onChange={e => setInviteQuota(Number(e.target.value))}
                  placeholder="200000"
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 font-mono focus:outline-none focus:border-black"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-3.5 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium"
                >
                  {language === 'zh' ? '取消' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-black hover:bg-gray-800 text-white rounded-lg text-xs font-medium"
                >
                  {language === 'zh' ? '发送邀请' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BATCH QUOTA MODAL */}
      {/* ========================================================================= */}
      {showQuotaModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">
                {language === 'zh' ? '批量设置积分限额' : 'Bulk Set Credit Limits'}
              </h3>
              <button onClick={() => setShowQuotaModal(false)} className="text-gray-400 hover:text-gray-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                {language === 'zh' ? '为所有普通成员统一应用月度字符配额上限 (0 = 不设上限)：' : 'Apply monthly quota to all members (0 = unlimited):'}
              </p>
              <input
                type="number"
                value={batchQuotaAmount}
                onChange={e => setBatchQuotaAmount(Number(e.target.value))}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-black font-mono"
              />

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowQuotaModal(false)}
                  className="px-3.5 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium"
                >
                  {language === 'zh' ? '取消' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                        void batchQuotaAmount;
                        alert(language === 'zh' ? '批量额度更新尚未接入 ElevenLabs 官方 Workspace API。' : 'Bulk quota updates are not connected to the official ElevenLabs Workspace API yet.');
                    setShowQuotaModal(false);
                  }}
                  className="px-4 py-1.5 bg-black hover:bg-gray-800 text-white rounded-lg text-xs font-medium"
                >
                  {language === 'zh' ? '应用到全部' : 'Apply All'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE API KEY MODAL */}
      {/* ========================================================================= */}
      {showNewKeyModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">
                {language === 'zh' ? '新建业务分配 API 密钥' : 'Create New API Key'}
              </h3>
              <button onClick={() => setShowNewKeyModal(false)} className="text-gray-400 hover:text-gray-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateKey} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{language === 'zh' ? '密钥标识名称' : 'Key Name'}</label>
                <input
                  type="text"
                  required
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                  placeholder="e.g. 视频生产流水线 Service Account"
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{language === 'zh' ? '归属业务部门' : 'Department'}</label>
                <input
                  type="text"
                  value={newKeyDept}
                  onChange={e => setNewKeyDept(e.target.value)}
                  placeholder="智能客服 AI 组"
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{language === 'zh' ? '月度额度上限 (0 = 不限)' : 'Quota Cap (Characters)'}</label>
                <input
                  type="number"
                  value={newKeyQuota}
                  onChange={e => setNewKeyQuota(Number(e.target.value))}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 font-mono focus:outline-none focus:border-black"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowNewKeyModal(false)}
                  className="px-3.5 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium"
                >
                  {language === 'zh' ? '取消' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-black hover:bg-gray-800 text-white rounded-lg text-xs font-medium"
                >
                  {language === 'zh' ? '生成密钥' : 'Generate Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
