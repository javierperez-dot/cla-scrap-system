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
    <nav className="bg-white border-b-4 border-[#f29100] px-4 md:px-10 py-3 md:py-6 flex justify-between items-center shadow-md sticky top-0 z-50 w-full min-h-[70px] md:min-h-[110px]">
      
      {/* IZQUIERDA: LOGO E IDENTIDAD */}
      <div className="flex items-center gap-2 md:gap-8">
        <div className="relative w-12 h-12 md:w-20 md:h-20 flex items-center justify-center">
          <img 
            src="/logo.png" 
            alt="Logo CLA" 
            className="object-contain w-full h-full transform scale-110 md:scale-125"
          />
        </div>

        <div className="border-l-2 border-gray-200 pl-3 md:pl-8 text-left">
          <h1 className="text-sm md:text-3xl font-black italic tracking-tighter leading-none text-gray-900 uppercase">
            CLA SCRAP <span className="text-[#f29100]">SYSTEM</span>
          </h1>
          <p className="hidden md:block text-[11px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-1 leading-none">
            Quality Control Management
          </p>
        </div>
      </div>
      
      {/* DERECHA: IDENTIDAD EXTRAÍDA DE LOCALSTORAGE */}
      <div className="flex gap-3 md:gap-8 items-center">
        {usuario ? (
          <div className="flex items-center gap-3 md:gap-6 border-r-2 border-gray-100 pr-3 md:pr-8">
            <div className="flex flex-col items-end">
              <span className="text-[7px] md:text-[9px] font-black text-[#f29100] uppercase tracking-widest italic leading-none">
                {usuario.rol || 'Operativo'}
              </span>
              <span className="text-[10px] md:text-[14px] font-black text-gray-900 tracking-tighter mt-0.5 md:mt-1 italic leading-none uppercase truncate max-w-[80px] md:max-w-none">
                {usuario.nombre.split(' ')[0]} {usuario.email === 'javier.perez@randstad.es' ? '👑' : ''}
              </span>
            </div>
            
            <button 
              onClick={cerrarSesion}
              className="bg-black text-white px-2 md:px-5 py-1.5 md:py-2 text-[8px] md:text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all italic border-2 border-black shadow-[2px_2px_0px_0px_rgba(242,145,0,1)] md:shadow-[4px_4px_0px_0px_rgba(242,145,0,1)]"
            >
              <span className="md:hidden">SALIR</span>
              <span className="hidden md:inline">Finalizar Sesión [ESC]</span>
            </button>
          </div>
        ) : (
          <div className="w-5 md:w-10" />
        )}

        <Link 
          href="/dashboard" 
          className="text-[10px] md:text-xs font-black uppercase hover:text-[#f29100] transition-colors tracking-widest text-gray-500 italic"
        >
          Inicio
        </Link>
      </div>
    </nav>
  );
}