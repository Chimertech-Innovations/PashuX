import { useState, useRef, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import type { AnalysisType } from '@/types';

interface Props {
  requestId?: string;
  userId?: string;
  analysisType?: AnalysisType;
  analysisContext?: unknown;
  defaultOpen?: boolean;
}

const SUGGESTIONS = [
  'What does this BCS score mean?',
  'How can I improve my cattle\'s body condition?',
  'When should I contact a veterinarian?',
  'What products can help with mastitis?',
  'How do I perform a CMT test?',
];

export default function ChatBot({ requestId, userId, analysisType, analysisContext, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const { messages, loading, send } = useChat({
    requestId, userId, analysisType, analysisContext
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    await send(text);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <>
      {/* Floating toggle button when closed */}
      {!open && (
        <button
          id="chatbot-toggle"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-black shadow-[0_0_24px_rgba(34,197,94,0.5)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 group border border-emerald-300/40"
          aria-label="Open AI assistant"
        >
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#07080a] animate-ping" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#07080a]" />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-6 h-6 text-black group-hover:rotate-6 transition-transform">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-40 w-[400px] max-w-[calc(100vw-3rem)] flex flex-col rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl animate-fade-in"
          style={{ height: '540px', background: 'rgba(12, 14, 20, 0.95)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_0_12px_rgba(34,197,94,0.4)]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-black">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Cattle Health Assistant</p>
                <p className="text-[10px] text-grey-500">Powered by Chimertech AI</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="btn-ghost p-1.5 text-grey-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Welcome */}
            {messages.length === 0 && (
              <div className="space-y-4 animate-fade-in">
                <div className="chat-bubble-assistant">
                  <p>Hello! I'm your Chimertech cattle health assistant. I can help you understand your analysis results, recommend products, and answer questions about cattle health.</p>
                  {Boolean(analysisContext) && (
                    <p className="mt-2 text-grey-400">I have your {analysisType === 'bcs' ? 'BCS' : 'disease screening'} results loaded as context.</p>
                  )}

                </div>
                {/* Quick suggestions */}
                <div className="space-y-1.5">
                  <p className="text-[10px] text-grey-600 pl-1">Suggested questions</p>
                  {SUGGESTIONS.slice(0, 3).map(s => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="block w-full text-left text-xs text-grey-400 px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] hover:text-white transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}>
                  <p className="whitespace-pre-wrap">{msg.message}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start animate-fade-in">
                <div className="chat-bubble-assistant">
                  <div className="flex gap-1 items-center h-4">
                    {[0,1,2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-grey-500"
                        style={{ animation: `pulse-soft 1.2s ease-in-out ${i*0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-white/[0.06]">
            <div className="flex items-center gap-2">
              <input
                id="chat-input"
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask about cattle health…"
                className="flex-1 input-field py-2 text-xs"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="w-9 h-9 rounded-xl bg-white disabled:opacity-30 flex items-center justify-center transition-all hover:bg-grey-100"
                aria-label="Send message"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-black">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
