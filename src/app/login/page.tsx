'use client';

import React from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useLogin } from '@/hooks/useLogin';

export default function LoginPage() {
  const { 
    email, 
    setEmail, 
    password, 
    setPassword, 
    handleSubmit, 
    error, 
    cargando 
  } = useLogin();

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#121212] p-6">
      <div className="w-full max-w-md bg-white p-12 shadow-2xl border-t-8 border-[#f29100]">
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic font-sans">SCRAP</h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em] mt-2 font-sans">CLA by Randstad</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input 
            label="Email Corporativo" 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ejemplo@randstad.es"
            required 
          />
          
          <Input 
            label="Contraseña" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required 
          />

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3">
              <p className="text-[10px] font-black text-red-600 uppercase tracking-widest font-sans">
                {error}
              </p>
            </div>
          )}

          <div className="pt-4">
            <Button type="submit" disabled={cargando}>
              {cargando ? 'Iniciando sesión...' : 'Entrar al Sistema'}
            </Button>
          </div>
        </form>

        <div className="mt-10 text-center border-t border-gray-100 pt-6">
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest font-sans">
            Acceso exclusivo personal CLA
          </p>
        </div>
      </div>
    </main>
  );
}