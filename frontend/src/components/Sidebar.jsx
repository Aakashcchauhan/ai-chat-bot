'use client';

import React, { useState, useEffect } from 'react';
import { Plus, MessageSquare, Trash2, X, Menu, Code2, BookOpen, Map } from 'lucide-react';






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

  return (
    <>
      {/* Overlay - Show on mobile when open */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={onToggle}
        />
      )}

      {/* Toggle Button - Show when closed on ALL viewports */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className={`
            fixed z-50 p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-lg 
            transition-all hover:scale-105 active:scale-95
            ${isMobile ? 'top-[5.5rem] left-4' : 'top-4 left-4'}
          `}
          aria-label="Open sidebar"
          title="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-full
          bg-white/95 dark:bg-gray-900/95 backdrop-blur-md
          border-r border-gray-200 dark:border-gray-800
          shadow-2xl
          transition-all duration-300 z-50
          ${isOpen ? 'w-80 translate-x-0 opacity-100' : 'w-0 -translate-x-full opacity-0 pointer-events-none'}
        `}
      >
        {/* Show content only when open */}
        {isOpen && (
          <div className="flex flex-col h-full w-80">
            {/* Header */}
            <div className="p-5 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Chat History
                </h2>
                {/* Close button - Show on ALL viewports */}
                <button
                  onClick={onToggle}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  aria-label="Close sidebar"
                  title="Close sidebar"
                >
                  <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                {getModeIcon(currentMode)}
                <span className="font-medium">{getModeLabel(currentMode)}</span>
              </div>
            </div>

            {/* New Chat Button */}
            <div className="p-5">
              <button
                onClick={() => {
                  onNewChat();
                  if (isMobile) onToggle();
                }}
                className="w-full btn-primary shadow-md hover:shadow-lg"
              >
                <Plus className="h-5 w-5" />
                <span className="font-medium">New Chat</span>
              </button>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-3 space-y-1">
                {chats.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                    No chat history yet
                  </div>
                ) : (
                  chats.map((chat) => (
                    <div
                      key={chat.id}
                      className={`
                        group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer
                        transition-all duration-200
                        ${
                          activeChat === chat.id
                            ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-600'
                            : 'hover:bg-gray-100/70 dark:hover:bg-gray-800/70'
                        }
                      `}
                    >
                      <MessageSquare className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <div 
                        className="flex-1 min-w-0"
                        onClick={() => {
                          onSelectChat(chat.id);
                          if (isMobile) onToggle();
                        }}
                      >
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {chat.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {chat.preview}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {formatTimestamp(chat.timestamp)}
                        </div>
                      </div>
                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChat(chat.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all flex-shrink-0"
                        aria-label="Delete chat"
                      >
                        <Trash2 className="h-4 w-4 text-red-500 hover:text-red-600" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
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

