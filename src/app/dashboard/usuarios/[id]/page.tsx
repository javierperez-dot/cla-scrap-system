'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/ui/Navbar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

export default function PerfilUsuarioPage() {
  const { id } = useParams();
  const router = useRouter();

  const [usuario, setUsuario] = useState<any>(null);
  const [servicios, setServicios] = useState<any[]>([]);
  const [asignaciones, setAsignaciones] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardandoUser, setGuardandoUser] = useState(false);

  const fetchData = async () => {
    const { data: user } = await supabase.from('usuarios').select('*').eq('id', id).single();
    const { data: servs } = await supabase.from('servicios').select('*').order('nombre_servicio');
    const { data: asig } = await supabase.from('usuario_servicios').select('*').eq('usuario_id', id);
    
    setUsuario(user);
    setServicios(servs || []);
    setAsignaciones(asig || []);
    setCargando(false);
  };

  useEffect(() => { fetchData(); }, [id]);

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
          rol: usuario.rol
        })
        .eq('id', id);

      if (error) throw error;
      alert('EXPEDIENTE ACTUALIZADO CORRECTAMENTE');
    } catch (err: any) {
      alert('ERROR: ' + err.message);
    } finally {
      setGuardandoUser(false);
    }
  };

  const toggleServicio = async (servicioId: string) => {
    const asignacionActual = asignaciones.find(a => a.servicio_id === servicioId);
    
    try {
      if (asignacionActual) {
        const { error } = await supabase.from('usuario_servicios').delete().eq('id', asignacionActual.id);
        if (error) throw error;
      } else {
        // Volvemos a la inserción directa que funcionaba
        const { error } = await supabase.from('usuario_servicios').insert([{ 
          usuario_id: id, 
          servicio_id: servicioId,
          can_create: false, 
          can_delete: false
        }]);
        if (error) throw error;
      }
      fetchData(); 
    } catch (err: any) {
      alert('ERROR: ' + err.message);
    }
  };

  const updatePermiso = async (asignacionId: string, campo: string, valor: boolean) => {
    try {
      const { error } = await supabase.from('usuario_servicios').update({ [campo]: valor }).eq('id', asignacionId);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert('ERROR: ' + err.message);
    }
  };

  if (cargando) return <div className="p-20 font-black uppercase italic animate-pulse text-center">Sincronizando CLA System...</div>;

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-[12px]">
      <Navbar />
      <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
        <div className="bg-white p-6 shadow-sm border-l-8 border-black flex justify-between items-center">
          <div>
            <h2 className="text-[9px] font-black text-[#f29100] uppercase tracking-[0.3em] italic leading-none mb-2">Expediente Maestro</h2>
            <h1 className="text-2xl font-black italic uppercase tracking-tighter leading-none">{usuario?.nombre}</h1>
          </div>
          <Link href="/dashboard/usuarios" className="bg-black text-white px-5 py-2 text-[10px] font-black uppercase italic hover:bg-[#f29100] transition-all">
            ← Guardar y Volver
          </Link>
        </div>

        <div className="bg-white p-8 shadow-xl border-t-4 border-black">
          <h2 className="text-[10px] font-black uppercase mb-8 tracking-[0.2em] text-gray-400 italic border-b pb-4">Editar Datos Personales</h2>
          <form onSubmit={handleUserUpdate} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-6">
              <Input label="Nombre y Apellidos" value={usuario?.nombre} onChange={(e) => setUsuario({...usuario, nombre: e.target.value})} required />
              <Input label="DNI / NIE" value={usuario?.dni} onChange={(e) => setUsuario({...usuario, dni: e.target.value})} required />
            </div>
            <div className="space-y-6">
              <Input label="Email Corporativo" value={usuario?.email} onChange={(e) => setUsuario({...usuario, email: e.target.value})} required />
              <Input label="Contraseña" type="password" value={usuario?.password} onChange={(e) => setUsuario({...usuario, password: e.target.value})} required />
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

        <div className="space-y-4">
          <div className="bg-black text-white p-2 text-center font-black uppercase italic tracking-[0.2em] text-[10px]">
            Perfiles / Permisos de Acceso a Centros
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {servicios.map((s) => {
              const asig = asignaciones.find(a => a.servicio_id === s.id);
              return (
                <div key={s.id} className={`border-2 transition-all duration-300 ${asig ? 'border-black bg-white shadow-md' : 'border-gray-200 bg-gray-50 opacity-70'}`}>
                  <div className={`p-3 border-b flex justify-between items-center ${asig ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>
                    <div className="overflow-hidden">
                      <p className="font-black uppercase italic truncate leading-none">{s.nombre_servicio}</p>
                      <p className={`text-[8px] font-bold uppercase ${asig ? 'text-[#f29100]' : 'text-gray-400'}`}>{s.provincia}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={!!asig} onChange={() => toggleServicio(s.id)} />
                      <div className="w-10 h-5 bg-gray-400 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0070f3]"></div>
                    </label>
                  </div>
                  <div className="p-3 h-14 flex items-center justify-around bg-white">
                    {asig ? (
                      <>
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input type="checkbox" checked={asig.can_create} onChange={(e) => updatePermiso(asig.id, 'can_create', e.target.checked)} className="w-3 h-3 accent-black" />
                          <span className="font-black uppercase text-[9px] italic group-hover:text-[#f29100]">Crear</span>
                        </label>
                        <div className="w-[1px] h-4 bg-gray-200" />
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input type="checkbox" checked={asig.can_delete} onChange={(e) => updatePermiso(asig.id, 'can_delete', e.target.checked)} className="w-3 h-3 accent-black" />
                          <span className="font-black uppercase text-[9px] italic group-hover:text-red-600">Borrar</span>
                        </label>
                      </>
                    ) : (
                      <p className="text-[9px] font-black uppercase text-gray-300 italic tracking-widest text-center w-full">Sin Acceso</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}