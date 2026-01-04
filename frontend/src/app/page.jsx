'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChatHeader } from '@/components/ChatHeader';
import { ChatMessages } from '@/components/ChatMessages';
import { ChatInput } from '@/components/ChatInput';
import { Sidebar } from '@/components/Sidebar';
import { ModeNotification } from '@/components/ModeNotification';
import { chatAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';




export default function Home() {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [selectedMode, setSelectedMode] = useState('code');
  const [sidebarOpen, setSidebarOpen] = useState(false); // Start closed on mobile
  const [showModeNotification, setShowModeNotification] = useState(false);
  const [notificationMode, setNotificationMode] = useState('code');
  const [userApiKey, setUserApiKey] = useState('');
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Load chats from localStorage for current mode
  useEffect(() => {
    if (user) {
      const savedChats = localStorage.getItem(`chats_${user.uid}_${selectedMode}`);
      if (savedChats) {
        try {
          const parsedChats = JSON.parse(savedChats);
          setChats(parsedChats);
          
          // When switching modes, clear active chat and messages
          // User will need to select or create a new chat
          setActiveChat(null);
          setMessages([]);
        } catch (error) {
          console.error('Failed to load chats:', error);
          setChats([]);
          setActiveChat(null);
          setMessages([]);
        }
      } else {
        setChats([]);
        setActiveChat(null);
        setMessages([]);
      }
    }
  }, [user, selectedMode]);

  // Load stored user API key per user
  useEffect(() => {
    if (!user) return;
    const storedKey = localStorage.getItem(`custom_api_key_${user.uid}`);
    if (storedKey) {
      setUserApiKey(storedKey);
    }
  }, [user]);

  const handleApiKeyChange = (value) => {
    setUserApiKey(value);
    if (user) {
      localStorage.setItem(`custom_api_key_${user.uid}`, value);
    }
  };

  const saveChats = (updatedChats) => {
    try {
      localStorage.setItem(`chats_${user?.uid}_${selectedMode}`, JSON.stringify(updatedChats));
      setChats(updatedChats);
    } catch (error) {
      console.error('Failed to save chats:', error);
    }
  };

  const createNewChat = () => {
    const newChat = {
      id: Date.now().toString(),
      title: 'New Chat',
      timestamp: new Date().toISOString(),
      preview: 'No messages yet',
      messages: [],
      mode: selectedMode,
    };

    const updatedChats = [newChat, ...chats];
    saveChats(updatedChats);
    setActiveChat(newChat.id);
    setMessages([]);
  };

  const selectChat = (chatId) => {
    const chat = chats.find((c) => c.id === chatId);
    if (chat) {
      setActiveChat(chatId);
      setMessages(chat.messages || []);
    }
  };

  const deleteChat = (chatId) => {
    const updatedChats = chats.filter((c) => c.id !== chatId);
    saveChats(updatedChats);
    
    if (activeChat === chatId) {
      if (updatedChats.length > 0) {
        selectChat(updatedChats[0].id);
      } else {
        createNewChat();
      }
    }
  };

  const updateCurrentChat = (newMessages) => {
    if (!activeChat) {
      // Create a new chat if none exists
      const newChat = {
        id: Date.now().toString(),
        title: generateChatTitle(newMessages),
        timestamp: new Date().toISOString(),
        preview: newMessages[0]?.content.substring(0, 50) || '',
        messages: newMessages,
        mode: selectedMode,
      };
      const updatedChats = [newChat, ...chats];
      saveChats(updatedChats);
      setActiveChat(newChat.id);
      setChats(updatedChats);
    } else {
      // Update existing chat
      const updatedChats = chats.map((chat) =>
        chat.id === activeChat
          ? {
              ...chat,
              title: chat.title === 'New Chat' ? generateChatTitle(newMessages) : chat.title,
              timestamp: new Date().toISOString(),
              preview: newMessages[newMessages.length - 1]?.content.substring(0, 50) || '',
              messages: newMessages,
            }
          : chat
      );
      saveChats(updatedChats);
      setChats(updatedChats);
    }
  };

  const generateChatTitle = (messages) => {
    const firstUserMessage = messages.find((m) => m.role === 'user');
    if (firstUserMessage) {
      return firstUserMessage.content.substring(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '');
    }
    return 'New Chat';
  };

  // Detect appropriate mode based on message content
  const detectAppropriateMode = (message) => {
    const lowerMessage = message.toLowerCase();
    
    // Roadmap detection (highest priority)
    const roadmapKeywords = [
      'roadmap', 
      'learning path', 
      'study plan', 
      'curriculum', 
      'how to learn', 
      'guide to learn',
      'learning guide',
      'course path',
      'study guide',
      'create a roadmap',
      'make a roadmap',
      'show me a roadmap',
      'roadmap for',
      'learning roadmap',
      'career path',
      'learning journey',
      'step by step guide',
      'what should i learn',
      'where to start learning',
      'learning resource'
    ];
    if (roadmapKeywords.some(keyword => lowerMessage.includes(keyword))) {
      console.log('ðŸ—ºï¸ Detected: Roadmap mode - Auto-redirecting to Roadmap section');
      return 'roadmap';
    }
    
    // Code generation detection
    const codeKeywords = [
      'write code', 
      'create function', 
      'implement', 
      'write a function',
      'write a program',
      'program', 
      'script', 
      'algorithm', 
      'write a', 
      'create a function', 
      'build a', 
      'code for', 
      'function to', 
      'class to',
      'make a function',
      'generate code'
    ];
    if (codeKeywords.some(keyword => lowerMessage.includes(keyword))) {
      console.log('ðŸ’» Detected: Code mode');
      return 'code';
    }
    
    // Explain detection
    const explainKeywords = [
      'explain', 
      'what is', 
      'how does', 
      'why does', 
      'what are', 
      'describe', 
      'tell me about', 
      'difference between', 
      'what\'s the difference',
      'how do',
      'how to'
    ];
    if (explainKeywords.some(keyword => lowerMessage.includes(keyword))) {
      console.log('ðŸ“– Detected: Explain mode');
      return 'explain';
    }
    
    // Default to chat for general questions
    console.log('ðŸ’¬ Detected: Chat mode (default)');
    return 'chat';
  };

  // Handle mode change
  // Keyboard shortcut to toggle sidebar (Ctrl/Cmd + B)
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

  const handleModeChange = (newMode) => {
    if (newMode !== selectedMode) {
      setSelectedMode(newMode);
      setActiveChat(null);
      setMessages([]);
    }
  };

  const handleSendMessage = async (messageContent) => {
    // Detect if message should be in different mode
    const suggestedMode = detectAppropriateMode(messageContent);
    
    if (suggestedMode !== selectedMode) {
      console.log(`ðŸ”„ Auto-switching from ${selectedMode} to ${suggestedMode}`);
      
      // Auto-switch to appropriate mode
      setSelectedMode(suggestedMode);
      
      // Show notification
      setNotificationMode(suggestedMode);
      setShowModeNotification(true);
      
      // Wait for mode switch and state updates, then send message with empty history
      setTimeout(() => {
        console.log(`ðŸ“¤ Sending message in ${suggestedMode} mode`);
        handleSendMessageInMode(messageContent, suggestedMode, []);
      }, 150);
      return;
    }
    
    console.log(`ðŸ“¤ Sending message in current ${selectedMode} mode`);
    handleSendMessageInMode(messageContent, selectedMode, messages);
  };

  const handleSendMessageInMode = async (messageContent, mode, conversationHistory) => {
    // Add user message
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

      // Add assistant response
      const assistantMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: response.timestamp,
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);
      updateCurrentChat(finalMessages);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage = {
        role: 'assistant',
        content: 'âŒ Sorry, I encountered an error. Please make sure the backend server is running and try again.',
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...newMessages, errorMessage];
      setMessages(finalMessages);
      updateCurrentChat(finalMessages);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle suggestion click from empty state
  const handleSuggestionClick = (prompt) => {
    handleSendMessage(prompt);
  };

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

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {showModeNotification && (
        <ModeNotification
          mode={notificationMode}
          onClose={() => setShowModeNotification(false)}
        />
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
      <div className="flex-1 flex flex-col min-w-0">
        <ChatHeader
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
          selectedMode={selectedMode}
          onModeChange={handleModeChange}
          user={user}
          userApiKey={userApiKey}
          onApiKeyChange={handleApiKeyChange}
        />
        <ChatMessages 
          messages={messages} 
          isLoading={isLoading} 
          onSuggestionClick={handleSuggestionClick}
        />
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}

