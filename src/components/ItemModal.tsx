import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, BookOpen, PenTool, Palette, Briefcase } from 'lucide-react';
import { MaterialItem, CATEGORIAS_PADRAO, CategoryOption, normalizeCategory } from '../types';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemData: Omit<MaterialItem, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  itemToEdit?: MaterialItem | null;
}

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  itemToEdit,
}) => {
  const [nome, setNome] = useState('');
  const [codigo, setCodigo] = useState('');
  const [categoria, setCategoria] = useState<CategoryOption>(CATEGORIAS_PADRAO[0]);
  const [quantidade, setQuantidade] = useState<number>(0);
  const [estoqueMinimo, setEstoqueMinimo] = useState<number>(5);
  const [precoUnitario, setPrecoUnitario] = useState<string>('0.00');
  const [localizacao, setLocalizacao] = useState('');
  const [descricao, setDescricao] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (itemToEdit) {
      setNome(itemToEdit.nome);
      setCodigo(itemToEdit.codigo || '');
      setCategoria(normalizeCategory(itemToEdit.categoria));
      setQuantidade(itemToEdit.quantidade);
      setEstoqueMinimo(itemToEdit.estoque_minimo);
      setPrecoUnitario(itemToEdit.preco_unitario.toFixed(2));
      setLocalizacao(itemToEdit.localizacao || '');
      setDescricao(itemToEdit.descricao || '');
    } else {
      setNome('');
      setCodigo('');
      setCategoria(CATEGORIAS_PADRAO[0]);
      setQuantidade(0);
      setEstoqueMinimo(5);
      setPrecoUnitario('0.00');
      setLocalizacao('');
      setDescricao('');
    }
    setError(null);
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setError('Por favor, informe o nome do material escolar.');
      return;
    }

    const finalPrice = parseFloat(precoUnitario.replace(',', '.')) || 0;

    setIsSubmitting(true);
    setError(null);

    try {
      await onSave({
        nome: nome.trim(),
        codigo: codigo.trim() || undefined,
        categoria: categoria,
        quantidade: Math.max(0, quantidade),
        estoque_minimo: Math.max(0, estoqueMinimo),
        preco_unitario: finalPrice,
        localizacao: localizacao.trim() || undefined,
        descricao: descricao.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Erro ao salvar: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryIcon = (cat: CategoryOption) => {
    switch (cat) {
      case 'CADERNO E PAPEIS':
        return <BookOpen className="w-4 h-4 text-amber-600" />;
      case 'ESCRITA E CORREÇÃO':
        return <PenTool className="w-4 h-4 text-blue-600" />;
      case 'PINTURA E DESENHO':
        return <Palette className="w-4 h-4 text-rose-600" />;
      case 'MOCHILA E ESTOJO':
        return <Briefcase className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {itemToEdit ? 'Editar Material Escolar' : 'Cadastrar Novo Material Escolar'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {itemToEdit
                ? 'Atualize as informações do item selecionado no estoque.'
                : 'Preencha os campos para cadastrar manualmente o produto.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Nome do Material *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Caderno Universitário 10 Matérias, Caneta Esferográfica Azul..."
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors text-slate-900 font-medium"
            />
          </div>

          {/* Categoria (4 Categorias Oficiais) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Categoria Oficial (Selecione uma das 4 opções) *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIAS_PADRAO.map((cat) => {
                const isSelected = categoria === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoria(cat)}
                    className={`flex items-center gap-2 p-3 text-left rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs ring-1 ring-indigo-600'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {getCategoryIcon(cat)}
                    <span className="truncate">{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Código / SKU */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Código / SKU / Código de Barras (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: 7891027123456 ou CAD-01"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors font-mono text-slate-900"
            />
          </div>

          {/* Quantidades e Preço */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Quantidade Atual
              </label>
              <input
                type="number"
                min="0"
                value={quantidade}
                onChange={(e) => setQuantidade(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Estoque Mínimo
              </label>
              <input
                type="number"
                min="0"
                value={estoqueMinimo}
                onChange={(e) => setEstoqueMinimo(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Preço Unitário (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={precoUnitario}
                onChange={(e) => setPrecoUnitario(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors font-semibold text-emerald-700"
              />
            </div>
          </div>

          {/* Localização Física */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Localização Física no Depósito / Loja
            </label>
            <input
              type="text"
              placeholder="Ex: Prateleira B2, Gaveta 3, Corredor de Cadernos..."
              value={localizacao}
              onChange={(e) => setLocalizacao(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors text-slate-800"
            />
          </div>

          {/* Descrição / Observações */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Descrição / Especificações
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Capa dura resistente, 200 folhas pautadas, espiral reforçado..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors text-slate-800"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Salvando...' : itemToEdit ? 'Atualizar Material' : 'Cadastrar Material'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
