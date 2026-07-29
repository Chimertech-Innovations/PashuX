import { useState, useCallback } from 'react';
import { sendChatMessage } from '@/lib/api';
import type { ChatMessage, AnalysisType } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Simple id fallback if uuid is not installed
function genId() {
  try { return uuidv4(); } catch { return Math.random().toString(36).slice(2); }
}

interface UseChatOptions {
  requestId?: string;
  userId?: string;
  analysisType?: AnalysisType;
  analysisContext?: unknown;
}

export function useChat(options: UseChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const addMessage = (role: 'user' | 'assistant', text: string): ChatMessage => {
    const msg: ChatMessage = {
      id: genId(),
      role,
      message: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, msg]);
    return msg;
  };

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    setError(null);
    addMessage('user', text);
    setLoading(true);

    const history = messages.slice(-10).map(m => ({ role: m.role, message: m.message }));

    try {
      const res = await sendChatMessage({
        message: text,
        request_id: options.requestId,
        user_id: options.userId,
        analysis_type: options.analysisType,
        analysis_context: options.analysisContext,
        history,
      });
      addMessage('assistant', res.reply);
    } catch (err: any) {
      setError(err.message || 'Chat failed. Please try again.');
      addMessage('assistant', 'Sorry, I could not process your message. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [messages, loading, options]);

  const clear = useCallback(() => setMessages([]), []);

  return { messages, loading, error, send, clear };
}
