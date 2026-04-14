import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, ChevronDown } from 'lucide-react';
import { askAssistant, type Message } from '@/lib/assistant';
import { Button } from '@/components/ui/button';

// ── Suggested quick questions ─────────────────────────────────────────────────

const SUGGESTIONS = [
  '¿Cuántas comisiones hay?',
  '¿Cuándo es la próxima reunión?',
  '¿Qué reuniones están completadas?',
  '¿Quiénes son los participantes?',
  'Dame un resumen de las reuniones',
];

// ── Markdown-lite renderer (bold + line breaks) ───────────────────────────────

function renderText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end`}>
      {!isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Bot className="w-3.5 h-3.5 text-primary" />
        </div>
      )}
      <div
        className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-sm shadow-md shadow-primary/20'
            : 'bg-white/70 backdrop-blur-sm border border-white/80 text-foreground rounded-bl-sm shadow-sm'
        }`}
      >
        {msg.content.split('\n').map((line, i, arr) => (
          <span key={i}>
            {renderText(line)}
            {i < arr.length - 1 && <br />}
          </span>
        ))}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2 items-end">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
        <Bot className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className="bg-white/70 backdrop-blur-sm border border-white/80 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.9s' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function VirtualAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Focus input when panel opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    setInput('');
    setError(null);
    setShowSuggestions(false);

    const userMsg: Message = { role: 'user', content };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const reply = await askAssistant(content, messages);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleSuggestion(s: string) {
    sendMessage(s);
  }

  const isEmpty = messages.length === 0;

  return (
    <>
      {/* ── Chat Panel ─────────────────────────────────────────────────────── */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-3rem)] transition-all duration-300 ease-in-out ${
          open
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
        }`}
        style={{ transformOrigin: 'bottom right' }}
      >
        <div className="glass-card rounded-2xl flex flex-col overflow-hidden shadow-2xl shadow-primary/10 border border-white/60" style={{ height: '520px' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/40 bg-gradient-to-r from-primary/10 to-primary/5 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground leading-none">Asistente CES</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Conectado a la base de datos</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="w-7 h-7 rounded-lg" onClick={() => setOpen(false)}>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
            {isEmpty && !loading && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 px-2">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Bot className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">¡Hola! Soy tu asistente CES</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Puedo responder preguntas sobre comisiones, reuniones y participantes.
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}

            {loading && <TypingIndicator />}

            {error && (
              <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2">
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* Suggestions */}
          {showSuggestions && (
            <div className="px-3 py-2 border-t border-white/30 bg-white/20 backdrop-blur-sm flex-shrink-0">
              <p className="text-[10px] text-muted-foreground mb-1.5 px-1">Sugerencias:</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSuggestion(s)}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary hover:bg-primary/15 hover:border-primary/40 transition-colors font-medium"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 border-t border-white/40 bg-white/30 backdrop-blur-sm flex gap-2 items-end flex-shrink-0">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // Auto-resize
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px';
              }}
              onKeyDown={handleKeyDown}
              placeholder="Escribí tu pregunta..."
              disabled={loading}
              className="flex-1 resize-none bg-white/60 border border-white/80 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all disabled:opacity-50 leading-relaxed overflow-hidden"
              style={{ minHeight: '36px', maxHeight: '80px' }}
            />
            <Button
              size="icon"
              className="w-9 h-9 rounded-xl flex-shrink-0 shadow-md shadow-primary/20"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── FAB Button ─────────────────────────────────────────────────────── */}
      <button
        id="virtual-assistant-fab"
        onClick={() => setOpen((v) => !v)}
        className={`fixed bottom-6 right-6 z-50 w-13 h-13 rounded-2xl bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/40 active:scale-95 ${
          open ? 'rotate-0' : 'rotate-0'
        }`}
        style={{ width: '52px', height: '52px' }}
        aria-label="Abrir asistente virtual"
      >
        <div className={`transition-all duration-200 ${open ? 'scale-0 opacity-0 absolute' : 'scale-100 opacity-100'}`}>
          <Bot className="w-6 h-6" />
        </div>
        <div className={`transition-all duration-200 ${open ? 'scale-100 opacity-100' : 'scale-0 opacity-0 absolute'}`}>
          <X className="w-6 h-6" />
        </div>
        {/* Pulse ring when closed */}
        {!open && (
          <span className="absolute inset-0 rounded-2xl animate-ping bg-primary/20 pointer-events-none" style={{ animationDuration: '2s' }} />
        )}
      </button>
    </>
  );
}
