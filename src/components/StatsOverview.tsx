import React from 'react';
import { Package, AlertTriangle, XCircle, DollarSign, Layers } from 'lucide-react';
import { MaterialItem } from '../types';

interface StatsOverviewProps {
  items: MaterialItem[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ items }) => {
  const totalItems = items.length;
  const totalUnits = items.reduce((acc, it) => acc + (it.quantidade || 0), 0);
  const lowStockCount = items.filter((it) => it.quantidade <= it.estoque_minimo && it.quantidade > 0).length;
  const outOfStockCount = items.filter((it) => it.quantidade === 0).length;
  const totalValue = items.reduce((acc, it) => acc + ((it.quantidade || 0) * (it.preco_unitario || 0)), 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Produtos</span>
          <Package className="w-4 h-4 text-indigo-600" />
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-900">{totalItems}</div>
          <p className="text-xs text-slate-500 mt-0.5">cadastrados</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Unidades</span>
          <Layers className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-900">{totalUnits}</div>
          <p className="text-xs text-slate-500 mt-0.5">em estoque físico</p>
        </div>
      </div>

      <div className={`border rounded-xl p-4 shadow-xs flex flex-col justify-between transition-colors ${
        lowStockCount > 0 ? 'bg-amber-50/60 border-amber-200 text-amber-900' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Estoque Baixo</span>
          <AlertTriangle className={`w-4 h-4 ${lowStockCount > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
        </div>
        <div>
          <div className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
            {lowStockCount}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">precisam de reposição</p>
        </div>
      </div>

      <div className={`border rounded-xl p-4 shadow-xs flex flex-col justify-between transition-colors ${
        outOfStockCount > 0 ? 'bg-rose-50/60 border-rose-200 text-rose-900' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Esgotados</span>
          <XCircle className={`w-4 h-4 ${outOfStockCount > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
        </div>
        <div>
          <div className={`text-2xl font-bold ${outOfStockCount > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
            {outOfStockCount}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">sem unidades</p>
        </div>
      </div>

      <div className="col-span-2 sm:col-span-1 bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Valor em Estoque</span>
          <DollarSign className="w-4 h-4 text-emerald-600" />
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">avaliação total</p>
        </div>
      </div>
    </div>
  );
};
