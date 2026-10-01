import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, Eye, EyeOff, AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react';

interface SellerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
}

export const SellerAuthModal: React.FC<SellerAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEmail('cassiatmonteiro@gmail.com');
      setPassword('');
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Check credentials immediately without timeouts that could get stuck
    try {
      const isEmailValid = cleanEmail === 'cassiatmonteiro@gmail.com' || cleanEmail === 'cassiatmonteiro';
      const isPasswordValid = cleanPassword === '123456';

      if (isEmailValid && isPasswordValid) {
        try {
          localStorage.setItem('escolarstock_auth_user', JSON.stringify({ email: 'cassiatmonteiro@gmail.com' }));
        } catch {
          // Ignore localStorage sandboxing errors
        }
        setIsLoading(false);
        onSuccess('cassiatmonteiro@gmail.com');
        onClose();
      } else {
        setError('Login ou senha incorretos. Utilize cassiatmonteiro@gmail.com e senha 123456.');
        setIsLoading(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Erro na autenticação: ${msg}`);
      setIsLoading(false);
    }
  };

  const handleQuickFill = () => {
    setEmail('cassiatmonteiro@gmail.com');
    setPassword('123456');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Acesso ao Modo Vendedor</h3>
              <p className="text-xs text-slate-500">Insira seu login e senha para gerenciar o estoque</p>
            </div>
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
              <span className="font-medium">{error}</span>
            </div>
          )}

          <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-950 flex items-center justify-between">
            <div>
              <span className="font-bold block">Credenciais Autorizadas:</span>
              <span className="text-[11px] text-indigo-800">Login: cassiatmonteiro@gmail.com</span>
            </div>
            <button
              type="button"
              onClick={handleQuickFill}
              className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-white hover:bg-indigo-100 border border-indigo-200 rounded-lg shadow-2xs transition-colors shrink-0"
            >
              Preencher Tudo
            </button>
          </div>

          {/* Email / Login */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Login (E-mail) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                placeholder="cassiatmonteiro@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 font-medium"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Senha de Acesso *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Digite a senha..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 font-medium"
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

          {/* Submit */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isLoading || !email.trim() || !password.trim()}
              className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-40 rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5"
            >
              <span>{isLoading ? 'Entrando...' : 'Entrar como Vendedor'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
