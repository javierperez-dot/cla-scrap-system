'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const [usuario, setUsuario] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Leemos de la misma fuente que el Dashboard
    const datosGuardados = localStorage.getItem('usuario_scrap');
    if (datosGuardados) {
      setUsuario(JSON.parse(datosGuardados));
    }
  }, []);

  const cerrarSesion = () => {
    localStorage.removeItem('usuario_scrap');
    setUsuario(null);
    router.push('/login');
  };

  return (
    <nav className="bg-white border-b-4 border-[#f29100] px-10 py-6 flex justify-between items-center shadow-md sticky top-0 z-50 w-full min-h-[110px]">
      
      {/* IZQUIERDA: LOGO E IDENTIDAD */}
      <div className="flex items-center gap-8">
        <div className="relative w-20 h-20 flex items-center justify-center">
          <img 
            src="/logo.png" 
            alt="Logo CLA" 
            className="object-contain w-full h-full transform scale-125"
          />
        </div>

        <div className="border-l-2 border-gray-200 pl-8 text-left">
          <h1 className="text-3xl font-black italic tracking-tighter leading-none text-gray-900 uppercase">
            CLA SCRAP <span className="text-[#f29100]">SYSTEM</span>
          </h1>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-1 leading-none">
            Quality Control Management
          </p>
        </div>
      </div>
      
      {/* DERECHA: IDENTIDAD EXTRAÍDA DE LOCALSTORAGE */}
      <div className="flex gap-8 items-center">
        {usuario ? (
          <div className="flex items-center gap-6 border-r-2 border-gray-100 pr-8">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-[#f29100] uppercase tracking-widest italic leading-none">
                {usuario.rol || 'Operativo'} Conectado
              </span>
              <span className="text-[14px] font-black text-gray-900 tracking-tighter mt-1 italic leading-none uppercase">
                {usuario.nombre}
              </span>
            </div>
            
            <button 
              onClick={cerrarSesion}
              className="bg-black text-white px-5 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all italic border-2 border-black shadow-[4px_4px_0px_0px_rgba(242,145,0,1)]"
            >
              Finalizar Sesión [ESC]
            </button>
          </div>
        ) : (
          /* Si no hay usuario en localStorage, no mostramos nada a la derecha */
          <div className="w-10" />
        )}

        <Link 
          href="/dashboard" 
          className="text-xs font-black uppercase hover:text-[#f29100] transition-colors tracking-widest text-gray-500 italic"
        >
          Inicio
        </Link>
      </div>
    </nav>
  );
}