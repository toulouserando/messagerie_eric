import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, AlertCircle, KeyRound, Loader2 } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Simulate small delay for beautiful UX feel
    setTimeout(() => {
      const correctPassword = (import.meta as any).env.VITE_PASSWORD || 'sherpa';
      
      if (password === correctPassword) {
        onLoginSuccess();
      } else {
        setError('Mot de passe incorrect. Veuillez réessayer.');
        setIsSubmitting(false);
      }
    }, 600);
  };

  return (
    <div id="login-container" className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4 font-sans selection:bg-blue-100">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <div id="login-card" className="bg-white border border-gray-200 rounded-2xl shadow-xl shadow-gray-200/20 p-8 md:p-10">
          <div className="flex flex-col items-center text-center mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
              className="w-12 h-12 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-xs"
            >
              <Lock className="w-5 h-5 stroke-[2]" />
            </motion.div>
            <h1 className="text-xl font-bold tracking-tight text-gray-800">
              Accès Messagerie
            </h1>
            <p className="text-xs text-gray-500 mt-2">
              Veuillez saisir votre mot de passe pour accéder à vos dossiers sécurisés.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label htmlFor="password-input" className="block text-xs font-bold text-gray-500 uppercase tracking-tighter">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <KeyRound className="w-4 h-4 stroke-[1.75]" />
                </div>
                <input
                  id="password-input"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Saisissez le mot de passe de validation"
                  required
                  className="block w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                id="login-error"
                className="flex items-start gap-2.5 p-3.5 bg-red-50/70 border border-red-100 text-red-700 text-xs rounded-lg"
              >
                <AlertCircle className="w-4 h-4 shrink-0 stroke-[1.75] mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            <button
              id="login-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-bold rounded-lg hover:shadow-lg transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validation...</span>
                </>
              ) : (
                <span>Se connecter</span>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-[10px] text-gray-400 font-mono tracking-wider uppercase">
              Système Sécurisé • Sherpa
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
