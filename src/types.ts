// TypeScript Interfaces for ElevenLabs Voice Platform

export interface ApiStatus {
  configured: boolean;
  mode: 'api' | 'simulator';
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

export interface HistoryItem {
  id: string;
  text: string;
  voice_id: string;
  voice_name: string;
  model_id: string;
  model_name: string;
  voice_settings: VoiceSettings;
  timestamp: number;
  audioUrl?: string;
  duration?: number;
  latency?: number;
  fileSize?: string;
  rating: number;
  comment: string;
  source?: 'tts' | 'sts' | 'design'; // source of generation
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
  voice_id: string;
  voice_name: string;
  model_id: string;
  text: string;
  date_unix: number;
  character_count_change_from: number;
  character_count_change_to: number;
  content_type: string;
  state: string;
}
