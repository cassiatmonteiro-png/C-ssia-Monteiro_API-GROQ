/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Bot, Sparkles, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { MaterialItem, AppMode } from './types';
import { supabaseService } from './services/supabaseService';
import { groqService } from './services/groqService';
import { Header } from './components/Header';
import { StatsOverview } from './components/StatsOverview';
import { InventoryList } from './components/InventoryList';
import { BuyerCatalog } from './components/BuyerCatalog';
import { ItemModal } from './components/ItemModal';
import { StockAdjustmentModal } from './components/StockAdjustmentModal';
import { ChatbotDrawer } from './components/ChatbotDrawer';
import { SettingsModal } from './components/SettingsModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { LoginScreen } from './components/LoginScreen';
import { SellerAuthModal } from './components/SellerAuthModal';

export default function App() {
  // App Mode: 'comprador' or 'vendedor'
  const [mode, setMode] = useState<AppMode>('comprador');

  // Authentication state for Seller
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    try {
      const savedLocal = localStorage.getItem('escolarstock_auth_user');
      if (savedLocal) {
        const parsed = JSON.parse(savedLocal);
        return parsed.email || null;
      }
      const savedSession = sessionStorage.getItem('escolarstock_auth_user');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        return parsed.email || null;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [items, setItems] = useState<MaterialItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGroqConfigured, setIsGroqConfigured] = useState(false);

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<MaterialItem | null>(null);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementItem, setMovementItem] = useState<MaterialItem | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSellerAuthOpen, setIsSellerAuthOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: '',
  });

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Load items from Supabase or Local Storage
  const loadItems = useCallback(async (quiet = false) => {
    if (!quiet) setIsRefreshing(true);
    try {
      const result = await supabaseService.getItems();
      setItems(result.items);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`Erro ao carregar estoque: ${msg}`, 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Update configuration states
  const refreshConfigStates = useCallback(() => {
    setIsGroqConfigured(groqService.isConfigured());
  }, []);

  // Initialize
  useEffect(() => {
    refreshConfigStates();
    loadItems();
  }, [loadItems, refreshConfigStates]);

  // Real-time background sync
  useEffect(() => {
    if (!supabaseService.isConfigured()) return;

    const unsubscribe = supabaseService.subscribeToRealtime((payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        const newItem = payload.new;
        setItems((prev) => {
          if (prev.some((it) => it.id === newItem.id)) return prev;
          return [newItem, ...prev];
        });
        showToast(`Novo item adicionado: ${newItem.nome}`, 'info');
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        const updated = payload.new;
        setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
      } else if (payload.eventType === 'DELETE' && payload.old) {
        const deletedId = payload.old.id;
        setItems((prev) => prev.filter((it) => it.id !== deletedId));
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Mode Switch Handlers
  const handleToggleMode = (targetMode: AppMode) => {
    if (targetMode === 'vendedor') {
      if (mode === 'vendedor') return;
      setIsSellerAuthOpen(true);
    } else {
      setMode('comprador');
      showToast('Modo Comprador ativado', 'info');
    }
  };

  const handleSellerAuthSuccess = (email: string) => {
    setCurrentUser(email);
    setMode('vendedor');
    showToast(`Bem-vinda ao Modo Vendedor, ${email}!`, 'success');
  };

  const handleLogoutSeller = () => {
    localStorage.removeItem('escolarstock_auth_user');
    sessionStorage.removeItem('escolarstock_auth_user');
    setCurrentUser(null);
    setMode('comprador');
    showToast('Sessão de vendedor encerrada. Retornando ao Modo Comprador.', 'info');
  };

  // Handlers for Items (Seller Only)
  const handleSaveItem = async (
    itemData: Omit<MaterialItem, 'id' | 'created_at' | 'updated_at'>
  ) => {
    if (itemToEdit) {
      const res = await supabaseService.updateItem(itemToEdit.id, itemData);
      if (res.item) {
        setItems((prev) => prev.map((i) => (i.id === itemToEdit.id ? res.item! : i)));
        showToast(`"${res.item.nome}" atualizado com sucesso!`, 'success');
      }
      setItemToEdit(null);
    } else {
      const res = await supabaseService.addItem(itemData);
      if (res.item) {
        setItems((prev) => [res.item, ...prev]);
        showToast(`"${res.item.nome}" cadastrado com sucesso!`, 'success');
      }
    }
  };

  const handleEditItem = (item: MaterialItem) => {
    setItemToEdit(item);
    setIsItemModalOpen(true);
  };

  const handleDeleteRequest = (id: string, name: string) => {
    setDeleteModal({ isOpen: true, id, name });
  };

  const handleConfirmDelete = async () => {
    const { id, name } = deleteModal;
    if (!id) return;
    const res = await supabaseService.deleteItem(id);
    if (res.success) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      showToast(`"${name}" removido do estoque.`, 'info');
    } else {
      showToast(`Falha ao excluir: ${res.error}`, 'error');
    }
  };

  const handleQuickAdjust = async (id: string, delta: number) => {
    const target = items.find((i) => i.id === id);
    if (!target) return;
    const newQty = Math.max(0, target.quantidade + delta);

    // Optimistic update
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantidade: newQty } : i)));

    const res = await supabaseService.updateItem(id, { quantidade: newQty });
    if (res.error) {
      showToast(res.error, 'error');
    }
  };

  const handleAdjustExact = async (id: string, newQuantity: number) => {
    const res = await supabaseService.updateItem(id, { quantidade: newQuantity });
    if (res.item) {
      setItems((prev) => prev.map((i) => (i.id === id ? res.item! : i)));
      showToast(`Estoque de "${res.item.nome}" atualizado para ${newQuantity} un.`, 'success');
    }
  };

  const handleOpenMovementModal = (item: MaterialItem) => {
    setMovementItem(item);
    setIsMovementModalOpen(true);
  };

  const handleItemsImported = (importedItems: MaterialItem[]) => {
    setItems(importedItems);
    supabaseService.saveLocalItems(importedItems);
    showToast(`${importedItems.length} materiais escolares importados!`, 'success');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-60 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs sm:text-sm font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-800'
                : toast.type === 'error'
                ? 'bg-rose-900 text-white border-rose-800'
                : 'bg-slate-900 text-white border-slate-800'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-indigo-400 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Top Header with Mode Switcher */}
      <Header
        currentMode={mode}
        onToggleMode={handleToggleMode}
        onOpenAddItem={() => {
          setItemToEdit(null);
          setIsItemModalOpen(true);
        }}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onRefresh={() => loadItems(false)}
        onLogout={handleLogoutSeller}
        userEmail={currentUser}
        isRefreshing={isRefreshing}
        isGroqConfigured={isGroqConfigured}
        itemCount={items.length}
      />

      {/* Notice only if Groq is not configured */}
      {!isGroqConfigured && (
        <div className="bg-indigo-950 text-white text-xs py-2 px-4 border-b border-indigo-900">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-center sm:text-left">
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <span>
                Configure sua chave de API Groq (OpenAI GPT-OSS 20B) para habilitar respostas inteligentes sobre o estoque.
              </span>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="underline hover:text-indigo-200 text-xs font-bold shrink-0 cursor-pointer"
            >
              Configurar Groq IA
            </button>
          </div>
        </div>
      )}

      {/* Main Container: Conditioned by Mode */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500">Carregando catálogo de materiais escolares...</p>
          </div>
        ) : mode === 'comprador' ? (
          /* MODO COMPRADOR */
          <BuyerCatalog
            items={items}
            onOpenChat={() => setIsChatOpen(true)}
            onSwitchToSeller={() => handleToggleMode('vendedor')}
          />
        ) : (
          /* MODO VENDEDOR */
          <>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Painel de Gestão de Estoque</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gerencie as 4 categorias oficiais de materiais escolares, entradas, saídas e preços.
                </p>
              </div>
            </div>

            {/* Stats Overview */}
            <StatsOverview items={items} />

            {/* Inventory List with 4 Categories */}
            <InventoryList
              items={items}
              onOpenAddItem={() => {
                setItemToEdit(null);
                setIsItemModalOpen(true);
              }}
              onEditItem={handleEditItem}
              onDeleteItem={handleDeleteRequest}
              onQuickAdjust={handleQuickAdjust}
              onOpenMovementModal={handleOpenMovementModal}
            />
          </>
        )}
      </main>

      {/* Floating Action Button for Chatbot (OpenAI GPT-OSS 20B) */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 z-40 group flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-4 focus:ring-indigo-500/30"
        title="Consultar com Agente OpenAI GPT-OSS 20B"
      >
        <Bot className="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span className="font-bold text-xs sm:text-sm">Agente IA (GPT-OSS 20B)</span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      </button>

      {/* Modal: Seller Auth */}
      <SellerAuthModal
        isOpen={isSellerAuthOpen}
        onClose={() => setIsSellerAuthOpen(false)}
        onSuccess={handleSellerAuthSuccess}
      />

      {/* Modal: Item Create / Edit */}
      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setItemToEdit(null);
        }}
        onSave={handleSaveItem}
        itemToEdit={itemToEdit}
      />

      {/* Modal: Stock Movement */}
      <StockAdjustmentModal
        isOpen={isMovementModalOpen}
        onClose={() => {
          setIsMovementModalOpen(false);
          setMovementItem(null);
        }}
        item={movementItem}
        onAdjust={handleAdjustExact}
      />

      {/* Modal: Delete Confirmation */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: '', name: '' })}
        onConfirm={handleConfirmDelete}
        itemName={deleteModal.name}
      />

      {/* Modal: Settings */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        items={items}
        userEmail={currentUser || 'cassiatmonteiro@gmail.com'}
        onItemsImported={handleItemsImported}
        onSettingsUpdated={() => {
          refreshConfigStates();
          loadItems(true);
        }}
      />

      {/* Drawer: Chatbot */}
      <ChatbotDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        items={items}
        onOpenSettings={() => {
          setIsChatOpen(false);
          setIsSettingsOpen(true);
        }}
        isGroqConfigured={isGroqConfigured}
        onGroqConfigured={() => refreshConfigStates()}
      />
    </div>
  );
}
