import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const chatAPI = {
  /**
   * Set authorization token
   * @param {string | null} token 
   */
  setAuthToken: (token) => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  },

  /**
   * Send a chat message and get AI response
   * @param {Object} request - Chat request object
   * @returns {Promise<Object>}
   */
  sendMessage: async (request, userApiKey) => {
    const payload = { ...request };
    if (userApiKey) {
      payload.api_key = userApiKey.trim();
    }

    const response = await api.post('/api/chat', payload);
    return response.data;
  },

  /**
   * Verify Firebase token with backend
   * @param {string} token 
   * @returns {Promise<any>}
   * 
   */
  verifyToken: async (token) => {
    const response = await api.post('/api/auth/verify', { token });
    return response.data;
  },

  /**
   * Get chat history
   * @param {number} limit 
   * @returns {Promise<any>}
   */
  getChatHistory: async (limit = 50) => {
    const response = await api.get('/api/chat/history', {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Delete chat history
   * @returns {Promise<any>}
   */
  deleteChatHistory: async () => {
    const response = await api.delete('/api/chat/history');
    return response.data;
  },

  /**
   * Generate code
   * @param {Object} request - Code generation request
   * @returns {Promise<Object>}
   */
  generateCode: async (request, userApiKey) => {
    const payload = { ...request };
    if (userApiKey) {
      payload.api_key = userApiKey.trim();
    }

    const response = await api.post('/api/generate-code', payload);
    return response.data;
  },

  /**
   * Get supported programming languages
   * @returns {Promise<Array>}
   */
  getSupportedLanguages: async () => {
    const response = await api.get('/api/languages');
    return response.data.languages || [];
  },

  /**
   * Stream chat response (SSE)
   * @param {Object} request 
   * @param {Function} onChunk 
   * @param {Function} onComplete 
   * @param {Function} onError 
   */
  streamChatResponse: async (request, onChunk, onComplete, onError, userApiKey) => {
    try {
      const payload = { ...request };
      if (userApiKey) {
        payload.api_key = userApiKey.trim();
      }

      const response = await fetch(`${API_URL}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...api.defaults.headers.common,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              onComplete?.();
              return;
            }
            try {
              const parsed = JSON.parse(data);
              onChunk?.(parsed.content || parsed.message || data);
            } catch {
              onChunk?.(data);
            }
          }
        }
      }

      onComplete?.();
    } catch (error) {
      console.error('Stream error:', error);
      onError?.(error);
    }
  },
};

export default api;
