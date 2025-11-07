'use client';

import React, { useEffect, useState } from 'react';
import { Code2, MessageSquare, BookOpen, Map, X } from 'lucide-react';




export const ModeNotification = ({ mode, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getModeInfo = (mode) => {
    switch (mode) {
      case 'code':
        return {
          icon: <Code2 className="h-5 w-5" />,
          label: 'Code Generator',
          subtitle: 'Generating code for you',
          color: 'from-blue-500 to-cyan-500',
        };
      case 'chat':
        return {
          icon: <MessageSquare className="h-5 w-5" />,
          label: 'Chat',
          subtitle: 'Ready for conversation',
          color: 'from-green-500 to-emerald-500',
        };
      case 'explain':
        return {
          icon: <BookOpen className="h-5 w-5" />,
          label: 'Explain',
          subtitle: 'Breaking down concepts',
          color: 'from-purple-500 to-pink-500',
        };
      case 'roadmap':
        return {
          icon: <Map className="h-5 w-5" />,
          label: 'Roadmap',
          subtitle: 'Creating visual learning path',
          color: 'from-orange-500 to-red-500',
        };
      default:
        return {
          icon: <MessageSquare className="h-5 w-5" />,
          label: 'Chat',
          subtitle: 'Auto-detected',
          color: 'from-gray-500 to-gray-600',
        };
    }
  };

  const modeInfo = getModeInfo(mode);

  return (
    <div
      className={`
        fixed top-20 right-4 z-50
        transition-all duration-300 transform
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4 min-w-[280px]">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-gradient-to-r ${modeInfo.color} text-white`}>
            {modeInfo.icon}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Redirected to {modeInfo.label}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {modeInfo.subtitle}
            </p>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

