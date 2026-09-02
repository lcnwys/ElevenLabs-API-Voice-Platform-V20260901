// TypeScript Interfaces for ElevenLabs Voice Platform

export interface ApiStatus {
  configured: boolean;
  mode: 'api' | 'unconfigured';
  message: string;
}

export interface VoiceModel {
  model_id: string;
  name: string;
  description: string;
  languages: string[];
  cost_factor?: number;
  speed?: string;
  quality?: string;
}

export interface Voice {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
  labels?: Record<string, string>;
  preview_url?: string;
  settings?: VoiceSettings;
}

export interface VoiceSettings {
  stability: number; // 0 to 100 on frontend, 0.0 to 1.0 on API
  similarity_boost: number; // 0 to 100 on frontend, 0.0 to 1.0 on API
  style: number; // 0 to 100 on frontend, 0.0 to 1.0 on API
  use_speaker_boost: boolean;
}

export interface TaskExecutionLog {
  timestamp: string;
  level: 'INFO' | 'DEBUG' | 'WARN' | 'ERROR';
  stage: string;
  message: string;
  duration_ms?: number;
  metadata?: Record<string, any>;
}

export interface HistoryItem {
  id: string;
  history_item_id?: string;
  request_id?: string;
  text: string;
  original_text?: string;
  original_file_name?: string;
  original_file_type?: string;
  original_file_size_bytes?: number;
  original_file_url?: string;
  output_audio_url?: string;
  output_video_url?: string;
  output_subtitles_url?: string;
  voice_id: string;
  voice_name: string;
  model_id: string;
  model_name: string;
  voice_settings: VoiceSettings;
  timestamp: number;
  date_unix?: number;
  audioUrl?: string;
  duration?: number;
  latency?: number;
  latency_ms?: number;
  fileSize?: string;
  billed_characters?: number;
  cost_estimate_usd?: number;
  status?: 'done' | 'processing' | 'failed';
  rating: number;
  comment: string;
  source?: 'tts' | 'sts' | 'dubbing' | 'scribe' | 'isolation' | 'sfx' | 'design' | 'dialogue' | 'music' | 'cloning' | 'pvc';
  source_name_zh?: string;
  logs?: TaskExecutionLog[];
}

export interface ComparisonResult {
  model_id: string;
  model_name: string;
  voice_id: string;
  voice_name: string;
  audioUrl: string;
  latency: number;
  fileSize: string;
  rating: number;
  comment: string;
  voice_settings: VoiceSettings;
  text: string;
}

export interface VoiceDesignParams {
  gender: 'male' | 'female';
  accent: 'american' | 'british' | 'african' | 'australian' | 'indian';
  age: 'young' | 'middle_aged' | 'old';
  accent_strength: number; // 0.3 to 2.0
  text: string;
}

export interface CloudHistoryItem {
  history_item_id: string;
  request_id?: string;
  voice_id: string;
  voice_name: string;
  model_id: string;
  text: string;
  original_text?: string;
  original_file_name?: string;
  original_file_type?: string;
  original_file_size_bytes?: number;
  original_file_url?: string;
  output_audio_url?: string;
  output_video_url?: string;
  output_subtitles_url?: string;
  date_unix: number;
  character_count_change_from: number;
  character_count_change_to: number;
  billed_characters?: number;
  cost_estimate_usd?: number;
  content_type: string;
  state: string;
  source?: string;
  source_name_zh?: string;
  logs?: TaskExecutionLog[];
}

// Enterprise Subscription & Workspace Billing Interfaces
export interface SubscriptionUsage {
  tier: string;
  status: string;
  character_count: number;
  character_limit: number;
  can_extend_character_limit: boolean;
  allowed_to_extend_character_limit: boolean;
  next_character_count_reset_unix: number;
  voice_limit: number;
  professional_voice_limit: number;
  can_extend_voice_limit: boolean;
  can_use_instant_voice_cloning: boolean;
  can_use_professional_voice_cloning: boolean;
  currency: string;
  max_concurrency: number;
  active_concurrency?: number;
  billing_period?: string;
  has_open_invoices?: boolean;
  user_first_name?: string;
  plan_base_fee_usd?: number;
  usage_estimated_value_usd?: number;
  overage_fee_usd?: number;
  total_estimated_spend_usd?: number;
  is_real_data?: boolean;
}

export interface WorkspaceMember {
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: 'admin' | 'member' | 'workspace_admin' | 'financial_admin';
  character_count_used: number;
  character_limit_assigned?: number;
  is_active: boolean;
  joined_at?: string;
  department?: string;
}

export interface WorkspaceGroup {
  group_id: string;
  name: string;
  description: string;
  members_count: number;
  allowed_models: string[];
  max_character_quota: number;
  created_at: string;
}

export interface WorkspaceWebhook {
  webhook_id: string;
  name: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive';
  secret: string;
  created_at: string;
  last_triggered_at?: string;
}

export interface EnterpriseAuditLogItem {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  category: 'TTS' | 'STS' | 'Voice Cloning' | 'Agents' | 'Billing' | 'API Key' | 'Scribe' | 'Dubbing' | 'SFX';
  details: string;
  characters: number;
  cost_usd: number;
  ip_address: string;
  status: 'success' | 'warning' | 'error';
}

export interface ApiEndpointDefinition {
  id: string;
  name: string;
  name_zh: string;
  category: 'generation' | 'processing' | 'agents' | 'workspace';
  method: 'GET' | 'POST' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  description_zh: string;
  defaultPayload: Record<string, any>;
  supportedSdks: ('python' | 'typescript' | 'curl' | 'go' | 'java' | 'browser_stream')[];
}

export interface LiveApiTestResult {
  status: number;
  statusText: string;
  latency_ms: number;
  ttfb_ms: number;
  headers: Record<string, string>;
  contentType: string;
  audioUrl?: string;
  jsonResponse?: any;
  error?: string;
  timestamp: string;
}

export interface ServiceApiKey {
  key_id: string;
  name: string;
  prefix: string;
  type: 'user' | 'service_account' | 'proxy_router' | 'master_account';
  created_at: string;
  last_used_at?: string;
  character_quota: number; // 0 = unlimited
  character_used: number | string;
  department: string;
  status: 'active' | 'revoked' | 'restricted';
  source?: 'elevenlabs_cloud' | 'gateway_proxy' | 'master_account';
  service_account_id?: string;
  raw_secret_key?: string;
  warning_note?: string;
}

export interface CostAttributionItem {
  id: string;
  category: string;
  feature_name?: string;
  model_id: string;
  model_name: string;
  voice_name?: string;
  voice_persona?: string;
  voice_type?: string;
  voice_id?: string;
  department: string;
  characters: number;
  cost_usd: number;
  invocations: number;
  percentage: number;
  rate_per_1k?: number;
  key_scope?: string;
}

export interface ConversationalAgentSummary {
  agent_id: string;
  name: string;
  conversation_config?: {
    agent?: {
      prompt?: {
        prompt?: string;
      };
      first_message?: string;
      language?: string;
    };
    tts?: {
      voice_id?: string;
      model_id?: string;
    };
  };
  created_at_unix?: number;
  last_call_at_unix?: number;
}

// Sound Effects Generation Interface
export interface SoundEffectParams {
  text: string;
  duration_seconds?: number;
  prompt_influence?: number; // 0.0 to 1.0
}

export interface SoundEffectItem {
  id: string;
  text: string;
  duration_seconds: number;
  audioUrl: string;
  created_at: number;
}

// Audio Isolation Interface
export interface AudioIsolationResult {
  id: string;
  filename: string;
  isolatedAudioUrl: string;
  created_at: number;
  originalSize?: number;
}

// Speech to Text (Scribe) Interface
export interface SpeechToTextWord {
  text: string;
  start: number;
  end: number;
  type?: 'word' | 'spacing' | 'audio_event';
}

export interface SpeechToTextResult {
  id: string;
  text: string;
  language_code: string;
  language_probability?: number;
  words?: SpeechToTextWord[];
  audioUrl?: string;
  created_at: number;
}

// Dubbing (Video/Audio Localization) Interface
export interface DubbingProject {
  dubbing_id: string;
  name: string;
  status: 'dubbing' | 'dubbed' | 'failed' | 'in_progress';
  target_languages: string[];
  source_language: string;
  error?: string;
  media_metadata?: {
    content_type?: string;
    duration?: number;
  };
  result_audio_url?: string;
  created_at: number;
}

// Pronunciation Dictionary Interface
export interface PronunciationRule {
  string_to_replace: string;
  rule_type: 'alias' | 'phoneme';
  replacement: string;
  alphabet?: 'ipa' | 'cmu-arpabet';
}

export interface PronunciationDictionary {
  id: string;
  name: string;
  description?: string;
  created_by?: string;
  creation_time_unix?: number;
  version_id?: string;
  rules: PronunciationRule[];
}

export interface MusicGenerationParams {
  prompt: string;
  model_id: 'music_v1' | 'music_v2';
  genre: string;
  mood: string;
  duration_seconds: number;
  is_instrumental: boolean;
  lyrics?: string;
  tempo_bpm?: number;
  key_signature?: string;
  stems_enabled?: boolean;
}

export interface MusicTrackResult {
  id: string;
  title: string;
  prompt: string;
  model_id: string;
  genre: string;
  mood: string;
  duration_seconds: number;
  is_instrumental: boolean;
  audio_url: string;
  stems?: {
    vocals_url?: string;
    drums_url?: string;
    bass_url?: string;
    melody_url?: string;
  };
  created_at: number;
  latency_ms?: number;
  lyrics?: string;
  bpm?: number;
}

// Shared Voice Library (Community Market) Interface
export interface SharedVoice {
  voice_id: string;
  name: string;
  accent?: string;
  gender?: string;
  age?: string;
  category?: string;
  description?: string;
  preview_url?: string;
  usage_characters_count?: number;
  cloned_by_count?: number;
  rate?: number;
}

// Professional Voice Cloning (PVC) & Voice Slots Interfaces
export interface PvcSlot {
  slot_id: string;
  slot_index: number;
  status: 'empty' | 'training' | 'ready' | 'verifying' | 'failed';
  voice_id?: string;
  voice_name?: string;
  speaker_name?: string;
  description?: string;
  fidelity_score?: number; // e.g. 99.4%
  snr_db?: number; // e.g. 38.5 dB
  dataset_duration_seconds?: number; // e.g. 2400 (40 mins)
  dataset_files_count?: number;
  languages_supported?: string[];
  consent_verified?: boolean;
  base_model?: string;
  created_at?: string;
  updated_at?: string;
  preview_audio_url?: string;
  training_progress?: number; // 0 to 100
  training_stage?: string;
}

export interface PvcSlotsOverview {
  total_pvc_slots: number;
  used_pvc_slots: number;
  available_pvc_slots: number;
  total_custom_slots: number;
  used_custom_slots: number;
  can_use_pvc: boolean;
  slots: PvcSlot[];
}
