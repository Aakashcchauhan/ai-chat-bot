import React, { useState, useEffect, useRef } from 'react';
import { Settings, Code2, MessageSquare, BookOpen, Map, Sparkles, LogOut, User as UserIcon, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { chatAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export const ChatHeader = ({
  selectedLanguage,
  onLanguageChange,
  selectedMode,
  onModeChange,
  user,
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
    { id: 'code', label: 'Code Generator', icon: Code2 },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'explain', label: 'Explain', icon: BookOpen },
    { id: 'roadmap', label: 'Roadmap', icon: Map },
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
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-start md:items-center justify-between py-3 md:py-4">
            {/* Logo and Brand */}
            <div className="flex flex-col gap-2 min-w-0 flex-1">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg sm:rounded-xl blur opacity-50"></div>
                  <div className="relative bg-gradient-to-br from-primary-500 to-primary-600 p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl shadow-lg">
                    <Sparkles className="text-white" size={18} />
                  </div>
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent truncate">
                    AI Code Generator
                  </h1>
                  <p className="hidden sm:block text-xs text-gray-500 dark:text-gray-400">
                    Powered by Gemini AI
                  </p>
                </div>
              </div>
              
              {/* Mode Selector - Below Logo on screens less than lg */}
              <nav className="flex lg:hidden items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
                {modes.map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => onModeChange(mode.id)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
                        selectedMode === mode.id
                          ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      )}
                      aria-label={mode.label}
                      aria-current={selectedMode === mode.id ? 'page' : undefined}
                    >
                      <Icon size={16} />
                      <span>{mode.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Desktop Controls */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Mode Selector - On lg screens and above, show on right side */}
              <nav className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                {modes.map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => onModeChange(mode.id)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
                        selectedMode === mode.id
                          ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      )}
                      aria-label={mode.label}
                      aria-current={selectedMode === mode.id ? 'page' : undefined}
                    >
                      <Icon size={16} />
                      <span>{mode.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="w-px h-6 bg-gray-300 dark:bg-gray-700"></div>

              {/* Settings */}
              <div className="relative" ref={settingsRef}>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={cn(
                    'p-2.5 rounded-lg transition-all duration-200',
                    'hover:bg-gray-100 dark:hover:bg-gray-800',
                    showSettings && 'bg-gray-100 dark:bg-gray-800'
                  )}
                  aria-label="Settings"
                  aria-expanded={showSettings}
                >
                  <Settings size={20} className="text-gray-600 dark:text-gray-400" />
                </button>

                {showSettings && (
                  <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-3 px-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Settings
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Programming Language
                        </label>
                        <select
                          value={selectedLanguage}
                          onChange={(e) => onLanguageChange(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          {languages.map((lang) => (
                            <option key={lang.id} value={lang.id}>
                              {lang.icon} {lang.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="w-px h-6 bg-gray-300 dark:bg-gray-700"></div>

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200',
                    'hover:bg-gray-100 dark:hover:bg-gray-800',
                    showUserMenu && 'bg-gray-100 dark:bg-gray-800'
                  )}
                  aria-label="User menu"
                  aria-expanded={showUserMenu}
                >
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User avatar'}
                      className="w-8 h-8 rounded-full ring-2 ring-gray-200 dark:ring-gray-700"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold text-sm ring-2 ring-gray-200 dark:ring-gray-700">
                      {getUserInitials()}
                    </div>
                  )}
                  <ChevronDown size={16} className={cn(
                    'text-gray-500 dark:text-gray-400 transition-transform',
                    showUserMenu && 'rotate-180'
                  )} />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {user?.displayName || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {user?.email}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => {
                        signOut();
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile/Tablet Controls - Show on screens less than lg */}
            <div className="lg:hidden flex items-center gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Settings"
              >
                <Settings size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
              
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="User menu"
              >
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User avatar'}
                    className="w-8 h-8 rounded-full ring-2 ring-gray-200 dark:ring-gray-700"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold text-sm">
                    {getUserInitials()}
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Settings Panel - Show on screens less than lg */}
          {showSettings && (
            <div className="lg:hidden py-4 border-t border-gray-200 dark:border-gray-800">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Programming Language
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => onLanguageChange(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {languages.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.icon} {lang.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </header>

      {/* Mobile User Menu Dropdown */}
      {showUserMenu && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/20 backdrop-blur-sm" onClick={() => setShowUserMenu(false)}>
          <div className="absolute top-16 right-4 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {user?.displayName || 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                {user?.email}
              </p>
            </div>
            
            <button
              onClick={() => {
                signOut();
                setShowUserMenu(false);
              }}
              className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </>
  );
};