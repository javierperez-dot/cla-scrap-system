'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link'; // Importación correcta
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/ui/Navbar';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
  const [usuario, setUsuario] = useState<any>(null);
  const [accesoModuloCentros, setAccesoModuloCentros] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const datosGuardados = localStorage.getItem('usuario_scrap');
    if (datosGuardados) {
      const user = JSON.parse(datosGuardados);
      setUsuario(user);
      verificarAccesoGlobal(user.id, user.email);
    } else {
      router.push('/login');
    }
  }, [router]);

  const verificarAccesoGlobal = async (userId: string, email: string) => {
    // 1. Superadmin siempre tiene acceso total
    if (email === 'javier.perez@randstad.es') {
      setAccesoModuloCentros(true);
      return;
    }

    try {
      // 2. CONSULTA MAESTRA: Miramos la columna 'tiene_acceso_centros' de la tabla 'usuarios'
      // Esta es la columna que en tu captura de HUAN CARLOS sale como FALSE
      const { data, error } = await supabase
        .from('usuarios')
        .select('tiene_acceso_centros')
        .eq('id', userId)
        .single();

      if (error) throw error;

      // Si la columna es FALSE en la tabla usuarios, la tarjeta SE OCULTA
      setAccesoModuloCentros(data?.tiene_acceso_centros === true);
      
    } catch (err) {
      console.error("Error validando acceso global:", err);
      setAccesoModuloCentros(false);
    }
  };

  if (!usuario || accesoModuloCentros === null) return (
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center font-black uppercase italic animate-pulse text-gray-400">
      Sincronizando seguridad...
    </div>
  );

  const esAdmin = usuario.rol === 'Administrador';

  return (
    <div className="min-h-screen bg-[#f0f2f5] font-sans">
      <Navbar />

      <div className="p-8 max-w-5xl mx-auto">
        
        {/* REJILLA DINÁMICA */}
        <div className={`grid grid-cols-1 ${esAdmin && accesoModuloCentros ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-8 mt-10`}>
          
          {/* TARJETA 1: ADMIN */}
          {esAdmin && (
            <Link href="/dashboard/admin" className="group">
              <div className="bg-black text-white p-10 border-b-4 border-[#f29100] hover:bg-zinc-900 transition-all shadow-2xl h-full flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-8">
                    <div className="bg-[#f29100] text-black p-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                    </div>
                    <span className="text-[10px] font-black text-[#f29100] uppercase tracking-widest border border-[#f29100] px-2 py-1">Master Control</span>
                  </div>
                  <h3 className="text-2xl font-black uppercase italic mb-3 tracking-tighter text-[#f29100]">Panel de Administración</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed font-bold uppercase opacity-80">Gestión de Personal, Clientes y Servicios.</p>
                </div>
              </div>
            </Link>
          )}

          {/* TARJETA 2: REGISTRO NOK - Bloqueada por la columna 'tiene_acceso_centros' */}
          {accesoModuloCentros && (
            <Link href="/dashboard/registro" className="group">
              <div className="bg-white p-10 border-b-4 border-black hover:border-red-600 transition-all shadow-sm h-full flex flex-col justify-between border-t border-x border-gray-100">
                <div>
                  <div className="flex justify-between items-start mb-8">
                    <div className="bg-gray-100 p-4 group-hover:bg-red-600 group-hover:text-white transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                    </div>
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest border border-gray-200 px-2 py-1">Operativa</span>
                  </div>
                  <h3 className="text-2xl font-black uppercase italic mb-3 tracking-tighter text-gray-900 group-hover:text-red-600 transition-colors">Registro Pieza NOK</h3>
                  <p className="text-sm text-gray-400 leading-relaxed font-bold uppercase opacity-80">Reporte de incidencias y avisos de calidad en tiempo real.</p>
                </div>
              </div>
            </Link>
          )}

        </div>

        {/* FOOTER */}
        <div className="mt-12 pt-8 border-t border-gray-200 flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
          <p>CLA SCRAP SYSTEM v2.1 // Terminal: {usuario.email}</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-gray-900 font-sans italic">Sistema Activo</span>
          </div>
        </div>
      </div>
    </div>
  );
}