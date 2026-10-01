import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ExternalLink,
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff,
  UserCheck
} from 'lucide-react';
import { groqService, GROQ_MODELS } from '../services/groqService';
import { MaterialItem } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: MaterialItem[];
  userEmail: string;
  onItemsImported: (items: MaterialItem[]) => void;
  onSettingsUpdated: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  items,
  userEmail,
  onItemsImported,
  onSettingsUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'groq' | 'backup' | 'account'>('groq');

  // Groq states
  const initialGroq = groqService.getConfig();
  const [groqKey, setGroqKey] = useState(initialGroq.apiKey);
  const [groqModel, setGroqModel] = useState(initialGroq.model);
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [isTestingGroq, setIsTestingGroq] = useState(false);
  const [groqStatus, setGroqStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  if (!isOpen) return null;

  // Save Groq
  const handleSaveGroq = () => {
    groqService.saveConfig({
      apiKey: groqKey.trim(),
      model: groqModel,
    });
    onSettingsUpdated();
  };

  // Test Groq
  const handleTestGroq = async () => {
    handleSaveGroq();
    setIsTestingGroq(true);
    setGroqStatus(null);
    try {
      const res = await groqService.testApiKey(groqKey.trim());
      setGroqStatus(res);
      if (res.success) {
        onSettingsUpdated();
      }
    } finally {
      setIsTestingGroq(false);
    }
  };

  // Export JSON
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(items, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `estoque_materiais_escolares_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['ID', 'Nome', 'Codigo', 'Categoria', 'Quantidade', 'Estoque_Minimo', 'Preco_Unitario', 'Localizacao', 'Descricao'];
    const rows = items.map((i) => [
      `"${i.id}"`,
      `"${i.nome.replace(/"/g, '""')}"`,
      `"${(i.codigo || '').replace(/"/g, '""')}"`,
      `"${i.categoria.replace(/"/g, '""')}"`,
      i.quantidade,
      i.estoque_minimo,
      i.preco_unitario.toFixed(2),
      `"${(i.localizacao || '').replace(/"/g, '""')}"`,
      `"${(i.descricao || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `estoque_materiais_escolares_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onItemsImported(parsed);
          alert(`${parsed.length} materiais escolares importados com sucesso!`);
        } else {
          alert('Arquivo JSON inválido. O formato deve ser uma lista de materiais.');
        }
      } catch {
        alert('Falha ao processar o arquivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Configurações</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Personalize o agente Groq AI e gerencie backups do estoque.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation (Sem botão do Supabase) */}
        <div className="flex border-b border-slate-200 px-6 gap-6 text-xs sm:text-sm font-medium">
          <button
            onClick={() => setActiveTab('groq')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'groq'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Groq AI (Agente Chatbot)</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'backup'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Exportar & Backup</span>
          </button>

          <button
            onClick={() => setActiveTab('account')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'account'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Conta de Acesso</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* TAB: GROQ AI */}
          {activeTab === 'groq' && (
            <div className="space-y-5">
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 leading-relaxed">
                <p className="font-semibold mb-1">Agente Inteligente Groq:</p>
                O agente consulta a lista atual de materiais escolares para responder dúvidas sobre unidades disponíveis,
                alertar sobre itens com estoque baixo, calcular valores totais e sugerir kits escolares.
              </div>

              {/* Status Message */}
              {groqStatus && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    groqStatus.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {groqStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  )}
                  <span>{groqStatus.message}</span>
                </div>
              )}

              {/* API Key */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Chave de API do Groq (Groq API Key) *
                </label>
                <div className="relative">
                  <input
                    type={showGroqKey ? 'text' : 'password'}
                    placeholder="gsk_..."
                    value={groqKey}
                    onChange={(e) => setGroqKey(e.target.value)}
                    className="w-full pr-10 pl-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono text-xs text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGroqKey(!showGroqKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showGroqKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                  <span>Sua chave é salva apenas localmente no seu navegador.</span>
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline inline-flex items-center gap-0.5 font-medium"
                  >
                    Criar chave gratuita no Groq Console <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Model Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Modelo do Agente (OpenAI GPT-OSS 20B)
                </label>
                <div className="space-y-2">
                  <select
                    value={GROQ_MODELS.some((m) => m.id === groqModel) ? groqModel : 'custom'}
                    onChange={(e) => {
                      if (e.target.value !== 'custom') {
                        setGroqModel(e.target.value);
                      }
                    }}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white text-slate-900 font-medium"
                  >
                    {GROQ_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.id})
                      </option>
                    ))}
                    <option value="custom">Outro modelo / Identificador customizado...</option>
                  </select>

                  <input
                    type="text"
                    value={groqModel}
                    onChange={(e) => setGroqModel(e.target.value)}
                    placeholder="Ex: openai/gpt-oss-20b ou gpt-oss-20b"
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono text-slate-900 bg-slate-50"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {GROQ_MODELS.find((m) => m.id === groqModel)?.description || 'Modelo especificado manualmente'}
                </p>
              </div>

              {/* Action button */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleTestGroq}
                  disabled={isTestingGroq || !groqKey.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingGroq ? 'animate-spin' : ''}`} />
                  <span>{isTestingGroq ? 'Validando Chave...' : 'Salvar & Validar Chave Groq'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB: BACKUP & EXPORT */}
          {activeTab === 'backup' && (
            <div className="space-y-5">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 leading-relaxed">
                Exporte seu inventário para planilhas ou faça cópias de segurança em formato JSON para restaurar a qualquer momento.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">Exportar Planilha (CSV)</h4>
                    <p className="text-xs text-slate-500 mb-4">
                      Compatível com Excel, Google Planilhas e LibreOffice.
                    </p>
                  </div>
                  <button
                    onClick={handleExportCsv}
                    disabled={items.length === 0}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar Estoque em CSV</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">Backup Completo (JSON)</h4>
                    <p className="text-xs text-slate-500 mb-4">
                      Salva todos os campos técnicos, códigos e timestamps.
                    </p>
                  </div>
                  <button
                    onClick={handleExportJson}
                    disabled={items.length === 0}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar Backup em JSON</span>
                  </button>
                </div>
              </div>

              {/* Import Section */}
              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Restaurar Backup (JSON)
                </h4>
                <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Selecionar Arquivo JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJson}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB: ACCOUNT INFO */}
          {activeTab === 'account' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Usuário Autenticado
                </span>
                <p className="text-base font-bold text-slate-900">{userEmail}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Acesso ativo com permissões completas de gestão de estoque e consulta com Groq.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
