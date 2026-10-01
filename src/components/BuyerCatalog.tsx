import React, { useState, useMemo } from 'react';
import {
  Search,
  BookOpen,
  PenTool,
  Palette,
  Briefcase,
  Plus,
  Minus,
  ShoppingCart,
  Check,
  PackageOpen,
  Sparkles,
  Barcode,
  Share2,
  Trash2,
  X,
  FileText
} from 'lucide-react';
import { MaterialItem, CategoryOption, CATEGORIAS_PADRAO, CartItem, normalizeCategory } from '../types';

interface BuyerCatalogProps {
  items: MaterialItem[];
  onOpenChat: () => void;
  onSwitchToSeller: () => void;
}

export const BuyerCatalog: React.FC<BuyerCatalogProps> = ({
  items,
  onOpenChat,
  onSwitchToSeller,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Category check with normalization
      if (selectedCategory !== 'all') {
        const itemNormCat = normalizeCategory(item.categoria);
        if (itemNormCat !== selectedCategory) return false;
      }

      // Search check
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = item.nome.toLowerCase().includes(q);
        const matchCode = item.codigo?.toLowerCase().includes(q);
        const matchDesc = item.descricao?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchDesc) return false;
      }

      return true;
    });
  }, [items, selectedCategory, search]);

  // Cart operations
  const addToCart = (item: MaterialItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        if (existing.quantidadeDesejada >= item.quantidade) return prev;
        return prev.map((c) =>
          c.item.id === item.id ? { ...c, quantidadeDesejada: c.quantidadeDesejada + 1 } : c
        );
      }
      return [...prev, { item, quantidadeDesejada: 1 }];
    });
  };

  const updateCartQty = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((c) => c.item.id !== itemId));
    } else {
      setCart((prev) =>
        prev.map((c) => {
          if (c.item.id === itemId) {
            const max = c.item.quantidade;
            return { ...c, quantidadeDesejada: Math.min(newQty, max) };
          }
          return c;
        })
      );
    }
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.item.id !== itemId));
  };

  const totalCartUnits = cart.reduce((acc, c) => acc + c.quantidadeDesejada, 0);
  const totalCartValue = cart.reduce(
    (acc, c) => acc + c.quantidadeDesejada * c.item.preco_unitario,
    0
  );

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Copy order formatted for WhatsApp or printing
  const handleCopyOrder = () => {
    if (cart.length === 0) return;
    const lines = [
      '📋 *ORÇAMENTO / LISTA DE MATERIAIS ESCOLARES*',
      '----------------------------------------',
      ...cart.map(
        (c) =>
          `• ${c.quantidadeDesejada}x ${c.item.nome} (${normalizeCategory(c.item.categoria)}) - ${formatCurrency(
            c.item.preco_unitario * c.quantidadeDesejada
          )}`
      ),
      '----------------------------------------',
      `*Total de Itens:* ${totalCartUnits} unidade(s)`,
      `*VALOR TOTAL ESTIMADO:* ${formatCurrency(totalCartValue)}`,
      '',
      '_Gerado pelo sistema EscolarStock_',
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  const getCategoryDetails = (cat: CategoryOption) => {
    switch (cat) {
      case 'CADERNO E PAPEIS':
        return {
          icon: <BookOpen className="w-5 h-5 text-amber-600" />,
          color: 'bg-amber-50 text-amber-900 border-amber-200',
          badge: 'bg-amber-100/80 text-amber-800',
        };
      case 'ESCRITA E CORREÇÃO':
        return {
          icon: <PenTool className="w-5 h-5 text-blue-600" />,
          color: 'bg-blue-50 text-blue-900 border-blue-200',
          badge: 'bg-blue-100/80 text-blue-800',
        };
      case 'PINTURA E DESENHO':
        return {
          icon: <Palette className="w-5 h-5 text-rose-600" />,
          color: 'bg-rose-50 text-rose-900 border-rose-200',
          badge: 'bg-rose-100/80 text-rose-800',
        };
      case 'MOCHILA E ESTOJO':
        return {
          icon: <Briefcase className="w-5 h-5 text-indigo-600" />,
          color: 'bg-indigo-50 text-indigo-900 border-indigo-200',
          badge: 'bg-indigo-100/80 text-indigo-800',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner for Buyer Mode */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 mb-3 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Modo Comprador · Consulta em Tempo Real</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            Catálogo de Materiais Escolares
          </h2>
          <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed mb-5">
            Consulte a disponibilidade de cadernos, materiais de escrita, pintura e mochilas.
            Monte sua lista de compras ou pergunte ao nosso assistente virtual inteligente com Groq AI.
          </p>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={onOpenChat}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Dúvidas? Pergunte ao Agente IA</span>
            </button>
            {cart.length > 0 && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Ver Lista ({totalCartUnits}) · {formatCurrency(totalCartValue)}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4 Official Categories Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {CATEGORIAS_PADRAO.map((cat) => {
          const isSelected = selectedCategory === cat;
          const details = getCategoryDetails(cat);
          const count = items.filter((i) => normalizeCategory(i.categoria) === cat).length;

          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(isSelected ? 'all' : cat)}
              className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'border-indigo-600 bg-white ring-2 ring-indigo-600/30 shadow-md'
                  : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/70 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-xl bg-slate-100">{details.icon}</div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {count} itens
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 leading-snug">{cat}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search & Active Filter bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, marca ou código de material escolar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors bg-slate-50/50"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Limpar
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {selectedCategory !== 'all' && (
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline mr-1"
            >
              Mostrar todas as categorias
            </button>
          )}
          <span className="text-xs text-slate-500">
            {filteredItems.length} materiais encontrados
          </span>
        </div>
      </div>

      {/* Product Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto">
          <PackageOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-1">Nenhum material encontrado</h3>
          <p className="text-xs text-slate-500 mb-4">
            {items.length === 0
              ? 'Ainda não há materiais escolares cadastrados no estoque.'
              : 'Nenhum item corresponde à pesquisa ou categoria selecionada.'}
          </p>
          {items.length === 0 && (
            <button
              onClick={onSwitchToSeller}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs"
            >
              Acessar Modo Vendedor para Cadastrar
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const normalizedCat = normalizeCategory(item.categoria);
            const inCart = cart.find((c) => c.item.id === item.id);
            const isOutOfStock = item.quantidade <= 0;

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Category & Status */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                      {normalizedCat}
                    </span>
                    {isOutOfStock ? (
                      <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Esgotado
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {item.quantidade} un. disponíveis
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-900 transition-colors leading-snug">
                    {item.nome}
                  </h3>

                  {/* Code & Description */}
                  {item.codigo && (
                    <p className="text-[11px] font-mono text-slate-400 mt-1 flex items-center gap-1">
                      <Barcode className="w-3 h-3" />
                      {item.codigo}
                    </p>
                  )}

                  {item.descricao && (
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {item.descricao}
                    </p>
                  )}
                </div>

                {/* Footer with Price and Add to List */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block -mb-0.5">Preço Unitário</span>
                    <span className="text-lg font-extrabold text-slate-900">
                      {formatCurrency(item.preco_unitario)}
                    </span>
                  </div>

                  {inCart ? (
                    <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl p-1">
                      <button
                        onClick={() => updateCartQty(item.id, inCart.quantidadeDesejada - 1)}
                        className="p-1 rounded-lg text-indigo-700 hover:bg-indigo-200 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold text-indigo-900 min-w-5 text-center">
                        {inCart.quantidadeDesejada}
                      </span>
                      <button
                        onClick={() => updateCartQty(item.id, inCart.quantidadeDesejada + 1)}
                        disabled={inCart.quantidadeDesejada >= item.quantidade}
                        className="p-1 rounded-lg text-indigo-700 hover:bg-indigo-200 disabled:opacity-40 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(item)}
                      disabled={isOutOfStock}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-40 disabled:hover:bg-indigo-600 rounded-xl shadow-xs transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isOutOfStock ? 'Sem estoque' : 'Adicionar'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cart Modal / Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Minha Lista de Materiais</h3>
                  <p className="text-xs text-slate-500">{totalCartUnits} unidade(s) selecionada(s)</p>
                </div>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-5 divide-y divide-slate-100">
              {cart.length === 0 ? (
                <div className="py-12 text-center">
                  <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Sua lista está vazia</p>
                  <p className="text-xs text-slate-400 mt-1">Adicione itens do catálogo escolar acima.</p>
                </div>
              ) : (
                cart.map(({ item, quantidadeDesejada }) => (
                  <div key={item.id} className="py-3.5 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-indigo-600 uppercase block">
                        {normalizeCategory(item.categoria)}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{item.nome}</h4>
                      <p className="text-xs text-slate-500 font-medium">
                        {formatCurrency(item.preco_unitario)} cada
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                        <button
                          onClick={() => updateCartQty(item.id, quantidadeDesejada - 1)}
                          className="p-1 rounded text-slate-600 hover:bg-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-slate-900 min-w-4 text-center">
                          {quantidadeDesejada}
                        </span>
                        <button
                          onClick={() => updateCartQty(item.id, quantidadeDesejada + 1)}
                          disabled={quantidadeDesejada >= item.quantidade}
                          className="p-1 rounded text-slate-600 hover:bg-white disabled:opacity-40"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer with Total and Actions */}
            {cart.length > 0 && (
              <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Total Estimado</span>
                  <span className="text-xl font-extrabold text-slate-900">
                    {formatCurrency(totalCartValue)}
                  </span>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleCopyOrder}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all"
                  >
                    {copiedShare ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                    <span>{copiedShare ? 'Lista Copiada para Enviar!' : 'Copiar Orçamento (WhatsApp)'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      onOpenChat();
                    }}
                    className="w-full py-2 px-4 rounded-xl bg-white hover:bg-slate-100 text-indigo-700 border border-indigo-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Tirar Dúvidas com Groq AI</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
