import React, { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Lock, User, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import { UserItem } from '../types';

interface LoginViewProps {
  onLoginSuccess: (role: 'Admin' | 'Viewer', name: string) => void;
  systemLogo?: string;
  portalName?: string;
}

export default function LoginView({ onLoginSuccess, systemLogo, portalName }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const normalUser = username.trim().toLowerCase();
    const normalPass = password;

    if (!normalUser) {
      setErrorMsg('Nama pengguna wajib diisi.');
      return;
    }
    if (!normalPass) {
      setErrorMsg('Kata sandi wajib diisi.');
      return;
    }

    setIsLoading(true);

    // Simulate database network lag for polished professional feels
    setTimeout(() => {
      setIsLoading(false);
      
      if (normalUser === 'admin' && normalPass === 'edudigital') {
        onLoginSuccess('Admin', 'Administrator Utama');
      } else if (normalUser === 'peserta' && normalPass === 'edudigital') {
        onLoginSuccess('Viewer', 'Peserta EduDigital');
      } else {
        setErrorMsg('Nama pengguna atau kata sandi tidak cocok. Silakan periksa kredensial rujukan Anda.');
      }
    }, 750);
  };

  return (
    <div className="min-h-screen w-screen bg-slate-50 flex items-center justify-center p-4 md:p-6 select-none font-sans" id="login-viewport-wrapper">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden flex flex-col relative" id="login-card-container">
        {/* Dynamic portal color stripe accent */}
        <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-500 w-full" />

        {/* Top graphic header */}
        <div className="pt-8 px-8 pb-4 flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-blue-100 rounded-2xl blur-xs scale-110 opacity-70 animate-pulse" />
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-md relative z-10">
              {systemLogo ? (
                <img referrerPolicy="no-referrer" src={systemLogo} alt="Logo" className="w-10 h-10 object-contain" />
              ) : (
                <GraduationCap className="w-9 h-9 text-white" />
              )}
            </div>
          </div>

          <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight" id="login-portal-title">
            {portalName || 'EduDigital Portal'}
          </h1>
        </div>

        {/* Form area */}
        <form onSubmit={handleSubmit} className="px-8 pb-8 pt-2 space-y-4 flex-1">
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-rose-50 border border-rose-200/80 p-3.5 rounded-xl flex items-start space-x-2 text-rose-700 text-xs font-semibold leading-normal"
              id="login-error-alert"
            >
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {/* Username block */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest pl-1" htmlFor="login-username">
              Nama Pengguna (Username)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <User className="h-4.5 w-4.5 text-slate-500" />
              </span>
              <input
                id="login-username"
                type="text"
                placeholder="Masukkan nama pengguna"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm font-medium transition-all text-slate-700 placeholder-slate-400"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password block */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest pl-1" htmlFor="login-password">
              Kata Sandi (Password)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-4.5 w-4.5 text-slate-500" />
              </span>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan kata sandi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm font-medium transition-all text-slate-700 placeholder-slate-400"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-hidden"
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-100 transition duration-150 flex items-center justify-center space-x-2 cursor-pointer shadow-xs active:scale-[0.98] disabled:opacity-50"
            id="login-submit-button"
          >
            {isLoading ? (
              <span className="flex items-center space-x-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Memverifikasi Akses...</span>
              </span>
            ) : (
              <>
                <span>Masuk Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
