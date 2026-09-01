import React, { useState } from 'react';
import {
  Terminal,
  Play,
  Copy,
  Check,
  Code2,
  Send,
  Sparkles,
  Layers,
  FileCode,
  Download,
  Clock,
  Zap,
  Radio,
  Sliders,
  Database,
  Key,
  Shield,
  Volume2,
  Bot,
  Wand2,
  Scissors,
  FileText,
  Film,
  RefreshCw,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  ExternalLink,
  Coins
} from 'lucide-react';
import { LiveApiTestResult } from '../types';

interface ApiWorkbenchTabProps {
  language: 'zh' | 'en';
  t: any;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
  apiStatus: { configured: boolean; mode: string };
  voices: Array<{ voice_id: string; name: string }>;
  models: Array<{ model_id: string; name: string }>;
}

interface EndpointDef {
  id: string;
  name: string;
  name_zh: string;
  category: 'tts' | 'audio' | 'voices' | 'agents' | 'workspace';
  category_zh: string;
  method: 'GET' | 'POST' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  description_zh: string;
  defaultHeaders: Record<string, string>;
  defaultQueryParams?: Record<string, string>;
  defaultBody?: Record<string, any>;
  hasAudioResponse?: boolean;
  docUrl: string;
}

export const ApiWorkbenchTab: React.FC<ApiWorkbenchTabProps> = ({
  language,
  t,
  apiFetch,
  apiStatus,
  voices,
  models
}) => {
  const endpoints: EndpointDef[] = [
    {
      id: 'tts_generate',
      name: 'Text to Speech (Synthesize)',
      name_zh: '文本转语音 (端到端合成)',
      category: 'tts',
      category_zh: '核心语音合成',
      method: 'POST',
      path: '/v1/text-to-speech/{voice_id}',
      description: 'Converts text into natural, emotional spoken audio with customizable stability and style.',
      description_zh: '将文本合成为极具表现力的高保真语音，支持调节稳定度、相似度与情绪风格。',
      defaultHeaders: {
        'xi-api-key': '{{XI_API_KEY}}',
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      defaultQueryParams: {
        'output_format': 'mp3_44100_128',
        'optimize_streaming_latency': '0'
      },
      defaultBody: {
        text: 'ElevenLabs 提供全球领先的多语种语音合成技术，延迟低至 150ms。',
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.15,
          use_speaker_boost: true
        }
      },
      hasAudioResponse: true,
      docUrl: 'https://elevenlabs.io/docs/api-reference/text-to-speech'
    },
    {
      id: 'tts_stream',
      name: 'Text to Speech Stream',
      name_zh: '流式文本转语音 (低延迟实时流)',
      category: 'tts',
      category_zh: '核心语音合成',
      method: 'POST',
      path: '/v1/text-to-speech/{voice_id}/stream',
      description: 'Stream chunked audio chunks immediately as they are generated for ultra-low latency real-time voice applications.',
      description_zh: '即时流式输出音频分块，首包延迟极致优化，适用于实时交互机器人与电话客服。',
      defaultHeaders: {
        'xi-api-key': '{{XI_API_KEY}}',
        'Content-Type': 'application/json'
      },
      defaultQueryParams: {
        'output_format': 'pcm_24000',
        'optimize_streaming_latency': '3'
      },
      defaultBody: {
        text: '正在为您以流式传输模式生成极速响应语音。',
        model_id: 'eleven_flash_v2_5',
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.8
        }
      },
      hasAudioResponse: true,
      docUrl: 'https://elevenlabs.io/docs/api-reference/text-to-speech/stream'
    },
    {
      id: 'sts_transform',
      name: 'Speech to Speech',
      name_zh: '声音音色转换 (STS)',
      category: 'tts',
      category_zh: '核心语音合成',
      method: 'POST',
      path: '/v1/speech-to-speech/{voice_id}',
      description: 'Transform an input speech audio clip into another target voice while preserving tone and emotional nuance.',
      description_zh: '将输入的语音音频直接转变为目标音色，完美保留原始说话人的语气语调与抑扬顿挫。',
      defaultHeaders: {
        'xi-api-key': '{{XI_API_KEY}}',
        'Content-Type': 'multipart/form-data'
      },
      defaultQueryParams: {
        'output_format': 'mp3_44100_128'
      },
      defaultBody: {
        model_id: 'eleven_multilingual_sts_v2',
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.75
        }
      },
      hasAudioResponse: true,
      docUrl: 'https://elevenlabs.io/docs/api-reference/speech-to-speech'
    },
    {
      id: 'sound_effects',
      name: 'Sound Effects Generation',
      name_zh: 'AI 电影级音效生成',
      category: 'audio',
      category_zh: '音频与多模态处理',
      method: 'POST',
      path: '/v1/sound-generation',
      description: 'Generates custom cinematic sound effects and foley audio directly from descriptive prompt text.',
      description_zh: '根据自然语言文本描述，直接生成电影级无损高品质拟音与环境音效。',
      defaultHeaders: {
        'xi-api-key': '{{XI_API_KEY}}',
        'Content-Type': 'application/json'
      },
      defaultBody: {
        text: 'Cyberpunk laser rifle charging and firing with heavy bass reverb',
        duration_seconds: 3.5,
        prompt_influence: 0.3
      },
      hasAudioResponse: true,
      docUrl: 'https://elevenlabs.io/docs/api-reference/sound-generation'
    },
    {
      id: 'audio_isolation',
      name: 'Audio Isolation & Vocal Extraction',
      name_zh: '人声分离与背景降噪',
      category: 'audio',
      category_zh: '音频与多模态处理',
      method: 'POST',
      path: '/v1/audio-isolation',
      description: 'Isolates and purifies human voice stems from noisy background music, street noise, or hum.',
      description_zh: '从嘈杂的背景音乐、环境杂音中深度剥离并提取纯净的高保真人声音轨。',
      defaultHeaders: {
        'xi-api-key': '{{XI_API_KEY}}',
        'Content-Type': 'multipart/form-data'
      },
      defaultBody: {},
      hasAudioResponse: true,
      docUrl: 'https://elevenlabs.io/docs/api-reference/audio-isolation'
    },
    {
      id: 'scribe_stt',
      name: 'Speech to Text (Scribe)',
      name_zh: 'Scribe 高精度语音转文字 (STT)',
      category: 'audio',
      category_zh: '音频与多模态处理',
      method: 'POST',
      path: '/v1/speech-to-text',
      description: 'Transcribes spoken audio into timestamps, word-level alignments, and speaker diarization across 99+ languages.',
      description_zh: '支持 99+ 语言的词级时间戳对齐与说话人分离高精度语音转录。',
      defaultHeaders: {
        'xi-api-key': '{{XI_API_KEY}}',
        'Content-Type': 'multipart/form-data'
      },
      defaultBody: {
        model_id: 'scribe_v1',
        diarize: true,
        tag_audio_events: true
      },
      docUrl: 'https://elevenlabs.io/docs/api-reference/speech-to-text'
    },
    {
      id: 'dubbing_create',
      name: 'Create Dubbing Project',
      name_zh: '创建 AI 视频/音频配音项目',
      category: 'audio',
      category_zh: '音频与多模态处理',
      method: 'POST',
      path: '/v1/dubbing',
      description: 'Dubs video or audio files/URLs into 29+ languages while preserving the original speakers’ voices, emotion, and timing.',
      description_zh: '将视频或音频直接翻译并配音为 29+ 种目标语言，支持唇形同步与原声声纹克隆。',
      defaultHeaders: {
        'xi-api-key': '{{XI_API_KEY}}',
        'Content-Type': 'multipart/form-data'
      },
      defaultBody: {
        name: 'Product Keynote Global Dubbing',
        target_lang: 'zh',
        source_lang: 'auto',
        num_speakers: 1,
        watermark: false,
        highest_resolution: true
      },
      docUrl: 'https://elevenlabs.io/docs/api-reference/dubbing/create'
    },
    {
      id: 'dubbing_get',
      name: 'Get Dubbing Project Status',
      name_zh: '查询配音项目进度与元数据',
      category: 'audio',
      category_zh: '音频与多模态处理',
      method: 'GET',
      path: '/v1/dubbing/{dubbing_id}',
      description: 'Retrieves current processing state, target language progress, and download links for a dubbing project.',
      description_zh: '获取配音项目的处理状态（dubbing/dubbed）、生成进度以及多语种产物元数据。',
      defaultHeaders: {
        'xi-api-key': '{{XI_API_KEY}}'
      },
      docUrl: 'https://elevenlabs.io/docs/api-reference/dubbing/get'
    },
    {
      id: 'dubbing_audio',
      name: 'Get Dubbed Target Audio',
      name_zh: '下载配音后多语种音频产物',
      category: 'audio',
      category_zh: '音频与多模态处理',
      method: 'GET',
      path: '/v1/dubbing/{dubbing_id}/audio/{language_code}',
      description: 'Downloads the localized audio file generated for a specific target language.',
      description_zh: '下载特定目标语言（如 zh/es/ja/de）的最终高品质配音合成音频。',
      defaultHeaders: {
        'xi-api-key': '{{XI_API_KEY}}'
      },
      hasAudioResponse: true,
      docUrl: 'https://elevenlabs.io/docs/api-reference/dubbing/get-audio'
    },
    {
      id: 'dubbing_transcript',
      name: 'Get Dubbed Subtitles (SRT/VTT)',
      name_zh: '下载配音对齐字幕 (SRT/VTT)',
      category: 'audio',
      category_zh: '音频与多模态处理',
      method: 'GET',
      path: '/v1/dubbing/{dubbing_id}/transcript/{language_code}',
      description: 'Downloads perfectly synchronized SRT or WebVTT subtitles for the dubbed content.',
      description_zh: '获取与配音内容完全对齐的 SRT 或 WebVTT 格式双语字幕文件。',
      defaultHeaders: {
        'xi-api-key': '{{XI_API_KEY}}'
      },
      defaultQueryParams: {
        'format_type': 'srt'
      },
      docUrl: 'https://elevenlabs.io/docs/api-reference/dubbing/get-transcript'
    },
    {
      id: 'tts_timestamps',
      name: 'Text to Speech with Timestamps',
      name_zh: '带时间戳的语音合成 (字词对齐)',
      category: 'tts',
      category_zh: '核心语音合成',
      method: 'POST',
      path: '/v1/text-to-speech/{voice_id}/with-timestamps',
      description: 'Generates audio along with character-level and word-level start/end timestamps for precise UI subtitle highlighting.',
      description_zh: '合成语音的同时返回每个字符和单词的精确起止时间戳，用于前端卡拉OK式字幕同步点亮。',
      defaultHeaders: {
        'xi-api-key': '{{XI_API_KEY}}',
        'Content-Type': 'application/json'
      },
      defaultBody: {
        text: 'ElevenLabs 提供全球最高精度的音画同步时间戳生成。',
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8
        }
      },
      docUrl: 'https://elevenlabs.io/docs/api-reference/text-to-speech/with-timestamps'
    },
    {
      id: 'tts_dialogue',
      name: 'Text to Dialogue (Multi-Speaker)',
      name_zh: '多人剧本对话合成 (Text to Dialogue)',
      category: 'tts',
      category_zh: '核心语音合成',
      method: 'POST',
      path: '/v1/text-to-dialogue',
      description: 'Converts full multi-character script dialogues into continuous multi-speaker audio in a single API call.',
      description_zh: '单次 API 调用即可合成包含多个不同说话人角色的长篇剧本与播客对话。',
      defaultHeaders: {
        'xi-api-key': '{{XI_API_KEY}}',
        'Content-Type': 'application/json'
      },
      defaultBody: {
        inputs: [
          { voice_id: '21m00Tcm4TlvDq8ikWAM', text: 'Hey, have you checked out ElevenLabs new API core suite?' },
          { voice_id: 'AZnzlk1XvdvUeBnXmlld', text: 'Yes, it covers TTS, Scribe STT, Dubbing, and Voice Cloning seamlessly!' }
        ]
      },
      hasAudioResponse: true,
      docUrl: 'https://elevenlabs.io/docs/api-reference/text-to-dialogue'
    },
    {
      id: 'music_generate',
      name: 'AI Music & Soundtrack Generation',
      name_zh: 'AI 音乐与原声带生成',
      category: 'audio',
      category_zh: '音频与多模态处理',
      method: 'POST',
      path: '/v1/music',
      description: 'Generates full instrumental and vocal music tracks from natural language prompts.',
      description_zh: '根据自然语言提示词生成极具质感的管弦乐、电子乐或人声伴奏音乐。',
      defaultHeaders: {
        'xi-api-key': '{{XI_API_KEY}}',
        'Content-Type': 'application/json'
      },
      defaultBody: {
        prompt: 'Lo-fi chill hop study beat with warm vinyl crackle and soothing piano melody',
        duration_seconds: 30
      },
      hasAudioResponse: true,
      docUrl: 'https://elevenlabs.io/docs/api-reference/music'
    },
    {
      id: 'shared_voices_explore',
      name: 'Explore Shared Voices (Voice Library)',
      name_zh: '探索音色社区库 (Shared Voices)',
      category: 'voices',
      category_zh: '音色与模型字典',
      method: 'GET',
      path: '/v1/shared-voices',
      description: 'Explores curated and community-shared voices filtered by category, language, gender, and use-case.',
      description_zh: '根据语言、类别、性别与应用场景查询全球创作者共享的海量高保真音色库。',
      defaultHeaders: {
        'xi-api-key': '{{XI_API_KEY}}'
      },
      defaultQueryParams: {
        'page_size': '30',
        'category': 'conversational',
        'language': 'Hindi'
      },
      docUrl: 'https://elevenlabs.io/docs/api-reference/voices/get-shared'
    },
    {
      id: 'add_shared_voice',
      name: 'Add Shared Voice to Workspace',
      name_zh: '将社区音色添加到工作空间',
      category: 'voices',
      category_zh: '音色与模型字典',
      method: 'POST',
      path: '/v1/voices/add/{public_user_id}/{voice_id}',
      description: 'Adds a shared voice from the ElevenLabs community voice library directly into your account for immediate generation.',
      description_zh: '将音色市场的共享音色一键添加到当前企业工作区，可直接用于 TTS 和 Agent 对话。',
      defaultHeaders: {
        'xi-api-key': '{{XI_API_KEY}}',
        'Content-Type': 'application/json'
      },
      defaultBody: {
        new_name: 'Anjali - Conversational Assistant'
      },
      docUrl: 'https://elevenlabs.io/docs/api-reference/voices/add-shared'
    },
    {
      id: 'voice_cloning_instant',
      name: 'Instant Voice Cloning (IVC)',
      name_zh: '即时声纹克隆 (IVC)',
      category: 'voices',
      category_zh: '音色与模型字典',
      method: 'POST',
      path: '/v1/voices/add',
      description: 'Clones a new voice in seconds from one or more sample audio files.',
      description_zh: '上传说话人音频样本（1分钟以上），数秒内极速克隆专属声纹模型。',
      defaultHeaders: {
        'xi-api-key': '{{XI_API_KEY}}',
        'Content-Type': 'multipart/form-data'
      },
      defaultBody: {
        name: 'My Custom Executive Voice',
        description: 'Corporate briefing clone with warm authoritative delivery'
      },
      docUrl: 'https://elevenlabs.io/docs/api-reference/voices/add'
    },
    {
      id: 'voice_design_preview',
      name: 'Voice Design (Text-to-Voice)',
      name_zh: '声纹设计器 (自然语言捏音)',
      category: 'voices',
      category_zh: '音色与模型字典',
      method: 'POST',
      path: '/v1/voice-generation/generate-voice',
      description: 'Generates a brand new AI voice from gender, age, accent, and accent strength parameters.',
      description_zh: '通过性别、年龄、口音及口音强度坐标，无中生有合成全新虚拟人声。',
      defaultHeaders: {
        'xi-api-key': '{{XI_API_KEY}}',
        'Content-Type': 'application/json'
      },
      defaultBody: {
        gender: 'female',
        accent: 'american',
        age: 'young',
        accent_strength: 1.0,
        text: 'This is a sample preview generated by ElevenLabs Voice Design AI.'
      },
      hasAudioResponse: true,
      docUrl: 'https://elevenlabs.io/docs/api-reference/voice-generation/generate'
    },
    {
      id: 'pronunciation_dictionaries',
      name: 'Pronunciation Dictionaries API',
      name_zh: '发音词典与音素规则管理',
      category: 'voices',
      category_zh: '音色与模型字典',
      method: 'GET',
      path: '/v1/pronunciation-dictionaries',
      description: 'Manages PLS phoneme dictionaries and alias replacement rules for enterprise jargon and brand names.',
      description_zh: '查询与管理企业专有名词、品牌缩写与国际音标 (IPA) 发音替换词典。',
      defaultHeaders: {
        'xi-api-key': '{{XI_API_KEY}}'
      },
      docUrl: 'https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries'
    },
    {
      id: 'projects_studio',
      name: 'Long-Form Projects (Studio)',
      name_zh: 'Studio 长音频有声书工程',
      category: 'audio',
      category_zh: '音频与多模态处理',
      method: 'GET',
      path: '/v1/projects',
      description: 'Lists long-form studio projects, chapter structures, and automated audio exports.',
      description_zh: '查询长篇有声书工程、多章节分段合成进度与母带级音频快照。',
      defaultHeaders: {
        'xi-api-key': '{{XI_API_KEY}}'
      },
      docUrl: 'https://elevenlabs.io/docs/api-reference/projects'
    },
    {
      id: 'convai_signed_url',
      name: 'Agent Signed WebSocket URL',
      name_zh: '获取 Agent 对话实时鉴权 URL',
      category: 'agents',
      category_zh: 'AI Agents 智能体',
      method: 'POST',
      path: '/v1/convai/conversation/get_signed_url',
      description: 'Generates a secure, temporary signed WebSocket URL to start a zero-latency conversational session.',
      description_zh: '获取带有时效性签名的 WebSocket 连接凭据，前端可免主密钥安全直连智能体对话。',
      defaultHeaders: {
        'xi-api-key': '{{XI_API_KEY}}',
        'Content-Type': 'application/json'
      },
      defaultBody: {
        agent_id: 'agent_default_support'
      },
      docUrl: 'https://elevenlabs.io/docs/conversational-ai/api-reference#get-signed-url'
    },
    {
      id: 'user_subscription',
      name: 'Subscription & Credits Quota',
      name_zh: '订阅状态、并发上限与字符额度',
      category: 'workspace',
      category_zh: '企业治理与权限',
      method: 'GET',
      path: '/v1/user/subscription',
      description: 'Retrieves current subscription tier, character usage, rollover balance, and active concurrency limits.',
      description_zh: '获取当前订阅套餐等级、字符消耗统计、重置周期与并发数限制。',
      defaultHeaders: {
        'xi-api-key': '{{XI_API_KEY}}'
      },
      docUrl: 'https://elevenlabs.io/docs/api-reference/user/get-subscription'
    },
    {
      id: 'get_voices',
      name: 'Get All Voices',
      name_zh: '获取音色库全量列表',
      category: 'voices',
      category_zh: '音色与模型字典',
      method: 'GET',
      path: '/v1/voices',
      description: 'Retrieves all available premade, cloned, and shared voices in your workspace.',
      description_zh: '获取当前账户与企业工作区内所有官方音色、克隆音色与设计音色列表。',
      defaultHeaders: {
        'xi-api-key': '{{XI_API_KEY}}'
      },
      docUrl: 'https://elevenlabs.io/docs/api-reference/voices/get-all'
    },
    {
      id: 'get_models',
      name: 'Get Available Models',
      name_zh: '获取可用语音大模型列表',
      category: 'voices',
      category_zh: '音色与模型字典',
      method: 'GET',
      path: '/v1/models',
      description: 'Lists all neural voice models supported by ElevenLabs (Multilingual v2, Flash v2.5, Turbo v2.5, STS v2).',
      description_zh: '查询 ElevenLabs 支持的所有神经网络语音模型及其能力参数与语言支持。',
      defaultHeaders: {
        'xi-api-key': '{{XI_API_KEY}}'
      },
      docUrl: 'https://elevenlabs.io/docs/api-reference/models/get-all'
    },
    {
      id: 'agents_conv',
      name: 'Conversational Agents Invocation',
      name_zh: '对话 Agent 智能体调用与交互',
      category: 'agents',
      category_zh: 'AI Agents 智能体',
      method: 'GET',
      path: '/v1/convai/agents',
      description: 'Lists conversational voice agents configured in your workspace.',
      description_zh: '查询工作区内创建的全部实时语音对话智能体及其提示词与工具链配置。',
      defaultHeaders: {
        'xi-api-key': '{{XI_API_KEY}}'
      },
      docUrl: 'https://elevenlabs.io/docs/conversational-ai/api-reference'
    },
    {
      id: 'workspace_members',
      name: 'Workspace Members & Roles (RBAC)',
      name_zh: '企业工作区席位与成员权限',
      category: 'workspace',
      category_zh: '企业治理与权限',
      method: 'GET',
      path: '/v1/workspace/members',
      description: 'Enterprise API to list workspace members, role allocations, and per-seat character limits.',
      description_zh: '企业级 API：查询工作区所有成员席位、角色分配与配额上限。',
      defaultHeaders: {
        'xi-api-key': '{{XI_API_KEY}}'
      },
      docUrl: 'https://elevenlabs.io/docs/api-reference/workspace'
    },
    {
      id: 'service_accounts',
      name: 'Service Accounts Provisioning',
      name_zh: '企业 Service Account 密钥分发',
      category: 'workspace',
      category_zh: '企业治理与权限',
      method: 'GET',
      path: '/v1/service-accounts',
      description: 'Retrieve and manage enterprise service accounts and programmatic API credentials.',
      description_zh: '查询与管理企业级 Service Account 密钥及下属业务线配额。',
      defaultHeaders: {
        'xi-api-key': '{{XI_API_KEY}}'
      },
      docUrl: 'https://elevenlabs.io/docs/api-reference/service-accounts'
    }
  ];

  const [selectedEndpointId, setSelectedEndpointId] = useState<string>('tts_generate');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeSdkTab, setActiveSdkTab] = useState<'curl' | 'python_sdk' | 'ts_fetch' | 'python_requests' | 'ws_stream'>('curl');

  const selectedEndpoint = endpoints.find(e => e.id === selectedEndpointId) || endpoints[0];

  // Request State
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(() => voices[0]?.voice_id || '21m00Tcm4TlvDq8ikWAM');
  const [requestHeadersJson, setRequestHeadersJson] = useState<string>(() => JSON.stringify(selectedEndpoint.defaultHeaders, null, 2));
  const [requestQueryJson, setRequestQueryJson] = useState<string>(() => JSON.stringify(selectedEndpoint.defaultQueryParams || {}, null, 2));
  const [requestBodyJson, setRequestBodyJson] = useState<string>(() => JSON.stringify(selectedEndpoint.defaultBody || {}, null, 2));

  // Execution & Response State
  const [isExecuting, setIsExecuting] = useState(false);
  const [execResult, setExecResult] = useState<LiveApiTestResult | null>(null);
  const [copiedSdk, setCopiedSdk] = useState(false);

  // Update editors when endpoint changes
  const handleSelectEndpoint = (endpoint: EndpointDef) => {
    setSelectedEndpointId(endpoint.id);
    setRequestHeadersJson(JSON.stringify(endpoint.defaultHeaders, null, 2));
    setRequestQueryJson(JSON.stringify(endpoint.defaultQueryParams || {}, null, 2));
    setRequestBodyJson(JSON.stringify(endpoint.defaultBody || {}, null, 2));
    setExecResult(null);
  };

  const getResolvedPath = () => {
    return selectedEndpoint.path.replace('{voice_id}', selectedVoiceId || '21m00Tcm4TlvDq8ikWAM');
  };

  // Run execution
  const handleExecuteRequest = async () => {
    setIsExecuting(true);
    setExecResult(null);

    try {
      let parsedHeaders = {};
      let parsedBody = {};
      let parsedQuery = {};

      try {
        parsedHeaders = JSON.parse(requestHeadersJson);
      } catch (e) {}

      try {
        parsedBody = JSON.parse(requestBodyJson);
      } catch (e) {}

      try {
        parsedQuery = JSON.parse(requestQueryJson);
      } catch (e) {}

      const resolvedPath = getResolvedPath();

      const response = await apiFetch('/api/workbench/live-exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: resolvedPath,
          method: selectedEndpoint.method,
          headers: parsedHeaders,
          query_params: parsedQuery,
          payload: parsedBody
        })
      });

      const data: LiveApiTestResult = await response.json();
      setExecResult(data);
    } catch (err: any) {
      setExecResult({
        status: 500,
        statusText: 'Client Error',
        latency_ms: 0,
        ttfb_ms: 0,
        headers: {},
        contentType: 'application/json',
        error: err.message || 'Execution failed',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // Generate SDK Code Snippets
  const generateSnippet = () => {
    const resolvedPath = getResolvedPath();
    const cleanKey = localStorage.getItem('elevenlabs_custom_api_key') || 'YOUR_XI_API_KEY';
    let bodyObj: any = {};
    try {
      bodyObj = JSON.parse(requestBodyJson);
    } catch (e) {
      bodyObj = selectedEndpoint.defaultBody || {};
    }

    if (activeSdkTab === 'curl') {
      if (selectedEndpoint.method === 'GET') {
        return `curl -X GET "https://api.elevenlabs.io${resolvedPath}" \\
  -H "xi-api-key: ${cleanKey}"`;
      }
      return `curl -X POST "https://api.elevenlabs.io${resolvedPath}" \\
  -H "xi-api-key: ${cleanKey}" \\
  -H "Content-Type: application/json" \\
  -H "Accept: audio/mpeg" \\
  -d '${JSON.stringify(bodyObj, null, 2)}' \\
  --output output.mp3`;
    }

    if (activeSdkTab === 'python_sdk') {
      return `import os
from elevenlabs.client import ElevenLabs

# Initialize official ElevenLabs Client
client = ElevenLabs(
    api_key=os.getenv("ELEVENLABS_API_KEY", "${cleanKey}")
)

# Text to Speech generation with high-fidelity model
audio = client.text_to_speech.convert(
    voice_id="${selectedVoiceId || '21m00Tcm4TlvDq8ikWAM'}",
    text="${bodyObj.text || 'Hello world from ElevenLabs API'}",
    model_id="${bodyObj.model_id || 'eleven_multilingual_v2'}",
    output_format="mp3_44100_128"
)

# Save or play audio stream
with open("output.mp3", "wb") as f:
    for chunk in audio:
        f.write(chunk)
print("Speech synthesis complete -> output.mp3")`;
    }

    if (activeSdkTab === 'ts_fetch') {
      return `import { ElevenLabsClient } from "elevenlabs";

// Initialize official Node.js / TypeScript SDK
const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY || "${cleanKey}",
});

async function main() {
  const audio = await elevenlabs.textToSpeech.convert("${selectedVoiceId || '21m00Tcm4TlvDq8ikWAM'}", {
    text: ${JSON.stringify(bodyObj.text || 'Hello world from ElevenLabs API')},
    model_id: "${bodyObj.model_id || 'eleven_multilingual_v2'}",
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.15
    }
  });

  // Stream chunks to writable stream or web response
  console.log("Synthesized audio stream received successfully");
}

main();`;
    }

    if (activeSdkTab === 'python_requests') {
      return `import requests

url = "https://api.elevenlabs.io${resolvedPath}"
headers = {
    "xi-api-key": "${cleanKey}",
    "Content-Type": "application/json"
}
payload = ${JSON.stringify(bodyObj, null, 4)}

response = requests.post(url, json=payload, headers=headers)

if response.status_code == 200:
    with open("output.mp3", "wb") as f:
        f.write(response.content)
    print("Downloaded audio output.mp3 successfully")
else:
    print(f"Error: {response.status_code} - {response.text}")`;
    }

    if (activeSdkTab === 'ws_stream') {
      return `// Ultra-Low Latency Bidirectional WebSocket Stream (BOS / EOS)
const voiceId = "${selectedVoiceId || '21m00Tcm4TlvDq8ikWAM'}";
const modelId = "eleven_flash_v2_5";
const wsUrl = \`wss://api.elevenlabs.io/v1/text-to-speech/\${voiceId}/stream-input?model_id=\${modelId}\`;

const socket = new WebSocket(wsUrl);

socket.onopen = () => {
  // 1. Send Beginning of Stream (BOS)
  socket.send(JSON.stringify({
    text: " ",
    voice_settings: { stability: 0.5, similarity_boost: 0.8 },
    xi_api_key: "${cleanKey}"
  }));

  // 2. Stream dynamic tokens
  socket.send(JSON.stringify({ text: "Hello from real-time stream! ", try_trigger_generation: true }));

  // 3. Send End of Stream (EOS)
  socket.send(JSON.stringify({ text: "" }));
};

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.audio) {
    const audioChunk = atob(data.audio);
    // Play back chunk through Web Audio API AudioContext
  }
};`;
    }

    return '';
  };

  const copySnippetToClipboard = () => {
    navigator.clipboard.writeText(generateSnippet());
    setCopiedSdk(true);
    setTimeout(() => setCopiedSdk(false), 2000);
  };

  const filteredEndpoints = selectedCategory === 'all'
    ? endpoints
    : endpoints.filter(e => e.category === selectedCategory);

  return (
    <div id="api_workbench_container" className="space-y-6 animate-in fade-in duration-300">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2.5">
            <Terminal className="h-5 w-5 text-purple-400" />
            <span>{language === 'zh' ? 'API 核心套件与开发者工作台 (Developer Workbench)' : 'API Core Scaffolding & Developer Workbench'}</span>
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            {language === 'zh'
              ? '全功能 API 端点目录、动态参数调试沙盒、多语言 SDK 脚手架一键生成及实时响应监控与延迟分析。'
              : 'Interactive endpoint catalog, request playground, multi-language SDK code generator, and live latency inspector.'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <a
            href="https://elevenlabs.io/docs/api-reference"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition"
          >
            <ExternalLink className="h-3.5 w-3.5 text-purple-400" />
            <span>{language === 'zh' ? '官方 API 文档' : 'Official Docs'}</span>
          </a>
        </div>
      </div>

      {/* WORKBENCH 2-COLUMN LAYOUT: LEFT CATALOG & RIGHT PLAYGROUND */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: ENDPOINTS CATALOG (4 COLS) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {[
              { id: 'all', label_zh: '全部接口', label_en: 'All' },
              { id: 'tts', label_zh: 'TTS/STS', label_en: 'TTS/STS' },
              { id: 'audio', label_zh: '音频与配音', label_en: 'Audio & Dubbing' },
              { id: 'voices', label_zh: '音色与模型', label_en: 'Voices & Models' },
              { id: 'agents', label_zh: 'Agent智能体', label_en: 'AI Agents' },
              { id: 'workspace', label_zh: '企业治理', label_en: 'Workspace' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
                }`}
              >
                {language === 'zh' ? cat.label_zh : cat.label_en}
              </button>
            ))}
          </div>

          {/* Endpoints List */}
          <div className="bg-slate-900/40 border border-purple-500/20 rounded-2xl p-3 space-y-1.5 max-h-[720px] overflow-y-auto backdrop-blur-md shadow-xl shadow-purple-950/10">
            {filteredEndpoints.map(ep => {
              const isSelected = selectedEndpointId === ep.id;
              return (
                <button
                  key={ep.id}
                  onClick={() => handleSelectEndpoint(ep)}
                  className={`w-full text-left p-3 rounded-xl transition flex flex-col space-y-1 border ${
                    isSelected
                      ? 'bg-purple-950/60 border-purple-500/40 shadow-sm shadow-purple-900/20'
                      : 'border-transparent hover:bg-slate-900/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      ep.method === 'POST' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                      ep.method === 'GET' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {ep.method}
                    </span>
                    <span className="text-[10px] text-purple-400/80 font-medium">
                      {language === 'zh' ? ep.category_zh : ep.category.toUpperCase()}
                    </span>
                  </div>

                  <div className="font-bold text-xs text-white">
                    {language === 'zh' ? ep.name_zh : ep.name}
                  </div>

                  <div className="text-[10px] font-mono text-slate-400 truncate">
                    {ep.path}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: PLAYGROUND, CODE GENERATOR & RESPONSE INSPECTOR (8 COLS) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* ENDPOINT HERO CARD */}
          <div className="bg-slate-900/40 border border-purple-500/20 rounded-2xl p-5 backdrop-blur-md shadow-xl shadow-purple-950/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md border ${
                    selectedEndpoint.method === 'POST' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                    'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                  }`}>
                    {selectedEndpoint.method}
                  </span>
                  <span className="font-mono text-xs font-bold text-purple-200">
                    https://api.elevenlabs.io{getResolvedPath()}
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  {language === 'zh' ? selectedEndpoint.description_zh : selectedEndpoint.description}
                </p>
              </div>

              {/* Action Button: Execute Request */}
              <button
                onClick={handleExecuteRequest}
                disabled={isExecuting}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition shadow-md shadow-purple-900/30 shrink-0 disabled:opacity-50"
              >
                {isExecuting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>{language === 'zh' ? '正在执行调测...' : 'Executing...'}</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-white" />
                    <span>{language === 'zh' ? '⚡ 发送实时请求' : 'Send Request'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Path Variable Selector if path contains voice_id */}
            {selectedEndpoint.path.includes('{voice_id}') && (
              <div className="p-3 bg-purple-950/30 border border-purple-500/25 rounded-xl flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2 text-slate-300 font-semibold">
                  <Sliders className="h-4 w-4 text-purple-400" />
                  <span>{language === 'zh' ? '路径参数 voice_id' : 'Path param voice_id'}:</span>
                </div>
                <select
                  value={selectedVoiceId}
                  onChange={e => setSelectedVoiceId(e.target.value)}
                  className="bg-slate-900 border border-purple-500/30 focus:border-purple-400 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none max-w-xs"
                >
                  {voices.map(v => (
                    <option key={v.voice_id} value={v.voice_id}>{v.name} ({v.voice_id})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Request Payload Editor */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Code2 className="h-3.5 w-3.5 text-purple-400" />
                  <span>{language === 'zh' ? '请求 Body (JSON Payload)' : 'Request Body (JSON)'}</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">application/json</span>
              </div>
              <textarea
                value={requestBodyJson}
                onChange={e => setRequestBodyJson(e.target.value)}
                rows={6}
                className="w-full bg-slate-950 border border-purple-500/30 focus:border-purple-400 rounded-xl p-3 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* CODE SCAFFOLDING / SDK GENERATOR */}
          <div className="bg-slate-900/40 border border-purple-500/20 rounded-2xl p-5 backdrop-blur-md shadow-xl shadow-purple-950/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  {language === 'zh' ? '多语言 SDK 代码生成 (Production-Ready Code)' : 'SDK Code Scaffolding'}
                </h3>
              </div>

              {/* Copy Code Snippet Button */}
              <button
                onClick={copySnippetToClipboard}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-purple-500/30 rounded-xl text-xs font-semibold text-purple-200 flex items-center gap-1.5 transition"
              >
                {copiedSdk ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedSdk ? (language === 'zh' ? '已复制到剪贴板' : 'Copied!') : (language === 'zh' ? '一键复制代码' : 'Copy Snippet')}</span>
              </button>
            </div>

            {/* Language Selector Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'curl', label: 'cURL (Bash)' },
                { id: 'python_sdk', label: 'Python (Official SDK)' },
                { id: 'ts_fetch', label: 'TypeScript / Node.js' },
                { id: 'python_requests', label: 'Python (requests)' },
                { id: 'ws_stream', label: 'WebSocket (Real-time Stream)' }
              ].map(sdk => (
                <button
                  key={sdk.id}
                  onClick={() => setActiveSdkTab(sdk.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                    activeSdkTab === sdk.id
                      ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
                  }`}
                >
                  {sdk.label}
                </button>
              ))}
            </div>

            {/* Generated Code Display */}
            <pre className="p-4 bg-slate-950 border border-purple-500/20 rounded-xl text-xs text-purple-300 font-mono overflow-x-auto leading-relaxed">
              {generateSnippet()}
            </pre>
          </div>

          {/* LIVE RESPONSE INSPECTOR */}
          {execResult && (
            <div className="bg-slate-900/40 border border-purple-500/20 rounded-2xl p-5 backdrop-blur-md shadow-xl shadow-purple-950/10 space-y-4 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-bold border ${
                    execResult.status >= 200 && execResult.status < 300
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-red-500/20 text-red-300 border-red-500/40'
                  }`}>
                    HTTP {execResult.status} {execResult.statusText}
                  </span>
                  <span className="text-xs text-slate-300 font-medium">
                    {language === 'zh' ? '实时响应结果' : 'Live Execution Response'}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="h-3.5 w-3.5 text-purple-400" />
                    <span>{language === 'zh' ? '总延迟' : 'Latency'}: <strong className="text-slate-200">{execResult.latency_ms} ms</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Zap className="h-3.5 w-3.5 text-indigo-400" />
                    <span>TTFB: <strong className="text-slate-200">{execResult.ttfb_ms} ms</strong></span>
                  </div>
                </div>
              </div>

              {/* Audio Playback if response is audio */}
              {execResult.audioUrl && (
                <div className="p-4 bg-emerald-950/25 border border-emerald-500/30 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white">
                        {language === 'zh' ? '音频流回放 (Audio Binary Output)' : 'Audio Stream Output'}
                      </span>
                    </div>
                    <a
                      href={execResult.audioUrl}
                      download={`elevenlabs-workbench-${Date.now()}.mp3`}
                      className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>{language === 'zh' ? '下载音频 (.mp3)' : 'Download Audio'}</span>
                    </a>
                  </div>
                  <audio src={execResult.audioUrl} controls className="w-full h-8 accent-emerald-500" />
                </div>
              )}

              {/* JSON Response Preview */}
              {execResult.jsonResponse && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    {language === 'zh' ? '响应体 (JSON Body)' : 'Response Body'}
                  </span>
                  <pre className="p-4 bg-slate-950 border border-purple-500/20 rounded-xl text-xs text-slate-200 font-mono overflow-x-auto max-h-80 leading-relaxed">
                    {JSON.stringify(execResult.jsonResponse, null, 2)}
                  </pre>
                </div>
              )}

              {/* Error Alert */}
              {execResult.error && (
                <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                  <span>{execResult.error}</span>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
