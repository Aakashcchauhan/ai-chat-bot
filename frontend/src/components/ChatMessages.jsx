import React, { useRef, useEffect } from 'react';
import { Message } from './Message';
import { Loader2 } from 'lucide-react';




export const ChatMessages = ({
  messages,
  isLoading = false,
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
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="max-w-md space-y-4">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
              AI Code Generator
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Welcome! I'm your AI coding assistant. I can help you generate
              code, explain concepts, and answer programming questions.
            </p>
            <div className="grid grid-cols-1 gap-2 mt-6 text-sm">
              <div className="bg-primary-50 dark:bg-primary-900/20 p-3 rounded-lg">
                <p className="font-semibold text-primary-700 dark:text-primary-300">
                  ðŸ’¡ Try asking:
                </p>
                <ul className="mt-2 space-y-1 text-left text-gray-700 dark:text-gray-300">
                  <li>â€¢ "Create a Python function to sort a list"</li>
                  <li>â€¢ "Build a REST API with FastAPI"</li>
                  <li>â€¢ "Explain async/await in JavaScript"</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message, index) => (
            <Message key={index} message={message} />
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3 shadow-md">
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={18} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Thinking...
                  </span>
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

