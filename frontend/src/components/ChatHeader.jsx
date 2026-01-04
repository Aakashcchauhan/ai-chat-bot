import React, { useState, useEffect, useRef } from 'react';
import { Settings, Code2, MessageSquare, BookOpen, Map, Sparkles, LogOut, ChevronDown, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { chatAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export const ChatHeader = ({
  selectedLanguage,
  onLanguageChange,
  selectedMode,
  onModeChange,
  user,
  userApiKey,
  onApiKeyChange,
}) => {
  const [languages, setLanguages] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { signOut } = useAuth();
  
  const settingsRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const langs = await chatAPI.getSupportedLanguages();
        setLanguages(langs);
      } catch (error) {
        console.error('Failed to load languages:', error);
      }
    };
    loadLanguages();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const modes = [
    { id: 'code', label: 'Code', icon: Code2, color: 'from-blue-500 to-cyan-500' },
    { id: 'chat', label: 'Chat', icon: MessageSquare, color: 'from-violet-500 to-purple-500' },
    { id: 'explain', label: 'Explain', icon: BookOpen, color: 'from-amber-500 to-orange-500' },
    { id: 'roadmap', label: 'Roadmap', icon: Map, color: 'from-emerald-500 to-teal-500' },
  ];

  const getUserInitials = () => {
    if (user?.displayName) {
      return user.displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-700/60">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3 md:py-4 gap-4">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-xl blur opacity-40 animate-pulse-slow"></div>
                <div className="relative bg-gradient-to-br from-indigo-500 to-violet-600 p-2 sm:p-2.5 rounded-xl shadow-lg shadow-indigo-500/25">
                  <Sparkles className="text-white w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </div>
              <div className="min-w-0 hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent truncate">
                  AI Code Assistant
                </h1>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span>Powered by Gemini</span>
                </div>
              </div>
            </div>
            
            {/* Mode Selector - Center */}
            <nav className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-1 border border-slate-200/50 dark:border-slate-700/50">
              {modes.map((mode) => {
                const Icon = mode.icon;
                const isActive = selectedMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => onModeChange(mode.id)}
                    className={cn(
                      'relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'text-white shadow-md'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                    )}
                    aria-label={mode.label}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {isActive && (
                      <div className={`absolute inset-0 bg-gradient-to-r ${mode.color} rounded-lg`}></div>
                    )}
                    <Icon size={16} className="relative z-10" />
                    <span className="relative z-10 hidden sm:inline">{mode.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right Controls */}
            <div className="flex items-center gap-2">
              {/* Settings */}
              <div className="relative" ref={settingsRef}>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={cn(
                    'p-2.5 rounded-xl transition-all duration-200',
                    'hover:bg-slate-100 dark:hover:bg-slate-800',
                    showSettings && 'bg-slate-100 dark:bg-slate-800'
                  )}
                  aria-label="Settings"
                  aria-expanded={showSettings}
                >
                  <Settings size={20} className="text-slate-600 dark:text-slate-400" />
                </button>

                {showSettings && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-4 px-5 animate-scale-in z-50">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Settings size={16} className="text-indigo-500" />
                      Settings
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Programming Language
                        </label>
                        <select
                          value={selectedLanguage}
                          onChange={(e) => onLanguageChange(e.target.value)}
                          className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        >
                          {languages.map((lang) => (
                            <option key={lang.id} value={lang.id}>
                              {lang.icon} {lang.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Personal Gemini API Key
                        </label>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                          Optional. Used if the default key fails.
                        </p>
                        <input
                          type="password"
                          value={userApiKey}
                          onChange={(e) => onApiKeyChange?.(e.target.value)}
                          placeholder="AIza..."
                          className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={cn(
                    'flex items-center gap-2 p-1.5 rounded-xl transition-all duration-200',
                    'hover:bg-slate-100 dark:hover:bg-slate-800',
                    showUserMenu && 'bg-slate-100 dark:bg-slate-800'
                  )}
                  aria-label="User menu"
                  aria-expanded={showUserMenu}
                >
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User avatar'}
                      className="w-8 h-8 rounded-xl ring-2 ring-slate-200 dark:ring-slate-700"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-slate-200 dark:ring-slate-700 shadow-sm">
                      {getUserInitials()}
                    </div>
                  )}
                  <ChevronDown size={14} className={cn(
                    'text-slate-500 dark:text-slate-400 transition-transform hidden sm:block',
                    showUserMenu && 'rotate-180'
                  )} />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-scale-in z-50">
                    <div className="px-4 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                      <div className="flex items-center gap-3">
                        {user?.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={user.displayName || 'User avatar'}
                            className="w-12 h-12 rounded-xl ring-2 ring-white dark:ring-slate-700 shadow-md"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg ring-2 ring-white dark:ring-slate-700 shadow-md">
                            {getUserInitials()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {user?.displayName || 'User'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {user?.email}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        signOut();
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
                    >
                      <LogOut size={18} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile User Menu Overlay */}
      {showUserMenu && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-sm" onClick={() => setShowUserMenu(false)}>
          <div className="absolute top-16 right-4 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="px-4 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
              <div className="flex items-center gap-3">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User avatar'}
                    className="w-12 h-12 rounded-xl ring-2 ring-white dark:ring-slate-700 shadow-md"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg ring-2 ring-white dark:ring-slate-700 shadow-md">
                    {getUserInitials()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {user?.displayName || 'User'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => {
                signOut();
                setShowUserMenu(false);
              }}
              className="w-full px-4 py-3 text-left text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </>
  );
};
