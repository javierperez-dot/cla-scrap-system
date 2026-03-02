'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/ui/Navbar'; 
import { supabase } from '@/lib/supabase';

export default function AdminHub() {
  const [usuarioLogueado, setUsuarioLogueado] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('usuario_scrap');
    if (userStr) {
      const user = JSON.parse(userStr);
      // HARDCODING DE SEGURIDAD: Si es tu email, forzamos rol Superadmin en sesión
      if (user.email === 'javier.perez@randstad.es') {
        user.rol = 'Superadmin';
      }
      setUsuarioLogueado(user);
    }
  }, []);

  const esSuperadmin = usuarioLogueado?.email === 'javier.perez@randstad.es';

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-gray-800">
      <Navbar />

      <div className="p-10 max-w-7xl mx-auto">
        {/* CABECERA DE SECCIÓN CON DISTINTIVO SUPERADMIN */}
        <div className="flex justify-between items-center mb-12 bg-white p-8 shadow-sm border-l-8 border-[#f29100]">
          <div>
            <h2 className="text-[10px] font-black text-[#f29100] uppercase tracking-[0.4em] mb-2 italic">
              {esSuperadmin ? 'SYSTEM MASTER ROOT' : 'System Administrator'}
            </h2>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic uppercase">
              Panel de Control {esSuperadmin && <span className="text-[#f29100]">★</span>}
            </h1>
          </div>
          <Link href="/dashboard" className="bg-black text-white px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-[#f29100] transition-all italic shadow-lg">
            ← Volver al Dashboard
          </Link>
        </div>

        {/* REJILLA DE OPCIONES ADMINISTRATIVAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* OPCIÓN 1: PERSONAL (Protegido) */}
          <Link href="/dashboard/usuarios" className="group">
            <div className="bg-white p-10 border-l-8 border-black shadow-sm hover:shadow-2xl transition-all h-full flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-gray-200 uppercase mb-4 tracking-widest">Módulo 01</h3>
                <h2 className="text-2xl font-black italic uppercase group-hover:text-[#f29100] transition-colors leading-tight">Gestión de Personal</h2>
                <div className="h-1 w-12 bg-black mt-4 group-hover:w-24 transition-all"></div>
                <p className="text-[11px] text-gray-500 mt-6 leading-relaxed font-bold uppercase tracking-tighter opacity-70">
                  {esSuperadmin 
                    ? 'CONTROL TOTAL: Gestión de administradores, operarios e inmunidad de cuenta.' 
                    : 'Control de accesos, altas de operarios y asignación de roles CLA.'}
                </p>
              </div>
              <span className="text-[10px] font-black text-gray-300 mt-8 group-hover:text-black uppercase">
                {esSuperadmin ? 'GESTIÓN MAESTRA →' : 'CONFIGURAR ACCESOS →'}
              </span>
            </div>
          </Link>

          {/* OPCIÓN 2: CLIENTES */}
          <Link href="/dashboard/clientes" className="group">
            <div className="bg-white p-10 border-l-8 border-black shadow-sm hover:shadow-2xl transition-all h-full flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-gray-200 uppercase mb-4 tracking-widest">Módulo 02</h3>
                <h2 className="text-2xl font-black italic uppercase group-hover:text-[#f29100] transition-colors leading-tight">Gestión de Clientes</h2>
                <div className="h-1 w-12 bg-black mt-4 group-hover:w-24 transition-all"></div>
                <p className="text-[11px] text-gray-500 mt-6 leading-relaxed font-bold uppercase tracking-tighter opacity-70">
                  Base de datos de receptores y configuración de envíos de alertas de calidad.
                </p>
              </div>
              <span className="text-[10px] font-black text-gray-300 mt-8 group-hover:text-black uppercase">GESTIONAR CARTERA →</span>
            </div>
          </Link>

          {/* OPCIÓN 3: SERVICIOS */}
          <Link href="/dashboard/servicios" className="group">
            <div className="bg-white p-10 border-l-8 border-[#f29100] shadow-sm hover:shadow-2xl transition-all h-full flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-[#f29100] uppercase mb-4 tracking-widest opacity-30">Módulo 03</h3>
                <h2 className="text-2xl font-black italic uppercase text-[#f29100]">Gestión de Servicios</h2>
                <div className="h-1 w-12 bg-[#f29100] mt-4 group-hover:w-24 transition-all"></div>
                <p className="text-[11px] text-gray-500 mt-6 leading-relaxed font-bold uppercase tracking-tighter opacity-70">
                  Definición de departamentos técnicos, sedes y jefes de servicio por área.
                </p>
              </div>
              <span className="text-[10px] font-black text-gray-300 mt-8 group-hover:text-[#f29100] uppercase">EDITAR ESTRUCTURA →</span>
            </div>
          </Link>

        </div>

        {/* INDICADOR DE SISTEMA CON EMAIL DE SUPERADMIN */}
        <div className="mt-16 flex flex-col items-center justify-center gap-4 text-gray-300">
          <div className="flex items-center gap-4">
            <div className="h-[1px] w-20 bg-gray-200"></div>
            <p className="text-[9px] font-black uppercase tracking-[0.5em]">CLA SCRAP SYSTEM CORE</p>
            <div className="h-[1px] w-20 bg-gray-200"></div>
          </div>
          {esSuperadmin && (
            <p className="text-[8px] font-bold text-[#f29100] animate-pulse uppercase">
              Privilegios de Superusuario Activos para: {usuarioLogueado.email}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}