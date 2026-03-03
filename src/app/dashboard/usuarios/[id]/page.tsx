'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/ui/Navbar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

export default function PerfilUsuarioPage() {
  const { id } = useParams();

  const [usuario, setUsuario] = useState<any>(null);
  const [servicios, setServicios] = useState<any[]>([]);
  const [asignaciones, setAsignaciones] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardandoUser, setGuardandoUser] = useState(false);
  const [me, setMe] = useState<any>(null);

  const SUPERADMIN_EMAIL = 'javier.perez@randstad.es';

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const { data: user } = await supabase.from('usuarios').select('*').eq('id', id).single();
      const { data: servs } = await supabase.from('servicios').select('*').order('nombre_servicio');
      const { data: asig } = await supabase.from('usuario_servicios').select('*').eq('usuario_id', id);
      
      setUsuario(user);
      setServicios(servs || []);
      setAsignaciones(asig || []);
    } catch (error) {
      console.log("Error de sincronización con Supabase");
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => { 
    const userStr = localStorage.getItem('usuario_scrap');
    if (userStr) setMe(JSON.parse(userStr));
    fetchData(); 
  }, [fetchData]);

  // Determinar si el usuario actual tiene poder total
  const esAdminTotal = me?.rol === 'Administrador' || me?.email === SUPERADMIN_EMAIL;

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
          tiene_acceso_centros: usuario.tiene_acceso_centros 
        })
        .eq('id', id);

      if (error) throw error;
      alert('EXPEDIENTE ACTUALIZADO CON ÉXITO');
    } catch (err: any) {
      alert('ERROR AL ACTUALIZAR PERFIL');
    } finally {
      setGuardandoUser(false);
    }
  };

  const toggleModulo = async (servicioId: string) => {
    if (!esAdminTotal) return; // Bloqueo de seguridad
    
    const asignacionActual = asignaciones.find(a => a.servicio_id === servicioId);
    try {
      if (asignacionActual) {
        setAsignaciones(prev => prev.filter(a => a.id !== asignacionActual.id));
        const { error } = await supabase.from('usuario_servicios').delete().eq('id', asignacionActual.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('usuario_servicios').insert([{ 
          usuario_id: id, 
          servicio_id: servicioId,
          can_create: true, 
          is_supervisor: false 
        }]).select().single();
        
        if (error) throw error;
        if (data) setAsignaciones(prev => [...prev, data]);
      }
    } catch (err: any) {
      alert('ERROR: ' + err.message);
      fetchData(); 
    }
  };

  const updatePermiso = async (asignacionId: string, campo: string, valor: boolean) => {
    if (!esAdminTotal) return; // Bloqueo de seguridad
    try {
      setAsignaciones(prev => prev.map(a => a.id === asignacionId ? { ...a, [campo]: valor } : a));
      const { error } = await supabase.from('usuario_servicios').update({ [campo]: valor }).eq('id', asignacionId);
      if (error) throw error;
    } catch (err: any) {
      fetchData();
    }
  };

  if (cargando) return <div className="p-20 text-center animate-pulse font-black italic text-gray-400">Restaurando configuración...</div>;

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-[12px]">
      <Navbar />
      <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
        
        <div className="bg-white p-6 shadow-sm border-l-8 border-black flex justify-between items-center">
          <div>
            <h2 className="text-[9px] font-black text-[#f29100] uppercase tracking-[0.3em] mb-2 leading-none italic">Configuración Maestra</h2>
            <h1 className="text-2xl font-black italic uppercase tracking-tighter leading-none">{usuario?.nombre}</h1>
          </div>
          <Link href="/dashboard/usuarios" className="bg-black text-white px-5 py-2 text-[10px] font-black uppercase italic shadow-md">
            ← Volver a la Lista
          </Link>
        </div>

        <div className="bg-white p-8 shadow-xl border-t-4 border-black">
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
                <label className="text-[9px] font-black text-gray-400 uppercase mb-1 tracking-widest italic">Rol de Sistema</label>
                {/* SELECT PROTEGIDO PARA SUPERVISORES */}
                <select 
                  value={usuario?.rol} 
                  disabled={!esAdminTotal}
                  onChange={(e) => setUsuario({...usuario, rol: e.target.value})}
                  className={`bg-gray-100 p-3 text-[11px] font-bold border-b-2 border-transparent focus:border-[#f29100] outline-none uppercase appearance-none h-[46px] ${!esAdminTotal ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                >
                  <option value="Operario">Operario</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Administrador">Administrador</option>
                </select>
                {!esAdminTotal && <p className="text-[7px] font-black text-red-500 uppercase mt-1 italic tracking-widest">Solo lectura de Rol</p>}
              </div>
              <Button type="submit" disabled={guardandoUser} className="w-full">
                {guardandoUser ? 'Guardando...' : 'Actualizar Datos'}
              </Button>
            </div>
          </form>
        </div>

        <div className="space-y-4">
          <div className="bg-black text-white p-2 flex justify-between items-center px-6 font-black uppercase italic text-[10px]">
            <span>Módulos y Permisos por Centro de Trabajo</span>
            {/* TOGGLE PROTEGIDO */}
            <label className={`relative inline-flex items-center scale-75 ${!esAdminTotal ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
              <input 
                type="checkbox" 
                className="sr-only peer" 
                disabled={!esAdminTotal}
                checked={usuario?.tiene_acceso_centros || false} 
                onChange={(e) => setUsuario({...usuario, tiene_acceso_centros: e.target.checked})} 
              />
              <div className="w-10 h-5 bg-gray-600 rounded-full peer peer-checked:bg-[#f29100]"></div>
            </label>
          </div>
          
          {usuario?.tiene_acceso_centros && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
              {servicios.map((s) => {
                const asignacion = asignaciones.find(a => a.servicio_id === s.id);
                return (
                  <div key={s.id} className={`p-5 border-l-8 shadow-sm h-[175px] flex flex-col justify-between transition-all duration-300 ${asignacion ? 'bg-white border-[#f29100]' : 'bg-gray-50 border-gray-200 opacity-50'}`}>
                    <div className="flex flex-col h-full">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-[10px] font-black uppercase italic text-gray-900 leading-tight w-2/3 truncate">{s.nombre_servicio}</h3>
                        {/* BOTÓN ASIGNAR PROTEGIDO */}
                        {esAdminTotal && (
                          <button onClick={() => toggleModulo(s.id)} className={`text-[8px] font-black uppercase px-3 py-1 border-2 transition-all ${asignacion ? 'bg-white text-red-600 border-red-100 shadow-sm' : 'bg-black text-white border-black'}`}>
                            {asignacion ? 'Quitar' : 'Asignar'}
                          </button>
                        )}
                      </div>

                      <div className="mt-auto h-16 flex flex-col justify-end">
                        {asignacion && (
                          <div className="space-y-1 animate-in fade-in duration-300">
                            <label className={`flex items-center justify-between text-[8px] font-bold text-gray-400 uppercase ${!esAdminTotal ? 'cursor-default' : 'cursor-pointer'}`}>
                              <span>Registrar NOK</span>
                              <input 
                                type="checkbox" 
                                className="w-3 h-3 accent-black" 
                                disabled={!esAdminTotal}
                                checked={asignacion.can_create} 
                                onChange={(e) => updatePermiso(asignacion.id, 'can_create', e.target.checked)} 
                              />
                            </label>
                            <label className={`flex items-center justify-between bg-blue-50 p-1 px-2 rounded-sm border border-blue-100 ${!esAdminTotal ? 'cursor-default' : 'cursor-pointer'}`}>
                              <span className="text-[8px] font-black text-blue-700 uppercase italic">Supervisor de Centro</span>
                              <input 
                                type="checkbox" 
                                className="w-3 h-3 accent-blue-600" 
                                disabled={!esAdminTotal}
                                checked={asignacion.is_supervisor || false} 
                                onChange={(e) => updatePermiso(asignacion.id, 'is_supervisor', e.target.checked)} 
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}