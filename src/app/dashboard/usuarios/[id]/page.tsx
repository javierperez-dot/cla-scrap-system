'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/ui/Navbar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { PermissionManager } from '@/components/admin/PermissionManager';

export default function PerfilUsuarioPage() {
  const { id } = useParams();

  const [usuario, setUsuario] = useState<any>(null);
  const [servicios, setServicios] = useState<any[]>([]);
  const [asignaciones, setAsignaciones] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardandoUser, setGuardandoUser] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const { data: user } = await supabase.from('usuarios').select('*').eq('id', id).single();
      const { data: servs } = await supabase.from('servicios').select('*').order('nombre_servicio');
      const { data: asig } = await supabase.from('usuario_servicios').select('*').eq('usuario_id', id);
      
      setUsuario(user);
      setServicios(servs || []);
      setAsignaciones(asig || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  const handleUserUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoUser(true);
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({
          nombre: usuario.nombre.toUpperCase().trim(),
          dni: usuario.dni.toUpperCase().trim(),
          email: usuario.email.toLowerCase().trim(),
          password: usuario.password,
          rol: usuario.rol,
          // PERSISTENCIA DEL NUEVO PERMISO MAESTRO
          tiene_acceso_centros: usuario.tiene_acceso_centros 
        })
        .eq('id', id);

      if (error) throw error;
      alert('EXPEDIENTE MAESTRO ACTUALIZADO');
    } catch (err: any) {
      alert('ERROR AL ACTUALIZAR: ' + err.message);
    } finally {
      setGuardandoUser(false);
    }
  };

  const toggleModulo = async (servicioId: string) => {
    const asignacionActual = asignaciones.find(a => a.servicio_id === servicioId);
    try {
      if (asignacionActual) {
        await supabase.from('usuario_servicios').delete().eq('id', asignacionActual.id);
      } else {
        await supabase.from('usuario_servicios').insert([{ 
          usuario_id: id, 
          servicio_id: servicioId,
          can_create: false, 
          can_delete: false,
          can_nok: false 
        }]);
      }
      fetchData(); 
    } catch (err: any) {
      alert('ERROR EN ASIGNACIÓN: ' + err.message);
    }
  };

  const updatePermiso = async (asignacionId: string, campo: string, valor: boolean) => {
    try {
      await supabase.from('usuario_servicios').update({ [campo]: valor }).eq('id', asignacionId);
      fetchData();
    } catch (err: any) {
      alert('ERROR EN PERMISOS: ' + err.message);
    }
  };

  if (cargando) return <div className="p-20 font-black uppercase italic animate-pulse text-center tracking-widest text-gray-400">Sincronizando...</div>;

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-[12px]">
      <Navbar />
      <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
        
        {/* HEADER EXPEDIENTE */}
        <div className="bg-white p-6 shadow-sm border-l-8 border-black flex justify-between items-center">
          <div>
            <h2 className="text-[9px] font-black text-[#f29100] uppercase tracking-[0.3em] italic leading-none mb-2">Expediente Maestro</h2>
            <h1 className="text-2xl font-black italic uppercase tracking-tighter leading-none">{usuario?.nombre}</h1>
          </div>
          <Link href="/dashboard/usuarios" className="bg-black text-white px-5 py-2 text-[10px] font-black uppercase italic hover:bg-[#f29100] transition-all">
            ← Guardar y Volver
          </Link>
        </div>

        {/* DATOS PERSONALES */}
        <div className="bg-white p-8 shadow-xl border-t-4 border-black">
          <h2 className="text-[10px] font-black uppercase mb-8 tracking-[0.2em] text-gray-400 italic border-b pb-4">Editar Datos Personales</h2>
          <form onSubmit={handleUserUpdate} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-6">
              <Input label="Nombre y Apellidos" value={usuario?.nombre || ''} onChange={(e) => setUsuario({...usuario, nombre: e.target.value})} required />
              <Input label="DNI / NIE" value={usuario?.dni || ''} onChange={(e) => setUsuario({...usuario, dni: e.target.value})} required />
            </div>
            <div className="space-y-6">
              <Input label="Email Corporativo" value={usuario?.email || ''} onChange={(e) => setUsuario({...usuario, email: e.target.value})} required />
              <Input label="Contraseña" type="password" value={usuario?.password || ''} onChange={(e) => setUsuario({...usuario, password: e.target.value})} required />
            </div>
            <div className="space-y-6 flex flex-col justify-between">
              <div className="flex flex-col">
                <label className="text-[9px] font-black text-gray-400 uppercase mb-1 tracking-widest italic">Nivel de Acceso</label>
                <select 
                  value={usuario?.rol} 
                  onChange={(e) => setUsuario({...usuario, rol: e.target.value})}
                  className="bg-gray-100 p-3 text-[11px] font-bold border-b-2 border-transparent focus:border-[#f29100] outline-none uppercase appearance-none cursor-pointer h-[46px]"
                >
                  <option value="Operario">Operario</option>
                  <option value="Administrador">Administrador</option>
                </select>
              </div>
              <Button type="submit" disabled={guardandoUser} className="w-full">
                {guardandoUser ? 'SINCRONIZANDO...' : 'ACTUALIZAR DATOS'}
              </Button>
            </div>
          </form>
        </div>

        {/* SECCIÓN DE PERMISOS / MÓDULOS (CON INTERRUPTOR MAESTRO) */}
        <div className="space-y-4">
          <div className="bg-black text-white p-2 flex justify-between items-center px-6 font-black uppercase italic tracking-[0.2em] text-[10px]">
            <span>Perfiles / Permisos de Acceso a Centros</span>
            
            <div className="flex items-center gap-3">
              <span className="text-[8px] text-[#f29100] hidden md:block">HABILITAR MÓDULO GLOBAL</span>
              <label className="relative inline-flex items-center cursor-pointer scale-90">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={usuario?.tiene_acceso_centros || false} 
                  onChange={(e) => setUsuario({...usuario, tiene_acceso_centros: e.target.checked})} 
                />
                <div className="w-10 h-5 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#f29100]"></div>
              </label>
            </div>
          </div>
          
          {usuario?.tiene_acceso_centros ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-500">
              {servicios.map((s) => (
                <PermissionManager
                  key={s.id}
                  servicio={s}
                  asignacion={asignaciones.find(a => a.servicio_id === s.id)}
                  onToggleModulo={toggleModulo}
                  onUpdatePermiso={updatePermiso}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white border-2 border-dashed border-gray-200 p-12 text-center opacity-50">
               <p className="text-[10px] font-black uppercase italic text-gray-300 tracking-[0.5em]">Módulo de Centros Desactivado</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}