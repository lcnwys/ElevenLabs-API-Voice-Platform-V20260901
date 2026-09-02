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
      name: 'Text to Speech Stream (Real-Time WebSocket/Chunked)',
      name_zh: '流式文本转语音 (超低延迟 Stream)',
      category: 'tts',
      category_zh: '核心语音合成',
      method: 'POST',
      path: '/v1/text-to-speech/{voice_id}/stream',
      description: 'Streams synthesized audio in chunks as it is generated for instant playback.',
      description_zh: '以数据分块格式实时下发音频流，支持即刻边接收边播放。',
      defaultHeaders: {
        'xi-api-key': '{{XI_API_KEY}}',
        'Content-Type': 'application/json'
      },
      defaultBody: {
        text: 'Streaming audio with ultra low latency for conversational interactive agents.',
        model_id: 'eleven_flash_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8
        }
      },
      hasAudioResponse: true,
      docUrl: 'https://elevenlabs.io/docs/api-reference/text-to-speech/stream'
    },
    {
      id: 'sts_convert',
      name: 'Speech to Speech (Voice Changer)',
      name_zh: '声音变声转换 (Speech to Speech)',
      category: 'tts',
      category_zh: '核心语音合成',
      method: 'POST',
      path: '/v1/speech-to-speech/{voice_id}',
      description: 'Transforms one speaker voice into another while preserving emotion and cadence.',
      description_zh: '将源音频声音转换为目标音色，保留原始情绪、呼吸与抑扬顿挫。',
      defaultHeaders: {
        'xi-api-key': '{{XI_API_KEY}}',
        'Content-Type': 'multipart/form-data'
      },
      defaultBody: {
        model_id: 'eleven_multilingual_sts_v2'
      },
      hasAudioResponse: true,
      docUrl: 'https://elevenlabs.io/docs/api-reference/speech-to-speech'
    },
    {
      id: 'get_voices',
      name: 'List Available Voices',
      name_zh: '获取可用音色列表',
      category: 'voices',
      category_zh: '音色与模型字典',
      method: 'GET',
      path: '/v1/voices',
      description: 'Returns all available premade, cloned, and designed voices in your workspace.',
      description_zh: '返回当前工作区所有官方预设、克隆及设计的音色模型。',
      defaultHeaders: {
        'xi-api-key': '{{XI_API_KEY}}'
      },
      docUrl: 'https://elevenlabs.io/docs/api-reference/voices/get-all'
    },
    {
      id: 'get_models',
      name: 'List Audio Models',
      name_zh: '获取模型列表',
      category: 'voices',
      category_zh: '音色与模型字典',
      method: 'GET',
      path: '/v1/models',
      description: 'Returns metadata and capability flags for all ElevenLabs neural models.',
      description_zh: '查询 ElevenLabs 所有神经音频模型及其语言支持。',
      defaultHeaders: {
        'xi-api-key': '{{XI_API_KEY}}'
      },
      docUrl: 'https://elevenlabs.io/docs/api-reference/models/get-all'
    },
    {
      id: 'get_user_subscription',
      name: 'Get User Subscription & Quota',
      name_zh: '获取订阅与字符额度',
      category: 'workspace',
      category_zh: '企业治理与权限',
      method: 'GET',
      path: '/v1/user/subscription',
      description: 'Returns subscription status, credits used, quota limits, and renewal dates.',
      description_zh: '返回当前账户的订阅套餐状态、字符消耗量、配额上限及续费重置周期。',
      defaultHeaders: {
        'xi-api-key': '{{XI_API_KEY}}'
      },
      docUrl: 'https://elevenlabs.io/docs/api-reference/user/get-subscription'
    }
  ];

  const [selectedEndpointId, setSelectedEndpointId] = useState<string>('tts_generate');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeSdkTab, setActiveSdkTab] = useState<'curl' | 'python_sdk' | 'ts_fetch'>('curl');

  const selectedEndpoint = endpoints.find(e => e.id === selectedEndpointId) || endpoints[0];

  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(() => voices[0]?.voice_id || '21m00Tcm4TlvDq8ikWAM');
  const [requestHeadersJson, setRequestHeadersJson] = useState<string>(() => JSON.stringify(selectedEndpoint.defaultHeaders, null, 2));
  const [requestBodyJson, setRequestBodyJson] = useState<string>(() => JSON.stringify(selectedEndpoint.defaultBody || {}, null, 2));

  const [isExecuting, setIsExecuting] = useState(false);
  const [execResult, setExecResult] = useState<LiveApiTestResult | null>(null);
  const [copiedSdk, setCopiedSdk] = useState(false);

  const handleSelectEndpoint = (endpoint: EndpointDef) => {
    setSelectedEndpointId(endpoint.id);
    setRequestHeadersJson(JSON.stringify(endpoint.defaultHeaders, null, 2));
    setRequestBodyJson(JSON.stringify(endpoint.defaultBody || {}, null, 2));
    setExecResult(null);
  };

  const getResolvedPath = () => {
    return selectedEndpoint.path.replace('{voice_id}', selectedVoiceId || '21m00Tcm4TlvDq8ikWAM');
  };

  const handleExecuteRequest = async () => {
    setIsExecuting(true);
    setExecResult(null);

    try {
      let parsedHeaders = {};
      let parsedBody = {};

      try {
        parsedHeaders = JSON.parse(requestHeadersJson);
      } catch (e) {}

      try {
        parsedBody = JSON.parse(requestBodyJson);
      } catch (e) {}

      const resolvedPath = getResolvedPath();

      const response = await apiFetch('/api/workbench/live-exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: resolvedPath,
          method: selectedEndpoint.method,
          headers: parsedHeaders,
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
        return `curl -X GET "https://api.elevenlabs.io${resolvedPath}" \\\n  -H "xi-api-key: ${cleanKey}"`;
      }
      return `curl -X POST "https://api.elevenlabs.io${resolvedPath}" \\\n  -H "xi-api-key: ${cleanKey}" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(bodyObj, null, 2)}'`;
    }

    if (activeSdkTab === 'python_sdk') {
      return `from elevenlabs.client import ElevenLabs\n\nclient = ElevenLabs(api_key="${cleanKey}")\n\naudio = client.generate(\n    text="${bodyObj.text || 'Hello world'}",\n    voice="${selectedVoiceId}",\n    model="${bodyObj.model_id || 'eleven_multilingual_v2'}"\n)`;
    }

    if (activeSdkTab === 'ts_fetch') {
      return `const response = await fetch("https://api.elevenlabs.io${resolvedPath}", {\n  method: "${selectedEndpoint.method}",\n  headers: {\n    "xi-api-key": "${cleanKey}",\n    "Content-Type": "application/json"\n  },\n  body: JSON.stringify(${JSON.stringify(bodyObj, null, 2)})\n});\nconst data = await response.json();`;
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
    <div id="api_workbench_container" className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-200">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Terminal className="h-5 w-5 text-gray-900" />
            <span>{language === 'zh' ? '开发者 API 工作台' : 'Developer API Workbench'}</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {language === 'zh'
              ? '全功能 API 端点目录、参数调试沙盒及多语言 SDK 代码生成。'
              : 'Interactive endpoint catalog, request playground, and multi-language SDK snippets.'}
          </p>
        </div>
        
        <a
          href="https://elevenlabs.io/docs/api-reference"
          target="_blank"
          rel="noreferrer"
          className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-800 flex items-center gap-1.5 transition"
        >
          <ExternalLink className="h-3.5 w-3.5 text-gray-500" />
          <span>{language === 'zh' ? '官方 API 文档' : 'Docs'}</span>
        </a>
      </div>

      {/* 2-COLUMN LAYOUT: CATALOG & PLAYGROUND */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: ENDPOINTS */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'all', label_zh: '全部', label_en: 'All' },
              { id: 'tts', label_zh: 'TTS', label_en: 'TTS' },
              { id: 'voices', label_zh: '音色', label_en: 'Voices' },
              { id: 'workspace', label_zh: '工作区', label_en: 'Workspace' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  selectedCategory === cat.id
                    ? 'bg-black text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:text-black'
                }`}
              >
                {language === 'zh' ? cat.label_zh : cat.label_en}
              </button>
            ))}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-2 space-y-1 max-h-[600px] overflow-y-auto">
            {filteredEndpoints.map(ep => {
              const isSelected = selectedEndpointId === ep.id;
              return (
                <button
                  key={ep.id}
                  onClick={() => handleSelectEndpoint(ep)}
                  className={`w-full text-left p-2.5 rounded-lg transition flex flex-col space-y-1 ${
                    isSelected
                      ? 'bg-gray-100 border border-gray-300'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-gray-200 text-gray-800">
                      {ep.method}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium uppercase">
                      {ep.category}
                    </span>
                  </div>

                  <div className="font-semibold text-xs text-gray-900">
                    {language === 'zh' ? ep.name_zh : ep.name}
                  </div>

                  <div className="text-[10px] font-mono text-gray-500 truncate">
                    {ep.path}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: REQUEST & PLAYGROUND */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-gray-500">{selectedEndpoint.method} {getResolvedPath()}</span>
                <p className="text-xs text-gray-600 mt-0.5">{language === 'zh' ? selectedEndpoint.description_zh : selectedEndpoint.description}</p>
              </div>

              <button
                onClick={handleExecuteRequest}
                disabled={isExecuting}
                className="bg-black hover:bg-gray-800 text-white font-medium px-4 py-2 text-xs rounded-lg transition flex items-center gap-1.5 shrink-0"
              >
                {isExecuting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 fill-white" />}
                <span>{isExecuting ? (language === 'zh' ? '发送中...' : 'Sending...') : (language === 'zh' ? '运行请求' : 'Execute')}</span>
              </button>
            </div>

            {/* Request Payload Editor */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{language === 'zh' ? '请求 Body (JSON)' : 'Request Body (JSON)'}</label>
              <textarea
                value={requestBodyJson}
                onChange={e => setRequestBodyJson(e.target.value)}
                className="w-full h-36 bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-xs text-gray-900 focus:outline-none focus:border-black resize-none"
              />
            </div>

            {/* Code Snippets Generator */}
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex space-x-2 text-xs">
                  <button
                    onClick={() => setActiveSdkTab('curl')}
                    className={`px-2.5 py-1 rounded-md font-medium transition ${
                      activeSdkTab === 'curl' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:text-black'
                    }`}
                  >
                    cURL
                  </button>
                  <button
                    onClick={() => setActiveSdkTab('python_sdk')}
                    className={`px-2.5 py-1 rounded-md font-medium transition ${
                      activeSdkTab === 'python_sdk' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:text-black'
                    }`}
                  >
                    Python SDK
                  </button>
                  <button
                    onClick={() => setActiveSdkTab('ts_fetch')}
                    className={`px-2.5 py-1 rounded-md font-medium transition ${
                      activeSdkTab === 'ts_fetch' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:text-black'
                    }`}
                  >
                    TypeScript
                  </button>
                </div>

                <button
                  onClick={copySnippetToClipboard}
                  className="text-xs text-gray-500 hover:text-black flex items-center gap-1 font-medium"
                >
                  {copiedSdk ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedSdk ? (language === 'zh' ? '已复制' : 'Copied') : (language === 'zh' ? '复制' : 'Copy')}</span>
                </button>
              </div>

              <pre className="p-3 bg-gray-900 text-gray-100 rounded-lg text-xs font-mono overflow-x-auto">
                {generateSnippet()}
              </pre>
            </div>

            {/* Live Response Panel */}
            {execResult && (
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-900">
                    {language === 'zh' ? '响应结果' : 'Response'} [{execResult.status} {execResult.statusText}]
                  </span>
                  <span className="font-mono text-gray-500">{execResult.latency_ms}ms</span>
                </div>

                {execResult.audio_base64 && (
                  <audio src={`data:audio/mpeg;base64,${execResult.audio_base64}`} controls className="w-full h-8" />
                )}

                <pre className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-gray-800 max-h-48 overflow-y-auto">
                  {JSON.stringify(execResult.body || execResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
