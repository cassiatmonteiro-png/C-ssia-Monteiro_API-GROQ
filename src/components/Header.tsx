import React from 'react';
import {
  BookOpen,
  Bot,
  Settings,
  Plus,
  Sparkles,
  RefreshCw,
  LogOut,
  User,
  ShoppingBag,
  ShieldCheck,
  ArrowRightLeft
} from 'lucide-react';
import { AppMode } from '../types';

interface HeaderProps {
  currentMode: AppMode;
  onToggleMode: (newMode: AppMode) => void;
  onOpenAddItem: () => void;
  onOpenChat: () => void;
  onOpenSettings: () => void;
  onRefresh: () => void;
  onLogout: () => void;
  userEmail?: string | null;
  isRefreshing: boolean;
  isGroqConfigured: boolean;
  itemCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onToggleMode,
  onOpenAddItem,
  onOpenChat,
  onOpenSettings,
  onRefresh,
  onLogout,
  userEmail,
  isRefreshing,
  isGroqConfigured,
  itemCount,
}) => {
  const isSeller = currentMode === 'vendedor';

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Logo, Brand & Mode Indicator */}
          <div className="flex items-center justify-between md:justify-start gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-black text-slate-900 tracking-tight">EscolarStock</h1>
                  <span className="text-[11px] px-2 py-0.5 rounded-md font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    Materiais Escolares
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    {isSeller ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Modo Vendedor Ativo</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Modo Comprador Ativo</span>
                      </>
                    )}
                  </span>

                  {isSeller && userEmail && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span className="truncate max-w-[160px] text-slate-500 text-[11px]">{userEmail}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Mode Switcher Segmented Control (Top Nav) */}
            <div className="flex items-center p-1 bg-slate-100 border border-slate-200 rounded-xl">
              <button
                type="button"
                onClick={() => onToggleMode('comprador')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  !isSeller
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Comprador</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleMode('vendedor')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isSeller
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Vendedor</span>
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Atualizar estoque em tempo real"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Chatbot Button (Both modes have AI assistant!) */}
            <button
              onClick={onOpenChat}
              title="Consultar com Agente Groq AI"
              className="relative inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all"
            >
              <Bot className="w-4 h-4 text-indigo-600" />
              <span>Agente Groq AI</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </button>

            {/* Seller Only Actions */}
            {isSeller && (
              <>
                <button
                  onClick={onOpenSettings}
                  title="Configurações do Sistema"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span className="hidden sm:inline">Configurações</span>
                </button>

                <button
                  onClick={onOpenAddItem}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Novo Material</span>
                </button>

                <button
                  onClick={onLogout}
                  title="Sair do Modo Vendedor"
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
