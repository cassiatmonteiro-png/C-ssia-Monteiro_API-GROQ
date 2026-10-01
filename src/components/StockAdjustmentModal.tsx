import React, { useState } from 'react';
import { X, ArrowDownRight, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { MaterialItem } from '../types';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MaterialItem | null;
  onAdjust: (id: string, newQuantity: number) => Promise<void>;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  item,
  onAdjust,
}) => {
  const [type, setType] = useState<'entrada' | 'saida'>('entrada');
  const [delta, setDelta] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const currentQtd = item.quantidade;
  const newQtd = type === 'entrada' ? currentQtd + delta : Math.max(0, currentQtd - delta);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (delta <= 0) {
      setError('A quantidade deve ser maior que zero.');
      return;
    }
    if (type === 'saida' && delta > currentQtd) {
      setError(`Não é possível retirar ${delta} unidades pois o estoque atual é de ${currentQtd}.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onAdjust(item.id, newQtd);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Erro ao atualizar estoque: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-base font-bold text-slate-900">Movimentar Estoque</h3>
            <p className="text-xs text-slate-500 truncate max-w-xs">{item.nome}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {/* Type Selector (Entrada / Saída) */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setType('entrada')}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-all ${
                type === 'entrada'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>Entrada (+ Reposição)</span>
            </button>
            <button
              type="button"
              onClick={() => setType('saida')}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-all ${
                type === 'saida'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Saída (- Baixa/Uso)</span>
            </button>
          </div>

          {/* Current vs Projected */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 flex items-center justify-around text-center">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">Atual</span>
              <p className="text-xl font-bold text-slate-800">{currentQtd} un</p>
            </div>
            <div className="text-slate-300 font-bold text-xl">→</div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">Novo Saldo</span>
              <p
                className={`text-xl font-bold ${
                  newQtd === 0 ? 'text-rose-600' : newQtd <= item.estoque_minimo ? 'text-amber-600' : 'text-emerald-600'
                }`}
              >
                {newQtd} un
              </p>
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Quantidade a {type === 'entrada' ? 'Adicionar' : 'Retirar'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                required
                value={delta}
                onChange={(e) => setDelta(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3.5 py-2 text-base font-semibold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900"
              />
            </div>
            {/* Quick quick buttons */}
            <div className="flex gap-1.5 mt-2">
              {[1, 5, 10, 25, 50].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setDelta(num)}
                  className="flex-1 py-1 text-xs border border-slate-200 rounded-md hover:bg-slate-100 text-slate-700 font-medium transition-colors"
                >
                  +{num}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Confirmando...' : 'Confirmar Ajuste'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
