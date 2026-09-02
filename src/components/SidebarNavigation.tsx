import React from 'react';
import {
  SlidersHorizontal,
  CloudLightning,
  Mic,
  Sparkles,
  Music2,
  Wand2,
  Scissors,
  FileText,
  Film,
  BookOpen,
  ShoppingBag,
  History,
  Terminal,
  Bot,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Layers,
  Globe,
  Settings,
  X,
  Plus,
  Home,
  Pin,
  ChevronRight,
  Code2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ApiStatus } from '../types';

export type NavTabId =
  | 'workbench'
  | 'tts'
  | 'sts'
  | 'cloning'
  | 'design'
  | 'music'
  | 'sfx'
  | 'isolation'
  | 'scribe'
  | 'dubbing'
  | 'dictionaries'
  | 'market'
  | 'agents'
  | 'enterprise'
  | 'library'
  | 'history';

interface SidebarNavigationProps {
  language: 'zh' | 'en';
  t: any;
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  toggleLanguage: () => void;
  onOpenSettings: () => void;
  apiStatus: ApiStatus;
  customBaseUrl: string;
  customApiKey: string;
}

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  language,
  t,
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  toggleLanguage,
  onOpenSettings,
  apiStatus,
  customBaseUrl,
  customApiKey
}) => {
  // Top primary navigation items
  const mainNavItems = [
    {
      id: 'tts' as NavTabId,
      labelZh: '文本转语音',
      labelEn: 'Text to Speech',
      icon: Home,
      badge: 'PRO'
    },
    {
      id: 'library' as NavTabId,
      labelZh: '声音库 (Voices)',
      labelEn: 'Voices',
      icon: Layers,
      hasAdd: true,
      onAddClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelectTab('cloning');
      }
    },
    {
      id: 'agents' as NavTabId,
      labelZh: 'AI 智能体 (Agents)',
      labelEn: 'Conversational Agents',
      icon: Bot
    },
    {
      id: 'enterprise' as NavTabId,
      labelZh: '企业工作区 (Enterprise)',
      labelEn: 'Enterprise & Billing',
      icon: ShieldCheck
    }
  ];

  // Pinned creative tools
  const pinnedNavItems = [
    {
      id: 'sts' as NavTabId,
      labelZh: '语音转语音 (Voice Changer)',
      labelEn: 'Voice Changer (STS)',
      icon: CloudLightning
    },
    {
      id: 'sfx' as NavTabId,
      labelZh: 'AI 影视音效 (Sound Effects)',
      labelEn: 'Sound Effects',
      icon: Wand2
    },
    {
      id: 'isolation' as NavTabId,
      labelZh: '人声分离提取 (Voice Isolator)',
      labelEn: 'Voice Isolator',
      icon: Scissors
    },
    {
      id: 'music' as NavTabId,
      labelZh: 'AI 音乐生成 (Music)',
      labelEn: 'Music Studio',
      icon: Music2
    },
    {
      id: 'scribe' as NavTabId,
      labelZh: '语音听写识别 (Scribe STT)',
      labelEn: 'Speech to Text (Scribe)',
      icon: FileText
    },
    {
      id: 'dubbing' as NavTabId,
      labelZh: 'AI 视频配音 (Dubbing)',
      labelEn: 'Dubbing Studio',
      icon: Film
    },
    {
      id: 'cloning' as NavTabId,
      labelZh: '声音克隆 (Voice Cloning)',
      labelEn: 'Voice Cloning (PVC)',
      icon: Mic
    },
    {
      id: 'design' as NavTabId,
      labelZh: '声音合成设计 (Voice Design)',
      labelEn: 'Voice Design',
      icon: Sparkles
    },
    {
      id: 'dictionaries' as NavTabId,
      labelZh: '发音规则字典 (Pronunciation)',
      labelEn: 'Pronunciation Dictionaries',
      icon: BookOpen
    },
    {
      id: 'market' as NavTabId,
      labelZh: '全球声音市场 (Voice Market)',
      labelEn: 'Voice Market',
      icon: ShoppingBag
    },
    {
      id: 'history' as NavTabId,
      labelZh: '生成历史 & 评估日志',
      labelEn: 'History & Logs',
      icon: History
    },
    {
      id: 'workbench' as NavTabId,
      labelZh: 'API 开发者工作台',
      labelEn: 'API Workbench',
      icon: Terminal
    }
  ];

  const handleItemClick = (id: NavTabId) => {
    onSelectTab(id);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#fbfbfb] text-gray-800 select-none">
      
      {/* Top Header Logo & Collapse Toggle */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-gray-200/80 shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          {/* ElevenLabs stylized double-bar logo */}
          <div className="flex items-center space-x-1 shrink-0">
            <span className="w-1.5 h-5 bg-black rounded-xs inline-block"></span>
            <span className="w-1.5 h-5 bg-black rounded-xs inline-block"></span>
          </div>

          {!isCollapsed && (
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-bold text-sm tracking-tight text-gray-900 truncate">
                ElevenLabs
              </span>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle Button */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex p-1.5 hover:bg-gray-200/60 rounded-md text-gray-500 hover:text-black transition"
          title={isCollapsed ? (language === 'zh' ? '展开侧边栏' : 'Expand sidebar') : (language === 'zh' ? '折叠侧边栏' : 'Collapse sidebar')}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>

        {/* Mobile Close Button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 hover:bg-gray-200/60 rounded-md text-gray-500 hover:text-black transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-5 scrollbar-thin">
        
        {/* Main Category Suite */}
        <div className="space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const label = language === 'zh' ? item.labelZh : item.labelEn;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                title={isCollapsed ? label : undefined}
                className={`w-full group flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition duration-150 relative ${
                  isActive
                    ? 'bg-black text-white shadow-xs font-semibold'
                    : 'text-gray-700 hover:bg-gray-200/60 hover:text-black'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-gray-600 group-hover:text-black'}`} />
                  {!isCollapsed && (
                    <span className="truncate">{label}</span>
                  )}
                </div>

                {!isCollapsed && item.hasAdd && (
                  <span
                    onClick={item.onAddClick}
                    className={`p-0.5 rounded hover:bg-gray-300/60 transition ${
                      isActive ? 'hover:bg-gray-800 text-gray-300' : 'text-gray-400 hover:text-black'
                    }`}
                    title={language === 'zh' ? '快速克隆新声音' : 'Clone new voice'}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Pinned Tools Section */}
        <div>
          {!isCollapsed && (
            <div className="flex items-center justify-between px-2.5 mb-1.5">
              <span className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase">
                {language === 'zh' ? '固定工具 (Pinned)' : 'Pinned'}
              </span>
            </div>
          )}

          {isCollapsed && (
            <div className="border-t border-gray-200 my-2 mx-1" />
          )}

          <div className="space-y-0.5">
            {pinnedNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const label = language === 'zh' ? item.labelZh : item.labelEn;

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  title={isCollapsed ? label : undefined}
                  className={`w-full group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition duration-150 ${
                    isActive
                      ? 'bg-black text-white font-semibold shadow-xs'
                      : 'text-gray-700 hover:bg-gray-200/60 hover:text-black'
                  } ${isCollapsed ? 'justify-center px-0 py-2' : ''}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-black'}`} />
                    {!isCollapsed && (
                      <span className="truncate text-xs">{label}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Bottom Footer with Workspace, Settings & Language */}
      <div className="p-3 border-t border-gray-200/80 bg-white shrink-0 space-y-2">
        
        {/* Workspace Switcher */}
        {!isCollapsed ? (
          <div className="flex items-center justify-between px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-5 h-5 rounded bg-gradient-to-tr from-amber-500 to-orange-400 shrink-0 flex items-center justify-center text-[10px] font-bold text-white shadow-xs">
                E
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">ElevenCreative</p>
                <div className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${customBaseUrl ? 'bg-blue-500' : apiStatus.configured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span className="text-[10px] text-gray-500 truncate">
                    {customBaseUrl ? 'Custom API' : apiStatus.configured ? 'API Connected' : 'Simulator'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onOpenSettings}
              className="px-2 py-0.5 text-[11px] font-medium bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded transition shadow-xs shrink-0"
            >
              {language === 'zh' ? '设置' : 'Switch'}
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={onOpenSettings}
              className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-400 text-white font-bold text-xs flex items-center justify-center shadow-xs"
              title="ElevenCreative Workspace / Settings"
            >
              E
            </button>
          </div>
        )}

        {/* Language and API Key Quick Actions */}
        <div className={`flex items-center ${isCollapsed ? 'flex-col gap-2' : 'justify-between gap-1'} pt-1`}>
          <button
            onClick={toggleLanguage}
            className={`flex items-center gap-1.5 p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-black text-xs font-medium transition ${
              isCollapsed ? 'justify-center w-full' : ''
            }`}
            title={language === 'zh' ? '切换到 English' : 'Switch to 中文'}
          >
            <Globe className="h-3.5 w-3.5" />
            {!isCollapsed && <span>{language === 'zh' ? 'English' : '中文'}</span>}
          </button>

          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-1.5 p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-black text-xs font-medium transition ${
              isCollapsed ? 'justify-center w-full' : ''
            }`}
            title="API Settings"
          >
            <Settings className="h-3.5 w-3.5" />
            {!isCollapsed && <span>{language === 'zh' ? 'API 密钥' : 'API Key'}</span>}
          </button>
        </div>

      </div>

    </div>
  );

  return (
    <>
      {/* 1. Desktop Persistent Sidebar */}
      <aside
        id="desktop_sidebar"
        className={`hidden lg:block h-screen sticky top-0 shrink-0 border-r border-gray-200 bg-[#fbfbfb] transition-all duration-200 z-30 ${
          isCollapsed ? 'w-[68px]' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* 2. Mobile Drawer Sidebar Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={onCloseMobile}
          />
          
          {/* Slide-out Drawer Panel */}
          <aside className="relative w-72 max-w-[80vw] h-full bg-[#fbfbfb] shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
