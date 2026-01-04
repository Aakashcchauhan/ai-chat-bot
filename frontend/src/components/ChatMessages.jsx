import React, { useRef, useEffect } from 'react';
import { Message } from './Message';
import { Sparkles, Code2, BookOpen, Lightbulb, Rocket } from 'lucide-react';

const suggestions = [
  {
    icon: Code2,
    title: 'Generate Code',
    prompt: 'Create a Python function to sort a list using quicksort',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Rocket,
    title: 'Build an API',
    prompt: 'Build a REST API with FastAPI and SQLAlchemy',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    icon: BookOpen,
    title: 'Learn Concepts',
    prompt: 'Explain async/await in JavaScript with examples',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Lightbulb,
    title: 'Best Practices',
    prompt: 'What are the best practices for React state management?',
    gradient: 'from-orange-500 to-amber-500',
  },
];

export const ChatMessages = ({
  messages,
  isLoading = false,
  onSuggestionClick,
}) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
          <div className="max-w-2xl space-y-8">
            {/* Hero Section */}
            <div className="space-y-4">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-violet-500 blur-2xl opacity-20 rounded-full" />
                <div className="relative w-20 h-20 mx-auto bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 dark:from-white dark:via-indigo-200 dark:to-white bg-clip-text text-transparent">
                AI Code Generator
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                Your intelligent coding companion. Generate code, explain concepts, and get instant help with any programming question.
              </p>
            </div>

            {/* Suggestion Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
              {suggestions.map((suggestion, index) => {
                const Icon = suggestion.icon;
                return (
                  <button
                    key={index}
                    onClick={() => onSuggestionClick?.(suggestion.prompt)}
                    className="group relative p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all duration-200 text-left hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${suggestion.gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                          {suggestion.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {suggestion.prompt}
                        </p>
                      </div>
                    </div>
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/0 via-indigo-500/0 to-violet-500/0 group-hover:from-indigo-500/5 group-hover:via-indigo-500/5 group-hover:to-violet-500/5 transition-all duration-200" />
                  </button>
                );
              })}
            </div>

            {/* Keyboard Hint */}
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-6">
              Press <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono border border-slate-200 dark:border-slate-700">/</kbd> to focus the input
            </p>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message, index) => (
            <Message key={index} message={message} />
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-slate-800 rounded-2xl px-5 py-4 shadow-sm border border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white animate-pulse" />
                    </div>
                    <div className="absolute inset-0 rounded-full bg-indigo-500 animate-ping opacity-25" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Generating response
                    </span>
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

