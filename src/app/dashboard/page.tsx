'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/ui/Navbar';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
  const [usuario, setUsuario] = useState<any>(null);
  const [accesoModuloCentros, setAccesoModuloCentros] = useState<boolean | null>(null);
  const [esSupervisorActivo, setEsSupervisorActivo] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const datosGuardados = localStorage.getItem('usuario_scrap');
    if (datosGuardados) {
      const user = JSON.parse(datosGuardados);
      setUsuario(user);
      verificarAccesoGlobalYRoles(user.id, user.email);
    } else {
      router.push('/login');
    }
  }, [router]);

  const verificarAccesoGlobalYRoles = async (userId: string, email: string) => {
    // 1. Superadmin (Acceso Maestro)
    if (email === 'javier.perez@randstad.es') {
      setAccesoModuloCentros(true);
      setEsSupervisorActivo(true);
      return;
    }

    try {
      const { data: userData, error: userError }: any = await supabase
        .from('usuarios')
        .select('tiene_acceso_centros, rol') 
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      
      setAccesoModuloCentros(userData?.tiene_acceso_centros === true);

      // 2. Verificación de permisos de supervisión
      const { data: serviceData, error: serviceError }: any = await supabase
        .from('usuario_servicios')
        .select('is_supervisor')
        .eq('usuario_id', userId)
        .eq('is_supervisor', true)
        .limit(1);

      if (serviceError) console.error("Error en servicios:", serviceError);

      const esSupPorRol = userData?.rol === 'Supervisor';
      const esSupPorCentro = serviceData && serviceData.length > 0;

      setEsSupervisorActivo(esSupPorRol || esSupPorCentro);
      
    } catch (err) {
      console.error("Error crítico de seguridad:", err);
      setAccesoModuloCentros(false);
    }
  };

  if (!usuario || accesoModuloCentros === null) return (
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center font-black uppercase italic animate-pulse text-gray-400 tracking-widest text-xs">
      Sincronizando seguridad cla...
    </div>
  );

  // Definimos quién ve el panel negro de administración superior
  const esAdminGlobal = usuario.rol === 'Administrador' || usuario.email === 'javier.perez@randstad.es';
  // Los supervisores también deben ver el acceso a gestión, pero NO el botón de admin global si no tienen el rol
  const mostrarAccesoGestion = esAdminGlobal || esSupervisorActivo;

  return (
    <div className="min-h-screen bg-[#f0f2f5] font-sans">
      <Navbar />

      <div className="p-8 max-w-5xl mx-auto space-y-8">
        
        {/* PANEL DE GESTIÓN: Ahora visible para Admins y Supervisores por igual */}
        {mostrarAccesoGestion && (
          <div className="mt-4">
            <Link href="/dashboard/admin" className="group">
              <div className="bg-black text-white p-6 border-l-4 border-[#f29100] hover:bg-zinc-900 transition-all shadow-xl flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="bg-[#f29100] text-black p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase italic tracking-tighter text-[#f29100]">Panel de Gestión Operativa</h3>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase opacity-80">
                      {esAdminGlobal ? 'Control Maestro de Sistema' : 'Supervisión de Centros y Clientes'}
                    </p>
                  </div>
                </div>
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest border border-zinc-800 px-2 py-1 group-hover:border-[#f29100] group-hover:text-[#f29100] transition-colors italic">Entrar →</span>
              </div>
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* MÓDULO SCRAP: Ahora siempre redirige al REGISTRO para todos */}
          {accesoModuloCentros && (
            <Link href="/dashboard/registro" className="group">
              <div className={`bg-white p-10 border-b-4 ${esSupervisorActivo ? 'border-blue-600' : 'border-black'} hover:border-red-600 transition-all shadow-sm h-full flex flex-col justify-between border-t border-x border-gray-100`}>
                <div>
                  <div className="flex justify-between items-start mb-8">
                    <div className={`p-4 ${esSupervisorActivo ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-black'} group-hover:bg-red-600 group-hover:text-white transition-colors`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                    </div>
                    {/* Mantenemos la etiqueta visual de supervisor para que sepa que tiene rango */}
                    {esSupervisorActivo && (
                      <span className="text-[10px] font-black uppercase tracking-widest border px-2 py-1 text-blue-600 border-blue-200">
                        Rango: Supervisor
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-black uppercase italic mb-3 tracking-tighter text-gray-900 group-hover:text-red-600 transition-colors">
                    Registro Pieza NOK
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed font-bold uppercase opacity-80">
                    Reporte de incidencias y avisos de calidad en tiempo real para tus centros.
                  </p>
                </div>
              </div>
            </Link>
          )}

          {/* MÓDULO CAMPA (Próximamente) */}
          <div className="relative group cursor-not-allowed">
            <div className="bg-white p-10 border-b-4 border-gray-200 grayscale opacity-60 shadow-sm h-full flex flex-col justify-between border-t border-x border-gray-100">
              <div>
                <div className="flex justify-between items-start mb-8">
                  <div className="bg-gray-50 p-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"/><path d="M12 12v4"/><path d="M9 14h6"/></svg>
                  </div>
                  <span className="text-[10px] font-black text-[#f29100] uppercase tracking-widest border border-[#f29100] px-2 py-1">En Desarrollo</span>
                </div>
                <h3 className="text-2xl font-black uppercase italic mb-3 tracking-tighter text-gray-400">CAMPA CONTROL</h3>
                <p className="text-sm text-gray-300 leading-relaxed font-bold uppercase opacity-80">Gestión de campas y logística de vehículos.</p>
              </div>
            </div>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
          <p>CLA SCRAP SYSTEM v2.1 // Terminal: {usuario?.email}</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-gray-900 font-sans italic">Sistema Activo</span>
          </div>
        </div>
      </div>
    </div>
  );
}