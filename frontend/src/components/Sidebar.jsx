'use client';

import React, { useState, useEffect } from 'react';
import { Plus, MessageSquare, Trash2, X, Menu, Code2, BookOpen, Map, Sparkles } from 'lucide-react';

export const Sidebar = ({
  chats,
  activeChat,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  isOpen,
  onToggle,
  currentMode,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getModeIcon = (mode) => {
    switch (mode) {
      case 'code':
        return <Code2 className="h-4 w-4" />;
      case 'chat':
        return <MessageSquare className="h-4 w-4" />;
      case 'explain':
        return <BookOpen className="h-4 w-4" />;
      case 'roadmap':
        return <Map className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getModeLabel = (mode) => {
    switch (mode) {
      case 'code':
        return 'Code Generator';
      case 'chat':
        return 'Chat';
      case 'explain':
        return 'Explain';
      case 'roadmap':
        return 'Roadmap';
      default:
        return 'Chat';
    }
  };

  const getModeColor = (mode) => {
    switch (mode) {
      case 'code':
        return 'from-blue-500 to-cyan-500';
      case 'chat':
        return 'from-violet-500 to-purple-500';
      case 'explain':
        return 'from-amber-500 to-orange-500';
      case 'roadmap':
        return 'from-emerald-500 to-teal-500';
      default:
        return 'from-primary-500 to-accent-500';
    }
  };

  return (
    <>
      {/* Overlay - Show on mobile when open */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 backdrop-blur-sm animate-fade-in"
          onClick={onToggle}
        />
      )}

      {/* Toggle Button - Show when closed on ALL viewports */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className={`
            fixed z-50 p-3 rounded-xl shadow-lg 
            bg-gradient-to-r from-primary-600 to-accent-600
            hover:from-primary-700 hover:to-accent-700
            text-white
            transition-all duration-300 hover:scale-105 active:scale-95
            shadow-primary-500/25 hover:shadow-primary-500/40
            ${isMobile ? 'top-[5.5rem] left-4' : 'top-4 left-4'}
          `}
          aria-label="Open sidebar"
          title="Open sidebar (Ctrl+B)"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50
          bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl
          border-r border-slate-200/60 dark:border-slate-700/60
          shadow-2xl shadow-slate-900/10 dark:shadow-black/30
          transition-all duration-300 ease-out
          ${isOpen ? 'w-80 translate-x-0 opacity-100' : 'w-0 -translate-x-full opacity-0 pointer-events-none'}
        `}
      >
        {/* Show content only when open */}
        {isOpen && (
          <div className="flex flex-col h-full w-80 animate-slide-in-left">
            {/* Header */}
            <div className="p-5 border-b border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl blur opacity-40"></div>
                    <div className="relative bg-gradient-to-br from-primary-500 to-accent-600 p-2 rounded-xl">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Chat History
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Your conversations
                    </p>
                  </div>
                </div>
                {/* Close button */}
                <button
                  onClick={onToggle}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  aria-label="Close sidebar"
                  title="Close sidebar (Ctrl+B)"
                >
                  <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                </button>
              </div>
              
              {/* Current Mode Badge */}
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r ${getModeColor(currentMode)} text-white shadow-sm`}>
                {getModeIcon(currentMode)}
                <span>{getModeLabel(currentMode)}</span>
              </div>
            </div>

            {/* New Chat Button */}
            <div className="p-4">
              <button
                onClick={() => {
                  onNewChat();
                  if (isMobile) onToggle();
                }}
                className="w-full btn-primary py-3 shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30"
              >
                <Plus className="h-5 w-5" />
                <span className="font-semibold">New Chat</span>
              </button>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto px-3 pb-4">
              <div className="space-y-1">
                {chats.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-3">
                      <MessageSquare className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      No conversations yet
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Start a new chat to begin
                    </p>
                  </div>
                ) : (
                  chats.map((chat) => (
                    <div
                      key={chat.id}
                      className={`
                        group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer
                        transition-all duration-200
                        ${
                          activeChat === chat.id
                            ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500 shadow-sm'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }
                      `}
                    >
                      <div className={`
                        flex-shrink-0 p-2 rounded-lg
                        ${activeChat === chat.id 
                          ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}
                      `}>
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <div 
                        className="flex-1 min-w-0"
                        onClick={() => {
                          onSelectChat(chat.id);
                          if (isMobile) onToggle();
                        }}
                      >
                        <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {chat.title}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {chat.preview}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
                          {formatTimestamp(chat.timestamp)}
                        </div>
                      </div>
                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChat(chat.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all flex-shrink-0"
                        aria-label="Delete chat"
                      >
                        <Trash2 className="h-4 w-4 text-red-500 hover:text-red-600" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-slate-200/60 dark:border-slate-700/60">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
                Powered by Gemini AI
              </p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return 'Today';
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return `${days} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}

