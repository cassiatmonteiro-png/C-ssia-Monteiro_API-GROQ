import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  PackageOpen,
  MapPin,
  Barcode,
  MinusCircle,
  PlusCircle,
  BookOpen,
  PenTool,
  Palette,
  Briefcase
} from 'lucide-react';
import { MaterialItem, StockStatusFilter, CATEGORIAS_PADRAO, CategoryOption, normalizeCategory } from '../types';

interface InventoryListProps {
  items: MaterialItem[];
  onOpenAddItem: () => void;
  onEditItem: (item: MaterialItem) => void;
  onDeleteItem: (id: string, name: string) => void;
  onQuickAdjust: (id: string, delta: number) => void;
  onOpenMovementModal: (item: MaterialItem) => void;
}

export const InventoryList: React.FC<InventoryListProps> = ({
  items,
  onOpenAddItem,
  onEditItem,
  onDeleteItem,
  onQuickAdjust,
  onOpenMovementModal,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StockStatusFilter>('todos');
  const [sortBy, setSortBy] = useState<'nome' | 'quantidade-asc' | 'quantidade-desc' | 'preco-desc'>('nome');

  // Filtered and sorted items with category normalization
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        // Search
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchName = item.nome.toLowerCase().includes(q);
          const matchCode = item.codigo?.toLowerCase().includes(q);
          const matchCategory = item.categoria.toLowerCase().includes(q);
          const matchLocation = item.localizacao?.toLowerCase().includes(q);
          const matchDesc = item.descricao?.toLowerCase().includes(q);
          if (!matchName && !matchCode && !matchCategory && !matchLocation && !matchDesc) {
            return false;
          }
        }

        // Category filter using normalized category
        if (selectedCategory !== 'all') {
          const norm = normalizeCategory(item.categoria);
          if (norm !== selectedCategory) {
            return false;
          }
        }

        // Status
        if (statusFilter === 'baixo') {
          return item.quantidade <= item.estoque_minimo && item.quantidade > 0;
        }
        if (statusFilter === 'esgotado') {
          return item.quantidade === 0;
        }
        if (statusFilter === 'normal') {
          return item.quantidade > item.estoque_minimo;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'nome') {
          return a.nome.localeCompare(b.nome);
        }
        if (sortBy === 'quantidade-asc') {
          return a.quantidade - b.quantidade;
        }
        if (sortBy === 'quantidade-desc') {
          return b.quantidade - a.quantidade;
        }
        if (sortBy === 'preco-desc') {
          return b.preco_unitario - a.preco_unitario;
        }
        return 0;
      });
  }, [items, search, selectedCategory, statusFilter, sortBy]);

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const getCategoryIcon = (cat: CategoryOption) => {
    switch (cat) {
      case 'CADERNO E PAPEIS':
        return <BookOpen className="w-3.5 h-3.5 text-amber-600" />;
      case 'ESCRITA E CORREÇÃO':
        return <PenTool className="w-3.5 h-3.5 text-blue-600" />;
      case 'PINTURA E DESENHO':
        return <Palette className="w-3.5 h-3.5 text-rose-600" />;
      case 'MOCHILA E ESTOJO':
        return <Briefcase className="w-3.5 h-3.5 text-indigo-600" />;
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
      {/* Category Pills Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/70 space-y-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              Todas as 4 Categorias ({items.length})
            </button>
            {CATEGORIAS_PADRAO.map((cat) => {
              const isSelected = selectedCategory === cat;
              const count = items.filter((i) => normalizeCategory(i.categoria) === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  {getCategoryIcon(cat)}
                  <span>{cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={onOpenAddItem}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Adicionar Material</span>
          </button>
        </div>

        {/* Search and Sort */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pt-1">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome do material, código de barras ou localização..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
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

          {/* Sort Selector */}
          <div className="relative shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
            >
              <option value="nome">Ordenar: Nome (A-Z)</option>
              <option value="quantidade-asc">Ordenar: Menor Estoque</option>
              <option value="quantidade-desc">Ordenar: Maior Estoque</option>
              <option value="preco-desc">Ordenar: Maior Preço</option>
            </select>
          </div>
        </div>

        {/* Status segmented buttons */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-200/60">
          <div className="flex items-center gap-1 p-1 bg-slate-200/60 rounded-xl">
            <button
              onClick={() => setStatusFilter('todos')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === 'todos'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({items.length})
            </button>
            <button
              onClick={() => setStatusFilter('normal')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === 'normal'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Normal ({items.filter((i) => i.quantidade > i.estoque_minimo).length})
            </button>
            <button
              onClick={() => setStatusFilter('baixo')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === 'baixo'
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Baixo ({items.filter((i) => i.quantidade <= i.estoque_minimo && i.quantidade > 0).length})
            </button>
            <button
              onClick={() => setStatusFilter('esgotado')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === 'esgotado'
                  ? 'bg-white text-rose-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Esgotado ({items.filter((i) => i.quantidade === 0).length})
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Exibindo <span className="font-bold text-slate-800">{filteredItems.length}</span> de{' '}
            <span className="font-bold text-slate-800">{items.length}</span> materiais
          </div>
        </div>
      </div>

      {/* Main Content: Table or Empty State */}
      {items.length === 0 ? (
        <div className="py-16 px-6 text-center max-w-md mx-auto">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100">
            <PackageOpen className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">Nenhum material escolar cadastrado</h3>
          <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
            O estoque está vazio. Conforme solicitado, nenhum dado fictício foi inserido. Comece cadastrando
            manualmente seus produtos em uma das 4 categorias oficiais.
          </p>
          <button
            onClick={onOpenAddItem}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Primeiro Material</span>
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-12 px-4 text-center">
          <p className="text-sm font-medium text-slate-600">Nenhum material escolar corresponde aos filtros aplicados.</p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory('all');
              setStatusFilter('todos');
            }}
            className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline"
          >
            Limpar todos os filtros
          </button>
        </div>
      ) : (
        /* Table View */
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50/50">
                <th className="py-3 px-4 sm:px-6">Material / Informações</th>
                <th className="py-3 px-4">Categoria Oficial</th>
                <th className="py-3 px-4 text-center">Estoque Atual</th>
                <th className="py-3 px-4 text-right">Preço Unit.</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 sm:px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredItems.map((item) => {
                const isOutOfStock = item.quantidade === 0;
                const isLowStock = item.quantidade <= item.estoque_minimo && !isOutOfStock;
                const normalizedCategory = normalizeCategory(item.categoria);

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Name, SKU, Location */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="font-bold text-slate-900 group-hover:text-indigo-950">
                        {item.nome}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                        {item.codigo && (
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <Barcode className="w-3 h-3 text-slate-400" />
                            {item.codigo}
                          </span>
                        )}
                        {item.codigo && item.localizacao && <span aria-hidden="true">·</span>}
                        {item.localizacao && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-600">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {item.localizacao}
                          </span>
                        )}
                        {item.descricao && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="truncate max-w-xs text-[11px] text-slate-400 italic">
                              {item.descricao}
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Category (Always mapped to one of the 4) */}
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                        {getCategoryIcon(normalizedCategory)}
                        <span>{normalizedCategory}</span>
                      </div>
                    </td>

                    {/* Quantity with fast +/- stepper */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onQuickAdjust(item.id, -1)}
                          disabled={item.quantidade <= 0}
                          title="Diminuir 1 unidade"
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                        >
                          <MinusCircle className="w-4 h-4" />
                        </button>

                        <div className="min-w-10 text-center">
                          <span className={`font-extrabold text-sm ${
                            isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-600' : 'text-slate-900'
                          }`}>
                            {item.quantidade}
                          </span>
                          <span className="text-[10px] text-slate-400 block -mt-1 font-medium">
                            mín: {item.estoque_minimo}
                          </span>
                        </div>

                        <button
                          onClick={() => onQuickAdjust(item.id, 1)}
                          title="Adicionar 1 unidade"
                          className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                        >
                          <PlusCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4 text-right font-bold text-slate-800">
                      {formatCurrency(item.preco_unitario)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Esgotado
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Estoque Baixo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Normal
                        </span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenMovementModal(item)}
                          title="Entrada / Saída em lote"
                          className="px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-50 rounded-lg border border-indigo-200 transition-colors"
                        >
                          Movimentar
                        </button>
                        <button
                          onClick={() => onEditItem(item)}
                          title="Editar informações do material"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteItem(item.id, item.nome)}
                          title="Excluir material do estoque"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
