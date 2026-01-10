'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChatHeader } from '@/components/ChatHeader';
import { ChatMessages } from '@/components/ChatMessages';
import { ChatInput } from '@/components/ChatInput';
import { Sidebar } from '@/components/Sidebar';
import { ModeNotification } from '@/components/ModeNotification';
import { chatAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function Home() {
  // ---------------------------------------------------------------------------
  // STATE MANAGEMENT
  // ---------------------------------------------------------------------------
  
  // Chat state
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // UI state
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [selectedMode, setSelectedMode] = useState('code');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showModeNotification, setShowModeNotification] = useState(false);
  const [notificationMode, setNotificationMode] = useState('code');
  const [userApiKey, setUserApiKey] = useState('');
  
  // Auth
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // ---------------------------------------------------------------------------
  // REFS FOR AUTO-SWITCHING (Prevents Race Conditions)
  // ---------------------------------------------------------------------------
  
  const modeStateRef = useRef({ current: 'code', target: 'code', isSwitching: false });
  const pendingMessageRef = useRef(null);
  const sendMessageRef = useRef(null); // Ref to hold the send function
  const selectedModeRef = useRef('code');

  // Keep refs in sync with state to avoid stale closures during mode transitions
  useEffect(() => {
    selectedModeRef.current = selectedMode;
    modeStateRef.current.current = selectedMode;
  }, [selectedMode]);

  // ---------------------------------------------------------------------------
  // AUTHENTICATION EFFECTS
  // ---------------------------------------------------------------------------
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // ---------------------------------------------------------------------------
  // LOAD USER API KEY
  // ---------------------------------------------------------------------------
  
  useEffect(() => {
    if (!user) return;
    const storedKey = localStorage.getItem(`custom_api_key_${user.uid}`);
    if (storedKey) {
      setUserApiKey(storedKey);
    }
  }, [user]);

  // ---------------------------------------------------------------------------
  // KEYBOARD SHORTCUTS
  // ---------------------------------------------------------------------------
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ---------------------------------------------------------------------------
  // CHAT MANAGEMENT HELPERS
  // ---------------------------------------------------------------------------
  
  const handleApiKeyChange = (value) => {
    setUserApiKey(value);
    if (user) {
      localStorage.setItem(`custom_api_key_${user.uid}`, value);
    }
  };

  const generateChatTitle = (msgs) => {
    const firstUserMessage = msgs.find((m) => m.role === 'user');
    if (firstUserMessage) {
      const title = firstUserMessage.content.substring(0, 30);
      return title + (firstUserMessage.content.length > 30 ? '...' : '');
    }
    return 'New Chat';
  };

  // ---------------------------------------------------------------------------
  // SAVE CHATS HELPER
  // ---------------------------------------------------------------------------
  
  const saveChatsToStorage = useCallback((updatedChats, mode) => {
    try {
      localStorage.setItem(
        `chats_${user?.uid}_${mode}`,
        JSON.stringify(updatedChats)
      );
    } catch (error) {
      console.error('Failed to save chats:', error);
    }
  }, [user?.uid]);

  // ---------------------------------------------------------------------------
  // MODE DETECTION - DYNAMIC TAB SWITCHING ENGINE
  // ---------------------------------------------------------------------------
  const modePatterns = useMemo(() => ({
    roadmap: [
      /\broadmap\b/,
      /\broad\s*map\b/,
      /\blearning\s*path\b/,
      /\bstudy\s*plan\b/,
      /\bcurriculum\b/,
      /\bsyllabus\b/,
      /\bcourse\s*(plan|outline|path)\b/,
      /\bcareer\s*path\b/,
      /\bmodule\s+\d+/,
      /\bweek\s+\d+/,
      /\btimeline\b/,
      /\bmilestone\b/,
      /\broadmap\s*(for|to)\b/,
      /\bplan\s*(to|for)\s*learn/,
      /\bcreate\s*(a\s*)?(learning\s*)?(plan|path|roadmap)/,
      /\bmake\s*(me\s*)?(a\s*)?roadmap/,
      /\bgenerate\s*(a\s*)?roadmap/,
      /\bbuild\s*(a\s*)?roadmap/,
      /\bstudy\s*(journey|guide)/,
      /\blearning\s*(journey|guide)/,
      /\bcomplete\s*(guide|path)\s*(to|for)/,
      /\bbeginner\s*(to|into)\s*(expert|pro)/,
    ],
    code: [
      /\bwrite\s*(me\s*)?(a\s*)?(the\s*)?(code|function|program|script|class)\b/,
      /\bcreate\s*(a\s*)?(the\s*)?(function|class|program|snippet)\b/,
      /\bgenerate\s*(a\s*)?(code|function|snippet)\b/,
      /\bimplement\s+(a\s*)?(the\s*)?\w+/,
      /\bmake\s*(me\s*)?(a\s*)?(the\s*)?(function|script)\b/,
      /\bcode\s*(for|to)\b/,
      /\bfunction\s*(to|that|for)\b/,
      /\bclass\s*(to|that|for)\b/,
      /\balgorithm\s*(for|to)\b/,
      /\bscript\s*(to|that|for)\b/,
      /\bprogram\s*(to|that|for)\b/,
      /\bsolve\s*(this\s*)?(problem|challenge)/,
      /\bdebug\s*(this|my)/,
      /\bfix\s*(this|my)\s*(code|bug|error)/,
      /\brefactor\s*(this|my)/,
      /\boptimize\s*(this|my)/,
      /\bunit\s*test\b/,
      /\btest\s*(cases|suite)/,
      /\bexample\s*code\b/,
      /\bcode\s*snippet\b/,
      /\bapi\s*endpoint\b/,
      /\bregex\s*(for|to)\b/,
      /\bquery\s*(for|to)\b/,
      /\bsql\s*(query|script)/,
      /\bmigration\s*script\b/,
      /\bdockerfile\b/,
      /\bterraform\b/,
      /\bstack\s*trace\b/,
      /\bcompiler\s*error\b/,
      /\bTypeScript\s*types?\b/,
      /\binterface\s*definition\b/,
    ],
    explain: [
      /\bexplain\b/,
      /\bwalk\s*me\s*through\b/,
      /\bwhat\s*(is|are|does|do)\b/,
      /\bhow\s*(does|do|is|are)\b/,
      /\bwhy\s*(does|do|is|are)\b/,
      /\bdescribe\b/,
      /\btell\s*me\s*(about|what)\b/,
      /\bdifference\s*between\b/,
      /\bwhat's\s*the\s*difference\b/,
      /\bcan\s*you\s*explain\b/,
      /\bhelp\s*me\s*understand\b/,
      /\bwhat\s*does\s*.*\s*mean\b/,
      /\bdefine\b/,
      /\bmeaning\s*of\b/,
      /\bconcept\s*of\b/,
      /\bhow\s*to\s*use\b/,
      /\bwhen\s*(to|should\s*i)\s*use\b/,
      /\bcompare\b/,
      /\bpros\s*and\s*cons\b/,
      /\bexplain\s*this\s*code\b/,
      /\bline\s*by\s*line\b/,
      /\bwhy\s*do\s*i\s*get\s*this\s*error\b/,
    ],
  }), []);
  
  const detectAppropriateMode = useCallback((message) => {
    const lowerMessage = message.toLowerCase().trim();
    const matchesAny = (patterns) => patterns.some((pattern) => pattern.test(lowerMessage));

    if (matchesAny(modePatterns.roadmap)) {
      console.log('🗺️ Detected: Roadmap mode - Auto-switching to Roadmap tab');
      return 'roadmap';
    }

    if (matchesAny(modePatterns.code)) {
      console.log('💻 Detected: Code mode');
      return 'code';
    }

    if (matchesAny(modePatterns.explain)) {
      console.log('📖 Detected: Explain mode');
      return 'explain';
    }

    console.log('💬 Detected: Chat mode (default)');
    return 'chat';
  }, [modePatterns]);

  // ---------------------------------------------------------------------------
  // SEND MESSAGE TO API (Core Function)
  // ---------------------------------------------------------------------------
  
  const sendMessageToAPI = useCallback(async (messageContent, mode, conversationHistory, currentChats) => {
    // Create user message
    const userMessage = {
      role: 'user',
      content: messageContent,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...conversationHistory, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Send to API
      const response = await chatAPI.sendMessage({
        message: messageContent,
        conversation_history: conversationHistory,
        language: selectedLanguage,
        mode: mode,
      }, userApiKey);

      // Create assistant response
      const assistantMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: response.timestamp,
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);

      // Update or create chat
      const newChat = {
        id: Date.now().toString(),
        title: generateChatTitle(finalMessages),
        timestamp: new Date().toISOString(),
        preview: finalMessages[finalMessages.length - 1]?.content.substring(0, 50) || '',
        messages: finalMessages,
        mode: mode,
      };
      
      const updatedChats = [newChat, ...currentChats];
      setChats(updatedChats);
      setActiveChat(newChat.id);
      saveChatsToStorage(updatedChats, mode);

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Create error message
      const errorMessage = {
        role: 'assistant',
        content: '❌ Sorry, I encountered an error. Please make sure the backend server is running and try again.',
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...newMessages, errorMessage];
      setMessages(finalMessages);
    } finally {
      setIsLoading(false);
    }
  }, [selectedLanguage, userApiKey, saveChatsToStorage]);

  const flushPendingMessage = useCallback((loadedChats = chats) => {
    const pending = pendingMessageRef.current;

    if (!pending) {
      modeStateRef.current.isSwitching = false;
      return;
    }

    if (pending.mode !== selectedMode) {
      return;
    }

    const history = pending.conversationHistory || [];
    const chatSnapshot = pending.chatsSnapshot || loadedChats;

    pendingMessageRef.current = null;
    modeStateRef.current.isSwitching = false;

    if (sendMessageRef.current) {
      console.log(`📤 Sending pending message in ${selectedMode} mode`);
      sendMessageRef.current(pending.content, selectedMode, history, chatSnapshot);
    }
  }, [selectedMode, chats]);

  // Store the send function in ref for use in useEffect
  useEffect(() => {
    sendMessageRef.current = sendMessageToAPI;
  }, [sendMessageToAPI]);

  // ---------------------------------------------------------------------------
  // CHAT PERSISTENCE - Load chats when mode changes
  // ---------------------------------------------------------------------------
  
  useEffect(() => {
    if (!user) return;
    
    const savedChats = localStorage.getItem(`chats_${user.uid}_${selectedMode}`);
    let loadedChats = [];
    
    if (savedChats) {
      try {
        loadedChats = JSON.parse(savedChats);
        setChats(loadedChats);
      } catch (error) {
        console.error('Failed to load chats:', error);
        setChats([]);
      }
    } else {
      setChats([]);
    }

    const switchingWithPending = modeStateRef.current.isSwitching && pendingMessageRef.current;

    if (!switchingWithPending) {
      setActiveChat(null);
      setMessages([]);
      modeStateRef.current.isSwitching = false;
    }

    flushPendingMessage(loadedChats);
  }, [user, selectedMode, flushPendingMessage]);

  // ---------------------------------------------------------------------------
  // CHAT MANAGEMENT HANDLERS
  // ---------------------------------------------------------------------------
  
  const createNewChat = useCallback(() => {
    const newChat = {
      id: Date.now().toString(),
      title: 'New Chat',
      timestamp: new Date().toISOString(),
      preview: 'No messages yet',
      messages: [],
      mode: selectedMode,
    };

    const updatedChats = [newChat, ...chats];
    setChats(updatedChats);
    saveChatsToStorage(updatedChats, selectedMode);
    setActiveChat(newChat.id);
    setMessages([]);
  }, [chats, selectedMode, saveChatsToStorage]);

  const selectChat = useCallback((chatId) => {
    const chat = chats.find((c) => c.id === chatId);
    if (chat) {
      setActiveChat(chatId);
      setMessages(chat.messages || []);
    }
  }, [chats]);

  const deleteChat = useCallback((chatId) => {
    const updatedChats = chats.filter((c) => c.id !== chatId);
    setChats(updatedChats);
    saveChatsToStorage(updatedChats, selectedMode);
    
    if (activeChat === chatId) {
      if (updatedChats.length > 0) {
        selectChat(updatedChats[0].id);
      } else {
        setActiveChat(null);
        setMessages([]);
      }
    }
  }, [chats, activeChat, selectedMode, saveChatsToStorage, selectChat]);

  // ---------------------------------------------------------------------------
  // MODE CHANGE HANDLER (Manual Tab Click)
  // ---------------------------------------------------------------------------
  
  const handleModeChange = useCallback((newMode) => {
    if (newMode === selectedMode) return;

    modeStateRef.current.target = newMode;
    modeStateRef.current.isSwitching = Boolean(pendingMessageRef.current);

    setSelectedMode(newMode);
    setActiveChat(null);
    setMessages([]);
  }, [selectedMode]);

  // ---------------------------------------------------------------------------
  // MAIN MESSAGE HANDLER - With Dynamic Tab Switching
  // ---------------------------------------------------------------------------
  
  const handleSendMessage = useCallback(async (messageContent) => {
    const trimmedMessage = messageContent.trim();
    if (!trimmedMessage) return;

    const suggestedMode = detectAppropriateMode(trimmedMessage);

    // If a mode switch is already in progress, update the pending payload and bail early
    if (modeStateRef.current.isSwitching) {
      pendingMessageRef.current = {
        content: trimmedMessage,
        mode: suggestedMode,
        conversationHistory: [],
        chatsSnapshot: chats,
      };
      modeStateRef.current.target = suggestedMode;
      return;
    }

    // Auto-switch when the suggestion differs from the current tab
    if (suggestedMode !== selectedMode) {
      console.log(`🔄 Auto-switching from "${selectedMode}" to "${suggestedMode}"`);

      modeStateRef.current.isSwitching = true;
      modeStateRef.current.target = suggestedMode;
      pendingMessageRef.current = {
        content: trimmedMessage,
        mode: suggestedMode,
        conversationHistory: [],
        chatsSnapshot: chats,
      };

      setNotificationMode(suggestedMode);
      setShowModeNotification(true);
      setSelectedMode(suggestedMode);
      return;
    }

    // Send immediately when no switch is necessary
    modeStateRef.current.isSwitching = false;
    pendingMessageRef.current = null;
    console.log(`📤 Sending message in current "${selectedMode}" mode`);
    sendMessageToAPI(trimmedMessage, selectedMode, messages, chats);
  }, [selectedMode, messages, chats, detectAppropriateMode, sendMessageToAPI]);

  // ---------------------------------------------------------------------------
  // SUGGESTION CLICK HANDLER
  // ---------------------------------------------------------------------------
  
  const handleSuggestionClick = useCallback((prompt) => {
    handleSendMessage(prompt);
  }, [handleSendMessage]);

  // ---------------------------------------------------------------------------
  // RENDER - LOADING STATE
  // ---------------------------------------------------------------------------
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center animate-fade-in">
          <div className="relative inline-flex">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl blur-xl opacity-30 animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-primary-500 to-accent-600 p-4 rounded-2xl shadow-glow">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
            </div>
          </div>
          <p className="mt-6 text-slate-600 dark:text-slate-400 font-medium">
            Loading your workspace...
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER - AUTH CHECK
  // ---------------------------------------------------------------------------
  
  if (!user) {
    return null;
  }

  // ---------------------------------------------------------------------------
  // RENDER - MAIN UI
  // ---------------------------------------------------------------------------
  
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {/* Mode Switch Notification */}
      {showModeNotification && (
        <ModeNotification
          mode={notificationMode}
          onClose={() => setShowModeNotification(false)}
        />
      )}
      
      {/* Sidebar */}
      <Sidebar
        chats={chats}
        activeChat={activeChat}
        onSelectChat={selectChat}
        onNewChat={createNewChat}
        onDeleteChat={deleteChat}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        currentMode={selectedMode}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header with Mode Tabs */}
        <ChatHeader
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
          selectedMode={selectedMode}
          onModeChange={handleModeChange}
          user={user}
          userApiKey={userApiKey}
          onApiKeyChange={handleApiKeyChange}
        />
        
        {/* Messages Display */}
        <ChatMessages
          messages={messages}
          isLoading={isLoading}
          onSuggestionClick={handleSuggestionClick}
        />
        
        {/* Input Area */}
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

