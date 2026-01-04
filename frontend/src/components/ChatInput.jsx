import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ChatInput = ({
  onSendMessage,
  isLoading = false,
  disabled = false,
}) => {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isLoading && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`;
    }
  }, [message]);

  return (
    <div className="border-t border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-3 sm:p-4">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div 
          className={cn(
            "relative flex items-end gap-2 p-2 rounded-2xl transition-all duration-300",
            "bg-slate-50 dark:bg-slate-800/50",
            "border-2",
            isFocused 
              ? "border-primary-500 shadow-lg shadow-primary-500/10" 
              : "border-slate-200 dark:border-slate-700"
          )}
        >
          {/* AI Indicator */}
          <div className="hidden sm:flex items-center justify-center p-2">
            <Sparkles className={cn(
              "w-5 h-5 transition-colors duration-300",
              isFocused ? "text-primary-500" : "text-slate-400"
            )} />
          </div>
          
          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Ask me anything... I'll automatically switch to the right mode!"
              disabled={disabled || isLoading}
              className={cn(
                "w-full bg-transparent resize-none py-2 px-2",
                "text-sm sm:text-base text-slate-900 dark:text-slate-100",
                "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                "focus:outline-none",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "max-h-32 min-h-[44px]"
              )}
              rows={1}
            />
          </div>
          
          {/* Send Button */}
          <button
            type="submit"
            disabled={!message.trim() || isLoading || disabled}
            className={cn(
              "flex-shrink-0 p-3 rounded-xl transition-all duration-300",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              message.trim() && !isLoading
                ? "bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 active:scale-95"
                : "bg-slate-200 dark:bg-slate-700 text-slate-400"
            )}
            title="Send message (Enter)"
            aria-label="Send message"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        
        {/* Keyboard hints */}
        <div className="mt-2 text-xs text-slate-400 dark:text-slate-500 hidden sm:flex items-center justify-center gap-4 flex-wrap">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-mono border border-slate-200 dark:border-slate-700">Enter</kbd>
            <span>to send</span>
          </span>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-mono border border-slate-200 dark:border-slate-700">Shift + Enter</kbd>
            <span>for new line</span>
          </span>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-mono border border-slate-200 dark:border-slate-700">Ctrl/⌘ + B</kbd>
            <span>toggle sidebar</span>
          </span>
        </div>
      </form>
    </div>
  );
};
