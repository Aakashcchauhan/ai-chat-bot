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

export default function Home() {
  // ===== STATE =====
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [selectedMode, setSelectedMode] = useState('code');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showModeNotification, setShowModeNotification] = useState(false);
  const [notificationMode, setNotificationMode] = useState('code');
  const [userApiKey, setUserApiKey] = useState('');

  // ===== AUTH =====
  const { user, loading } = useAuth();
  const router = useRouter();

  // ===== REFS FOR PENDING ACTIONS =====
  const pendingActionRef = useRef(null);

  // ===== AUTH REDIRECT =====
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // ===== LOAD API KEY =====
  useEffect(() => {
    if (!user) return;
    const storedKey = localStorage.getItem(`custom_api_key_${user.uid}`);
    if (storedKey) setUserApiKey(storedKey);
  }, [user]);

  // ===== KEYBOARD SHORTCUTS =====
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ===== HELPERS =====
  const handleApiKeyChange = (value) => {
    setUserApiKey(value);
    if (user) localStorage.setItem(`custom_api_key_${user.uid}`, value);
  };

  const generateChatTitle = (msgs) => {
    const firstUserMsg = msgs.find((m) => m.role === 'user');
    if (firstUserMsg) {
      const title = firstUserMsg.content.substring(0, 30);
      return title + (firstUserMsg.content.length > 30 ? '...' : '');
    }
    return 'New Chat';
  };

  const saveChatsToStorage = useCallback(
    (updatedChats, mode) => {
      try {
        localStorage.setItem(`chats_${user?.uid}_${mode}`, JSON.stringify(updatedChats));
      } catch (error) {
        console.error('Failed to save chats:', error);
      }
    },
    [user?.uid]
  );

  // ===== MODE DETECTION =====
  const modePatterns = useMemo(
    () => ({
      roadmap: [
        /\broadmap\b/i, /\blearning\s*path\b/i, /\bstudy\s*plan\b/i,
        /\bcurriculum\b/i, /\bsyllabus\b/i, /\bcourse\s*(plan|outline|path)\b/i,
        /\bcareer\s*path\b/i, /\btimeline\b/i, /\bmilestone\b/i,
        /\bplan\s*(to|for)\s*learn/i, /\bcreate\s*(a\s*)?(learning\s*)?(plan|path|roadmap)/i,
        /\bmake\s*(me\s*)?(a\s*)?roadmap/i, /\bgenerate\s*(a\s*)?roadmap/i,
      ],
      code: [
        /\bwrite\s*(me\s*)?(a\s*)?(the\s*)?(code|function|program|script|class)\b/i,
        /\bcreate\s*(a\s*)?(the\s*)?(function|class|program|snippet)\b/i,
        /\bgenerate\s*(a\s*)?(code|function|snippet)\b/i, /\bimplement\b/i,
        /\bcode\s*(for|to)\b/i, /\bfunction\s*(to|that|for)\b/i,
        /\bclass\s*(to|that|for)\b/i, /\balgorithm\s*(for|to)\b/i,
        /\bdebug\s*(this|my)/i, /\bfix\s*(this|my)\s*(code|bug|error)/i,
        /\brefactor/i, /\boptimize/i, /\bunit\s*test\b/i, /\bapi\s*endpoint\b/i,
      ],
      explain: [
        /\bexplain\b/i, /\bwhat\s*(is|are|does|do)\b/i, /\bhow\s*(does|do|is|are)\b/i,
        /\bwhy\s*(does|do|is|are)\b/i, /\bdescribe\b/i, /\btell\s*me\s*(about|what)\b/i,
        /\bdifference\s*between\b/i, /\bhelp\s*me\s*understand\b/i,
        /\bdefine\b/i, /\bmeaning\s*of\b/i, /\bcompare\b/i,
      ],
    }),
    []
  );

  const detectAppropriateMode = useCallback(
    (message) => {
      const lower = message.toLowerCase().trim();
      const match = (patterns) => patterns.some((p) => p.test(lower));
      if (match(modePatterns.roadmap)) return 'roadmap';
      if (match(modePatterns.code)) return 'code';
      if (match(modePatterns.explain)) return 'explain';
      return 'chat';
    },
    [modePatterns]
  );

  // ===== SEND MESSAGE TO API =====
  const sendMessageToAPI = useCallback(
    async (messageContent, mode, conversationHistory, currentChats, currentActiveChat) => {
      const userMessage = {
        role: 'user',
        content: messageContent,
        timestamp: new Date().toISOString(),
      };

      const newMessages = [...conversationHistory, userMessage];
      setMessages(newMessages);
      setIsLoading(true);

      try {
        const response = await chatAPI.sendMessage(
          {
            message: messageContent,
            conversation_history: conversationHistory,
            language: selectedLanguage,
            mode: mode,
          },
          userApiKey
        );

        const assistantMessage = {
          role: 'assistant',
          content: response.message,
          timestamp: response.timestamp || new Date().toISOString(),
        };

        const finalMessages = [...newMessages, assistantMessage];
        setMessages(finalMessages);

        // Update or create chat
        let updatedChats;
        const existingIdx = currentChats.findIndex((c) => c.id === currentActiveChat);

        if (existingIdx !== -1 && currentActiveChat) {
          updatedChats = currentChats.map((c) =>
            c.id === currentActiveChat
              ? {
                  ...c,
                  title: generateChatTitle(finalMessages),
                  timestamp: new Date().toISOString(),
                  preview: finalMessages[finalMessages.length - 1]?.content.substring(0, 50) || '',
                  messages: finalMessages,
                }
              : c
          );
        } else {
          const newChat = {
            id: Date.now().toString(),
            title: generateChatTitle(finalMessages),
            timestamp: new Date().toISOString(),
            preview: finalMessages[finalMessages.length - 1]?.content.substring(0, 50) || '',
            messages: finalMessages,
            mode: mode,
          };
          updatedChats = [newChat, ...currentChats];
          setActiveChat(newChat.id);
        }

        setChats(updatedChats);
        saveChatsToStorage(updatedChats, mode);
      } catch (error) {
        console.error('Error sending message:', error);
        const errorMessage = {
          role: 'assistant',
          content: '❌ Sorry, I encountered an error. Please make sure the backend server is running.',
          timestamp: new Date().toISOString(),
        };
        setMessages([...newMessages, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedLanguage, userApiKey, saveChatsToStorage]
  );

  // ===== LOAD CHATS ON MODE CHANGE =====
  useEffect(() => {
    if (!user) return;

    const savedChats = localStorage.getItem(`chats_${user.uid}_${selectedMode}`);
    let loadedChats = [];

    if (savedChats) {
      try {
        loadedChats = JSON.parse(savedChats);
      } catch (error) {
        console.error('Failed to load chats:', error);
      }
    }

    setChats(loadedChats);

    // Handle pending actions
    const pending = pendingActionRef.current;
    if (pending) {
      if (pending.type === 'selectChat') {
        setActiveChat(pending.chatId);
        setMessages(pending.messages);
      } else if (pending.type === 'sendMessage') {
        sendMessageToAPI(pending.content, selectedMode, [], loadedChats, null);
      }
      pendingActionRef.current = null;
    } else {
      setActiveChat(null);
      setMessages([]);
    }
  }, [user, selectedMode, sendMessageToAPI]);

  // ===== CHAT MANAGEMENT =====
  const createNewChat = useCallback(() => {
    setActiveChat(null);
    setMessages([]);
  }, []);

  const selectChat = useCallback(
    (chatId, chatObj = null) => {
      const chat = chatObj || chats.find((c) => c.id === chatId);
      if (!chat) return;

      if (chat.mode && chat.mode !== selectedMode) {
        pendingActionRef.current = {
          type: 'selectChat',
          chatId: chat.id,
          messages: chat.messages || [],
        };
        setSelectedMode(chat.mode);
      } else {
        setActiveChat(chat.id);
        setMessages(chat.messages || []);
      }
    },
    [chats, selectedMode]
  );

  const deleteChat = useCallback(
    (chatId) => {
      const updatedChats = chats.filter((c) => c.id !== chatId);
      setChats(updatedChats);
      saveChatsToStorage(updatedChats, selectedMode);

      if (activeChat === chatId) {
        setActiveChat(null);
        setMessages([]);
      }
    },
    [chats, activeChat, selectedMode, saveChatsToStorage]
  );

  // ===== MODE CHANGE =====
  const handleModeChange = useCallback(
    (newMode) => {
      if (newMode !== selectedMode) {
        setSelectedMode(newMode);
      }
    },
    [selectedMode]
  );

  // ===== SEND MESSAGE =====
  const handleSendMessage = useCallback(
    (messageContent) => {
      const trimmed = messageContent.trim();
      if (!trimmed) return;

      const suggestedMode = detectAppropriateMode(trimmed);

      if (suggestedMode !== selectedMode) {
        console.log(`🔄 Auto-switching from "${selectedMode}" to "${suggestedMode}"`);
        pendingActionRef.current = { type: 'sendMessage', content: trimmed };
        setNotificationMode(suggestedMode);
        setShowModeNotification(true);
        setSelectedMode(suggestedMode);
        return;
      }

      sendMessageToAPI(trimmed, selectedMode, messages, chats, activeChat);
    },
    [selectedMode, messages, chats, activeChat, detectAppropriateMode, sendMessageToAPI]
  );

  const handleSuggestionClick = useCallback(
    (prompt) => handleSendMessage(prompt),
    [handleSendMessage]
  );

  // ===== LOADING =====
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
          <p className="mt-6 text-slate-600 dark:text-slate-400 font-medium">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // ===== RENDER =====
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {showModeNotification && (
        <ModeNotification mode={notificationMode} onClose={() => setShowModeNotification(false)} />
      )}

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

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <ChatHeader
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
          selectedMode={selectedMode}
          onModeChange={handleModeChange}
          user={user}
          userApiKey={userApiKey}
          onApiKeyChange={handleApiKeyChange}
        />

        <ChatMessages messages={messages} isLoading={isLoading} onSuggestionClick={handleSuggestionClick} />

        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}

