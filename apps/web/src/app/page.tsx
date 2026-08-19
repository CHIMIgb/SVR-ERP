"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { HardHat, Lock, User, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/dashboard');
  };

  return (
    <main className="min-h-screen bg-secondary flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/20 blur-[100px] rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl">
          {/* Logo */}
          <div className="flex items-center gap-4 mb-10">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
               <HardHat className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter leading-none italic">SVR</h1>
              <p className="text-[10px] text-primary-light font-bold tracking-[0.3em] uppercase">Constructora</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Bienvenido al ERP</h2>
          <p className="text-slate-400 text-sm mb-8 font-medium">Ingresa tus credenciales para continuar.</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Usuario</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="admin@svr.com"
                  defaultValue="admin@svr.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contraseña</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                <input 
                  type="password" 
                  placeholder="••••••••"
                  defaultValue="password"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-primary hover:bg-primary-dark text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-1 active:translate-y-0 mt-8"
            >
              Iniciar Sesión
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
              SVR Constructora © 2025 — v2.0
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
