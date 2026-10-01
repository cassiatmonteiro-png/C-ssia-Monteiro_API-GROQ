import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Bot,
  User,
  Sparkles,
  Key,
  RotateCcw,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  PackageCheck
} from 'lucide-react';
import { ChatMessage, MaterialItem } from '../types';
import { groqService, GROQ_MODELS } from '../services/groqService';

interface ChatbotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: MaterialItem[];
  onOpenSettings: () => void;
  isGroqConfigured: boolean;
  onGroqConfigured: () => void;
}

export const ChatbotDrawer: React.FC<ChatbotDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onOpenSettings,
  isGroqConfigured,
  onGroqConfigured,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'welcome',
        role: 'assistant',
        content: `Olá! Sou o **Agente de Estoque EscolarStock** utilizando o modelo **OpenAI GPT-OSS 20B** ⚡.\n\nTenho acesso ao inventário real de materiais escolares em tempo real. Como posso te ajudar hoje?`,
        timestamp: Date.now(),
      },
    ];
  });
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inlineKey, setInlineKey] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isLoading]);

  if (!isOpen) return null;

  const handleSaveInlineKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineKey.trim()) return;

    setIsSavingKey(true);
    setKeyError(null);

    const testRes = await groqService.testApiKey(inlineKey.trim());
    if (!testRes.success) {
      setKeyError(testRes.message);
      setIsSavingKey(false);
      return;
    }

    groqService.saveConfig({ apiKey: inlineKey.trim() });
    onGroqConfigured();
    setIsSavingKey(false);
    setInlineKey('');
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || inputValue).trim();
    if (!messageContent || isLoading) return;

    if (!isGroqConfigured) {
      return;
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageContent,
      timestamp: Date.now(),
    };

    const assistantMsgId = `assistant-${Date.now()}`;
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, initialAssistantMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      await groqService.sendMessage(
        [...messages, userMsg],
        items,
        (currentChunk) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, content: currentChunk, isStreaming: true }
                : msg
            )
          );
        }
      );

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? { ...msg, isStreaming: false }
            : msg
        )
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content: `⚠️ Desculpe, ocorreu uma falha ao consultar o agente da Groq:\n\n${msg}`,
                isStreaming: false,
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Histórico limpo. Estou pronto para consultar o estoque atual de materiais escolares (${items.length} itens cadastrados).`,
        timestamp: Date.now(),
      },
    ]);
  };

  const currentGroqConfig = groqService.getConfig();
  const currentModelName = GROQ_MODELS.find((m) => m.id === currentGroqConfig.model)?.name || currentGroqConfig.model;

  // Simple formatting for bold and lists
  const renderMessageContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Bold regex
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const parsedLine = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} className="font-semibold text-slate-900">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <li key={idx} className="ml-4 list-disc my-0.5">
            {parsedLine}
          </li>
        );
      }

      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }

      return (
        <p key={idx} className="my-0.5 leading-relaxed">
          {parsedLine}
        </p>
      );
    });
  };

  const suggestedQuestions = [
    'Quais materiais estão com estoque baixo ou precisam de reposição?',
    'Qual o valor total somado de todos os materiais em estoque?',
    'Temos itens esgotados (quantidade zerada)?',
    'Faça um resumo dos cadernos e papéis disponíveis.',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Agente Groq AI</h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Tempo Real
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                <PackageCheck className="w-3.5 h-3.5 text-indigo-500" />
                <span>
                  Consultando <strong>{items.length}</strong> material(is) no estoque
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleClearHistory}
              title="Limpar conversa"
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Model info banner */}
        <div className="px-5 py-2 bg-slate-100/70 border-b border-slate-200/70 flex items-center justify-between text-xs text-slate-600">
          <div className="truncate">
            <span className="text-slate-400">Modelo:</span>{' '}
            <span className="font-medium text-slate-700">{currentModelName}</span>
          </div>
          <button
            onClick={onOpenSettings}
            className="text-indigo-600 hover:text-indigo-800 font-medium shrink-0 ml-2"
          >
            Trocar modelo
          </button>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Missing Groq Key Banner */}
          {!isGroqConfigured && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900">
              <div className="flex items-center gap-2 font-semibold text-sm mb-1">
                <Key className="w-4 h-4 text-amber-600" />
                <span>Chave de API do Groq necessária</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed mb-3">
                Para o agente consultar o estoque de materiais escolares em tempo real com ultra-baixa
                latência, insira sua chave gratuita da Groq abaixo.
              </p>

              <form onSubmit={handleSaveInlineKey} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="gsk_..."
                    value={inlineKey}
                    onChange={(e) => setInlineKey(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-900"
                  />
                  <button
                    type="submit"
                    disabled={isSavingKey || !inlineKey.trim()}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors shrink-0"
                  >
                    {isSavingKey ? 'Validando...' : 'Salvar Chave'}
                  </button>
                </div>
                {keyError && <p className="text-xs text-rose-600">{keyError}</p>}
              </form>

              <div className="mt-2.5 pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px] text-amber-700">
                <span>Não tem uma chave ainda? É grátis e instantâneo:</span>
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline inline-flex items-center gap-1 hover:text-amber-900"
                >
                  Obter chave Groq <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* Messages list */}
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-xs'
                      : 'bg-slate-100 text-slate-800 rounded-tl-xs border border-slate-200/60'
                  }`}
                >
                  {renderMessageContent(msg.content)}
                  {msg.isStreaming && (
                    <span className="inline-block w-1.5 h-3.5 bg-indigo-600 animate-pulse ml-1 align-middle" />
                  )}
                </div>
                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Questions */}
        <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50/50">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-slate-400" />
            Perguntas sugeridas sobre o estoque:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                disabled={isLoading || !isGroqConfigured}
                className="text-[11px] px-2.5 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 rounded-md text-slate-600 transition-colors text-left disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <div className="relative flex items-end gap-2">
            <textarea
              ref={inputRef}
              rows={2}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!isGroqConfigured || isLoading}
              placeholder={
                !isGroqConfigured
                  ? 'Configure sua chave Groq acima para conversar com o agente...'
                  : 'Pergunte sobre estoque, reposição, preços, localização...'
              }
              className="w-full resize-none px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:bg-slate-100 disabled:text-slate-400"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!isGroqConfigured || !inputValue.trim() || isLoading}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white shadow-xs transition-colors shrink-0 mb-0.5"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
            <span>Pressione Enter para enviar, Shift+Enter para quebra de linha</span>
            <span>Alimentado por Groq API</span>
          </div>
        </div>
      </div>
    </div>
  );
};
