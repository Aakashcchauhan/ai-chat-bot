'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  
  const isAutoSwitching = useRef(false);
  const pendingMessage = useRef(null);
  const sendMessageRef = useRef(null); // Ref to hold the send function

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
  
  const detectAppropriateMode = useCallback((message) => {
    const lowerMessage = message.toLowerCase().trim();
    
    // -------------------------------------------------------------------------
    // ROADMAP DETECTION (Highest Priority)
    // -------------------------------------------------------------------------
    const roadmapPatterns = [
      // Direct roadmap mentions
      /\broadmap\b/,
      /\blearning\s*path\b/,
      /\bstudy\s*plan\b/,
      /\bcurriculum\b/,
      /\bcourse\s*path\b/,
      /\bcareer\s*path\b/,
      /\blearning\s*journey\b/,
      /\blearning\s*guide\b/,
      /\bstudy\s*guide\b/,
      
      // Action phrases for roadmap creation
      /create\s*(a\s*)?roadmap/,
      /make\s*(a\s*)?roadmap/,
      /generate\s*(a\s*)?roadmap/,
      /build\s*(a\s*)?roadmap/,
      /show\s*(me\s*)?(a\s*)?roadmap/,
      /give\s*(me\s*)?(a\s*)?roadmap/,
      /need\s*(a\s*)?roadmap/,
      /want\s*(a\s*)?roadmap/,
      
      // Learning intent patterns
      /how\s*(to|do\s*i)\s*(start\s*)?learn/,
      /guide\s*to\s*learn/,
      /where\s*(to|should\s*i)\s*start\s*learning/,
      /what\s*should\s*i\s*learn/,
      /step\s*by\s*step\s*(guide|plan|path)/,
      /learning\s*resource/,
      /become\s*(a\s*)?(.*?)\s*developer/,
      /path\s*to\s*(become|learn)/,
      /journey\s*to\s*learn/,
      /master\s*(.*?)\s*from\s*scratch/,
      /complete\s*(guide|path)\s*(to|for)/,
    ];
    
    if (roadmapPatterns.some(pattern => pattern.test(lowerMessage))) {
      console.log('🗺️ Detected: Roadmap mode - Auto-switching to Roadmap tab');
      return 'roadmap';
    }
    
    // -------------------------------------------------------------------------
    // CODE GENERATION DETECTION
    // -------------------------------------------------------------------------
    const codePatterns = [
      // Direct code requests
      /\bwrite\s*(me\s*)?(a\s*)?(the\s*)?code\b/,
      /\bwrite\s*(me\s*)?(a\s*)?(the\s*)?function\b/,
      /\bwrite\s*(me\s*)?(a\s*)?(the\s*)?program\b/,
      /\bwrite\s*(me\s*)?(a\s*)?(the\s*)?script\b/,
      /\bwrite\s*(me\s*)?(a\s*)?(the\s*)?class\b/,
      /\bcreate\s*(a\s*)?(the\s*)?function\b/,
      /\bcreate\s*(a\s*)?(the\s*)?class\b/,
      /\bcreate\s*(a\s*)?(the\s*)?program\b/,
      /\bgenerate\s*(a\s*)?(the\s*)?code\b/,
      /\bimplement\s+(a\s*)?(the\s*)?\w+/,
      /\bmake\s*(me\s*)?(a\s*)?(the\s*)?function\b/,
      
      // Code-related task patterns
      /\bcode\s*(for|to)\b/,
      /\bfunction\s*(to|that|for)\b/,
      /\bclass\s*(to|that|for)\b/,
      /\balgorithm\s*(for|to)\b/,
      /\bscript\s*(to|that|for)\b/,
      /\bprogram\s*(to|that|for)\b/,
      
      // Programming task patterns
      /\bsolve\s*(this\s*)?(problem|challenge)/,
      /\bdebug\s*(this|my)/,
      /\bfix\s*(this|my)\s*code/,
      /\brefactor\s*(this|my)/,
      /\boptimize\s*(this|my)/,
    ];
    
    if (codePatterns.some(pattern => pattern.test(lowerMessage))) {
      console.log('💻 Detected: Code mode');
      return 'code';
    }
    
    // -------------------------------------------------------------------------
    // EXPLAIN MODE DETECTION
    // -------------------------------------------------------------------------
    const explainPatterns = [
      /\bexplain\b/,
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
    ];
    
    if (explainPatterns.some(pattern => pattern.test(lowerMessage))) {
      console.log('📖 Detected: Explain mode');
      return 'explain';
    }
    
    // -------------------------------------------------------------------------
    // DEFAULT: CHAT MODE
    // -------------------------------------------------------------------------
    console.log('💬 Detected: Chat mode (default)');
    return 'chat';
  }, []);

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
    
    // Only clear messages if NOT auto-switching
    if (!isAutoSwitching.current) {
      setActiveChat(null);
      setMessages([]);
    }
    
    // Process pending message after mode switch completes
    if (isAutoSwitching.current && pendingMessage.current) {
      const { content, mode } = pendingMessage.current;
      pendingMessage.current = null;
      isAutoSwitching.current = false;
      
      // Use ref to call the send function
      setTimeout(() => {
        if (sendMessageRef.current) {
          console.log(`📤 Sending pending message in ${mode} mode`);
          sendMessageRef.current(content, mode, [], loadedChats);
        }
      }, 100);
    }
  }, [user, selectedMode]);

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
    if (newMode !== selectedMode) {
      setSelectedMode(newMode);
      setActiveChat(null);
      setMessages([]);
    }
  }, [selectedMode]);

  // ---------------------------------------------------------------------------
  // MAIN MESSAGE HANDLER - With Dynamic Tab Switching
  // ---------------------------------------------------------------------------
  
  const handleSendMessage = useCallback(async (messageContent) => {
    // Detect the most appropriate mode for this message
    const suggestedMode = detectAppropriateMode(messageContent);
    
    // Check if we need to switch modes
    if (suggestedMode !== selectedMode) {
      console.log(`🔄 Auto-switching from "${selectedMode}" to "${suggestedMode}"`);
      
      // Set auto-switching flag and store pending message
      isAutoSwitching.current = true;
      pendingMessage.current = { content: messageContent, mode: suggestedMode };
      
      // Show notification to user
      setNotificationMode(suggestedMode);
      setShowModeNotification(true);
      
      // Switch mode - the useEffect will handle sending the message
      setSelectedMode(suggestedMode);
      return;
    }
    
    // Send message in current mode (no switch needed)
    console.log(`📤 Sending message in current "${selectedMode}" mode`);
    sendMessageToAPI(messageContent, selectedMode, messages, chats);
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

