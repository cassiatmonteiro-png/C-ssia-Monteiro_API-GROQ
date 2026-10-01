import React, { useState } from 'react';
import {
  BookOpen,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { AppMode } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (email: string) => void;
  onEnterAsBuyer: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onEnterAsBuyer,
}) => {
  const [mode, setMode] = useState<AppMode>('comprador');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSellerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    try {
      const isEmailValid = cleanEmail === 'cassiatmonteiro@gmail.com' || cleanEmail === 'cassiatmonteiro';
      const isPasswordValid = cleanPassword === '123456';

      if (isEmailValid && isPasswordValid) {
        try {
          if (rememberMe) {
            localStorage.setItem('escolarstock_auth_user', JSON.stringify({ email: 'cassiatmonteiro@gmail.com' }));
          } else {
            sessionStorage.setItem('escolarstock_auth_user', JSON.stringify({ email: 'cassiatmonteiro@gmail.com' }));
          }
        } catch {
          // ignore storage error
        }
        setIsLoading(false);
        onLoginSuccess('cassiatmonteiro@gmail.com');
      } else {
        setError('E-mail ou senha incorretos para o Modo Vendedor.');
        setIsLoading(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Erro na autenticação: ${msg}`);
      setIsLoading(false);
    }
  };

  const handleFillCredentials = () => {
    setEmail('cassiatmonteiro@gmail.com');
    setPassword('123456');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Decorative gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-indigo-600/30 mb-3 border border-indigo-400/30">
          <BookOpen className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">EscolarStock</h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Estoque & Catálogo Inteligente de Materiais Escolares
        </p>

        {/* Mode Selector Tabs on Login Screen */}
        <div className="mt-6 p-1 bg-slate-900 border border-slate-800 rounded-2xl grid grid-cols-2 gap-1 max-w-sm mx-auto shadow-inner">
          <button
            type="button"
            onClick={() => {
              setMode('comprador');
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              mode === 'comprador'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Modo Comprador</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('vendedor');
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              mode === 'vendedor'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Modo Vendedor</span>
          </button>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-2xl rounded-3xl border border-slate-100">
          {mode === 'comprador' ? (
            /* COMPRADOR VIEW */
            <div className="text-center space-y-5">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Bem-vindo ao Catálogo Escolar</h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Consulte os materiais em estoque nas 4 categorias oficiais, monte sua lista de materiais escolares e tire dúvidas em tempo real com o Agente OpenAI GPT-OSS 20B.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>O que você pode fazer no Modo Comprador:</span>
                </div>
                <ul className="space-y-1.5 pl-5 list-disc text-slate-600">
                  <li>Consultar preços e unidades disponíveis em tempo real</li>
                  <li>Filtrar por Cadernos, Escrita, Pintura e Mochilas</li>
                  <li>Montar orçamento escolar e exportar para WhatsApp</li>
                  <li>Conversar com o Agente de IA para recomendações de listas</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={onEnterAsBuyer}
                className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Explorar Materiais Escolares</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-xs text-slate-400">
                É vendedor da papelaria?{' '}
                <button
                  type="button"
                  onClick={() => setMode('vendedor')}
                  className="text-indigo-600 font-bold hover:underline"
                >
                  Entrar no Modo Vendedor
                </button>
              </p>
            </div>
          ) : (
            /* VENDEDOR VIEW */
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <span>Acesso Modo Vendedor</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Autentique-se com sua senha para gerenciar produtos, cadastros e estoque.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSellerSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    E-mail do Vendedor
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="cassiatmonteiro@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors text-slate-900"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Senha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-xs text-slate-600">Lembrar-me</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleFillCredentials}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    Preencher Dados
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-2.5 px-4 text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <span>{isLoading ? 'Autenticando...' : 'Acessar Gestão de Estoque'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={onEnterAsBuyer}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium"
                >
                  Voltar para o Modo Comprador
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-slate-500 flex items-center justify-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          Acesso seguro e protegido por credencial para vendedores
        </p>
      </div>
    </div>
  );
};
