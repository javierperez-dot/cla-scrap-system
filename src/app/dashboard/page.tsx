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
  const [conteoPresentes, setConteoPresentes] = useState(0); 
  const [servicioClienteId, setServicioClienteId] = useState<string | null>(null); 
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
    // 1. Superadmin (Acceso Maestro por Email)
    if (email === 'javier.perez@randstad.es') {
      setAccesoModuloCentros(true);
      setEsSupervisorActivo(true);
      fetchConteoTurnos();
      return;
    }

    try {
      // Miramos la tabla usuarios (image_3df5c1)
      const { data: userData, error: userError }: any = await supabase
        .from('usuarios')
        .select('tiene_acceso_centros, rol') 
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      
      setAccesoModuloCentros(userData?.tiene_acceso_centros === true);

      // Verificación de servicios asignados (image_3d974c)
      const { data: serviceData, error: serviceError }: any = await supabase
        .from('usuario_servicios')
        .select('servicio_id, is_supervisor')
        .eq('usuario_id', userId);

      if (serviceError) console.error("Error en servicios:", serviceError);

      // Lógica de IDs para Clientes/Supervisores
      const ids = serviceData?.map((s: any) => s.servicio_id) || [];
      if (ids.length > 0) setServicioClienteId(ids[0]); // Cogemos el primero para el link

      const esSupPorRol = userData?.rol === 'Supervisor';
      const esMaestroPorRol = userData?.rol === 'Maestro'; 
      const esSupPorCentro = serviceData && serviceData.some((s: any) => s.is_supervisor);
      
      const esSupervisor = esSupPorRol || esSupPorCentro || esMaestroPorRol;
      setEsSupervisorActivo(esSupervisor);

      // Si es supervisor o cliente, cargamos el contador
      if (esSupervisor || userData?.rol === 'Cliente') {
        fetchConteoTurnos(ids.length > 0 ? ids : null);
      }
      
    } catch (err) {
      console.error("Error crítico de seguridad:", err);
      setAccesoModuloCentros(false);
    }
  };

  const fetchConteoTurnos = async (ids?: string[] | null) => {
    const hoy = new Date().toISOString().split('T')[0];
    let query = supabase
      .from('gestion_turnos')
      .select('*', { count: 'exact', head: true })
      .eq('fecha_turno', hoy)
      .eq('estado_presencia', 'Presente');
    
    if (ids && ids.length > 0) {
      query = query.in('servicio_id', ids);
    }
    
    const { count } = await query;
    setConteoPresentes(count || 0);
  };

  if (!usuario || accesoModuloCentros === null) return (
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center font-black uppercase italic animate-pulse text-gray-400 tracking-widest text-xs">
      Sincronizando seguridad cla...
    </div>
  );

  const esMaestro = usuario.rol === 'Maestro' || usuario.email === 'javier.perez@randstad.es';
  const esAdminGlobal = usuario.rol === 'Administrador' || esMaestro;
  const esCliente = usuario.rol === 'Cliente';
  const esTrabajador = usuario.rol === 'Trabajador' || usuario.rol === 'Operario';
  const mostrarAccesoGestion = esAdminGlobal || esSupervisorActivo;

  return (
    <div className="min-h-screen bg-[#f0f2f5] font-sans">
      <Navbar />

      <div className="p-8 max-w-5xl mx-auto space-y-8">
        
        {esMaestro && (
          <div className="bg-black p-2 text-center border-b-2 border-[#f29100]">
            <p className="text-[9px] font-black text-[#f29100] uppercase tracking-[0.4em] animate-pulse">
              ★★★ SESIÓN DE CONTROL MAESTRO ACTIVADA ★★★
            </p>
          </div>
        )}

        {/* PANEL DE GESTIÓN OPERATIVA */}
        {mostrarAccesoGestion && !esCliente && (
          <div className="mt-4">
            <Link href="/dashboard/admin" className="group">
              <div className="bg-black text-white p-6 border-l-4 border-[#f29100] hover:bg-zinc-900 transition-all shadow-xl flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className={`p-2 font-black italic text-xs ${esMaestro ? 'bg-white text-black' : 'bg-[#f29100] text-black'}`}>
                    {esMaestro ? 'MSTR' : 'GEST'}
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase italic tracking-tighter text-[#f29100]">Panel de Gestión Operativa</h3>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase opacity-80 leading-none mt-1">
                      {esMaestro ? 'Control Total de Infraestructura y Usuarios' : 'Supervisión de Centros y Clientes'}
                    </p>
                  </div>
                </div>
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest border border-zinc-800 px-2 py-1 group-hover:border-[#f29100] group-hover:text-[#f29100] transition-colors italic">Entrar →</span>
              </div>
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* MÓDULO 01: REGISTRO PIEZA NOK */}
          {!esCliente && (accesoModuloCentros || esMaestro) && (
            <Link href="/dashboard/registro" className="group">
              <div className={`bg-white p-10 border-b-4 ${esSupervisorActivo ? 'border-blue-600' : 'border-black'} hover:border-red-600 transition-all shadow-sm h-full flex flex-col justify-between border-t border-x border-gray-100`}>
                <div>
                  <div className="flex justify-between items-start mb-8">
                    <div className={`p-4 ${esSupervisorActivo ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-black'} group-hover:bg-red-600 group-hover:text-white transition-colors`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                    </div>
                  </div>
                  <h3 className="text-2xl font-black uppercase italic mb-3 tracking-tighter text-gray-900 group-hover:text-red-600 transition-colors">Registro Pieza NOK</h3>
                  <p className="text-sm text-gray-400 leading-relaxed font-bold uppercase opacity-80">Reporte de incidencias y avisos de calidad.</p>
                </div>
              </div>
            </Link>
          )}

          {/* MÓDULO 02: MI TERMINAL */}
          {(esTrabajador || esSupervisorActivo || esAdminGlobal) && !esCliente && (
            <Link href="/dashboard/terminal" className="group">
              <div className="bg-white p-10 border-b-4 border-black hover:border-[#f29100] transition-all shadow-sm h-full flex flex-col justify-between border-t border-x border-gray-100 relative">
                <div>
                  <div className="flex justify-between items-start mb-8">
                    <div className="bg-zinc-100 text-black p-4 group-hover:bg-black group-hover:text-[#f29100] transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>
                    </div>
                    <span className="text-[10px] font-black text-black uppercase tracking-widest border border-zinc-200 px-2 py-1 italic">Acceso Operario</span>
                  </div>
                  <h3 className="text-2xl font-black uppercase italic mb-3 tracking-tighter text-gray-900 group-hover:text-[#f29100]">Mi Terminal</h3>
                  <p className="text-sm text-gray-400 font-bold uppercase opacity-80 leading-tight">Fichaje de jornada e instrucciones diarias.</p>
                </div>
              </div>
            </Link>
          )}

          {/* MÓDULO 03: GESTIÓN DE TURNOS */}
          {mostrarAccesoGestion && !esCliente && (
            <Link href="/dashboard/turnos" className="group">
              <div className="bg-white p-10 border-b-4 border-[#f29100] hover:border-black transition-all shadow-sm h-full flex flex-col justify-between border-t border-x border-gray-100 relative">
                {esSupervisorActivo && (
                  <div className="absolute top-0 right-0 bg-[#f29100] text-black font-black px-3 py-1 text-sm italic">{conteoPresentes} En Puesto</div>
                )}
                <div>
                  <div className="flex justify-between items-start mb-8">
                    <div className="bg-[#f29100]/10 text-[#f29100] p-4 group-hover:bg-black group-hover:text-white transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                    </div>
                  </div>
                  <h3 className="text-2xl font-black uppercase italic mb-3 tracking-tighter text-gray-900">Gestión de Turnos</h3>
                  <p className="text-sm text-gray-400 font-bold uppercase opacity-80 leading-tight">Planificación y asignación de puestos.</p>
                </div>
              </div>
            </Link>
          )}

          {/* MÓDULO 04: CONSULTA CLIENTE */}
          {(esCliente || esAdminGlobal) && (
            <Link href={`/dashboard/consulta-cliente?servicio=${servicioClienteId}`} className="group">
              <div className="bg-white p-10 border-b-4 border-green-600 hover:border-black transition-all shadow-sm h-full flex flex-col justify-between border-t border-x border-gray-100 relative">
                {esCliente && (
                  <div className="absolute top-0 right-0 bg-green-600 text-white font-black px-3 py-1 text-sm italic">{conteoPresentes} Operarios en Planta</div>
                )}
                <div>
                  <div className="flex justify-between items-start mb-8">
                    <div className="bg-green-50 text-green-600 p-4 group-hover:bg-black group-hover:text-white transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                    </div>
                  </div>
                  <h3 className="text-2xl font-black uppercase italic mb-3 tracking-tighter text-gray-900 group-hover:text-green-600">Consulta Cliente</h3>
                  <p className="text-sm text-gray-400 font-bold uppercase opacity-80 leading-tight">Monitorización del servicio en tiempo real.</p>
                </div>
              </div>
            </Link>
          )}

        </div>

        {/* FOOTER */}
        <div className="mt-12 pt-8 border-t border-gray-200 flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
          <p>CLA SCRAP SYSTEM v2.8 // Terminal: {usuario?.email} ({usuario?.rol})</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-gray-900 font-sans italic">Sistema Activo</span>
          </div>
        </div>
      </div>
    </div>
  );
}