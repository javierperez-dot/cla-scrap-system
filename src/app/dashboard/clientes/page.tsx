'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/ui/Navbar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

export default function ClientesPage() {
  const [formData, setFormData] = useState({ 
    id: '', 
    nombre_empresa: '', 
    contacto_nombre: '', 
    email_notificacion: '', 
    emails_cc: '', 
    telefono: '',
    servicio_id: '',
    usuario_acceso_id: '',
    tipo_acceso: 'SOLO EMAIL' // Valor por defecto solicitado
  });
  const [clientes, setClientes] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [usuariosCliente, setUsuariosCliente] = useState<any[]>([]);
  const [editando, setEditando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const cargarDatos = async (termino = '') => {
    // Carga de servicios
    const { data: servs } = await supabase.from('servicios').select('id, nombre_servicio').order('nombre_servicio');
    setServicios(servs || []);

    // Carga de usuarios con rol 'Cliente'
    const { data: users } = await supabase.from('usuarios').select('id, nombre, email').eq('rol', 'Cliente').order('nombre');
    setUsuariosCliente(users || []);

    // Carga de clientes con sus relaciones
    let query = supabase.from('clientes').select('*, servicios!left(nombre_servicio), usuarios!left(nombre)').order('nombre_empresa');
    if (termino) {
      query = query.or(`nombre_empresa.ilike.%${termino}%,contacto_nombre.ilike.%${termino}%`);
    }
    const { data } = await query;
    setClientes(data || []);
  };

  useEffect(() => { cargarDatos(busqueda); }, [busqueda]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.servicio_id) return alert("ATENCIÓN: Debe asignar un servicio.");
    
    // Validación de seguridad para accesos con panel
    if ((formData.tipo_acceso === 'ACCESO A PANEL' || formData.tipo_acceso === 'TODAS') && !formData.usuario_acceso_id) {
        return alert("DEBE VINCULAR UN USUARIO DE ACCESO PARA ESTE NIVEL DE PERMISO");
    }

    setCargando(true);
    const { id, ...datosSinId } = formData;
    const payload = {
      ...datosSinId,
      nombre_empresa: datosSinId.nombre_empresa.toUpperCase().trim(),
      usuario_acceso_id: datosSinId.tipo_acceso === 'SOLO EMAIL' ? null : datosSinId.usuario_acceso_id
    };

    try {
      const { error } = editando 
        ? await supabase.from('clientes').update(payload).eq('id', id)
        : await supabase.from('clientes').insert([payload]);
      
      if (error) throw error;
      alert(editando ? 'REGISTRO ACTUALIZADO' : 'NUEVA ENTIDAD CONFIGURADA');
      cancelarEdicion();
      cargarDatos(busqueda);
    } catch (err: any) {
      alert('ERROR: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  const seleccionarParaEditar = (c: any) => { 
    setFormData({
      id: c.id,
      nombre_empresa: c.nombre_empresa,
      contacto_nombre: c.contacto_nombre,
      email_notificacion: c.email_notificacion,
      emails_cc: c.emails_cc || '',
      telefono: c.telefono,
      servicio_id: c.servicio_id || '',
      usuario_acceso_id: c.usuario_acceso_id || '',
      tipo_acceso: c.tipo_acceso || 'SOLO EMAIL'
    }); 
    setEditando(true); 
  };

  const cancelarEdicion = () => { 
    setFormData({ id: '', nombre_empresa: '', contacto_nombre: '', email_notificacion: '', emails_cc: '', telefono: '', servicio_id: '', usuario_acceso_id: '', tipo_acceso: 'SOLO EMAIL' }); 
    setEditando(false); 
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-[13px]">
      <Navbar />

      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 shadow-sm border-l-8 border-black">
          <div>
            <h2 className="text-[10px] font-black text-[#f29100] uppercase tracking-[0.4em] mb-2 italic">Configuración de Niveles</h2>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter">Gestión de Clientes CLA</h1>
          </div>
          <Link href="/dashboard/admin" className="bg-black text-white px-6 py-2 text-[10px] font-black uppercase italic shadow-md">← Volver al Panel</Link>
        </div>

        <div className="bg-white p-8 shadow-xl border-t-4 border-black">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-6">
              <Input label="Nombre Empresa" name="nombre_empresa" value={formData.nombre_empresa} onChange={handleChange} required />
              
              <div className="flex flex-col">
                <label className="text-[10px] font-black text-[#f29100] uppercase mb-1 italic tracking-widest">Nivel de Acceso (CONFIGURACIÓN)</label>
                <select 
                  name="tipo_acceso" 
                  value={formData.tipo_acceso} 
                  onChange={handleChange} 
                  className="bg-zinc-900 text-white p-3 text-xs font-black border-b-2 border-[#f29100] outline-none uppercase cursor-pointer"
                >
                  <option value="SOLO EMAIL">SIN ACCESO AL PANEL (SOLO EMAIL)</option>
                  <option value="ACCESO A PANEL">SOLO ACCESO AL PANEL</option>
                  <option value="TODAS">TODAS (EMAIL + PANEL)</option>
                </select>
              </div>

              {formData.tipo_acceso !== 'SOLO EMAIL' && (
                <div className="flex flex-col animate-in fade-in duration-500">
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1">Vincular Login del Cliente</label>
                    <select name="usuario_acceso_id" value={formData.usuario_acceso_id} onChange={handleChange} className="bg-zinc-100 p-3 text-xs font-black border-b-2 border-black outline-none uppercase" required>
                        <option value="">Seleccionar Usuario...</option>
                        {usuariosCliente.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                    </select>
                </div>
              )}

              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest leading-none">Servicio Principal</label>
                <select name="servicio_id" value={formData.servicio_id} onChange={handleChange} className="bg-gray-100 p-3 text-sm font-bold border-b-2 border-transparent focus:border-[#f29100] outline-none h-[46px]" required>
                  <option value="">Seleccionar...</option>
                  {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre_servicio}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-6 md:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Persona de Contacto" name="contacto_nombre" value={formData.contacto_nombre} onChange={handleChange} required />
                <Input label="Email Notificación" name="email_notificacion" value={formData.email_notificacion} onChange={handleChange} required />
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1">Emails en Copia (CC:)</label>
                <textarea name="emails_cc" value={formData.emails_cc} onChange={handleChange} className="bg-gray-100 p-3 text-xs font-mono h-[80px] outline-none border-b-2 border-zinc-200" placeholder="email1@mail.com, email2@mail.com" />
              </div>
              <Button type="submit" disabled={cargando}>{editando ? 'ACTUALIZAR CONFIGURACIÓN' : 'CREAR CLIENTE'}</Button>
              {editando && <button onClick={cancelarEdicion} className="w-full text-[10px] font-black text-red-500 uppercase mt-2">Descartar Cambios</button>}
            </div>
          </form>
        </div>

        <div className="bg-white shadow-xl border-t-4 border-[#f29100]">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] text-gray-400 uppercase border-b font-black italic bg-zinc-50">
                <th className="p-5">Empresa / Servicio</th>
                <th className="p-5">Nivel de Acceso</th>
                <th className="p-5">Contacto / PARA:</th>
                <th className="p-5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id} className="border-b hover:bg-zinc-50 transition-colors">
                  <td className="p-5">
                    <p className="font-black uppercase italic text-gray-900 leading-tight">{c.nombre_empresa}</p>
                    <p className="text-[9px] text-[#f29100] font-black uppercase mt-1 tracking-tighter">{c.servicios?.nombre_servicio}</p>
                  </td>
                  <td className="p-5">
                    <span className={`px-2 py-1 text-[9px] font-black uppercase rounded border ${
                      c.tipo_acceso === 'TODAS' ? 'bg-black text-[#f29100] border-black' : 
                      c.tipo_acceso === 'ACCESO A PANEL' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-zinc-100 text-zinc-400 border-zinc-200'
                    }`}>
                      {c.tipo_acceso}
                    </span>
                  </td>
                  <td className="p-5">
                    <p className="text-black font-bold uppercase leading-none mb-1">{c.contacto_nombre}</p>
                    <p className="text-[9px] font-mono text-blue-600">{c.email_notificacion}</p>
                  </td>
                  <td className="p-5 text-center">
                    <button onClick={() => seleccionarParaEditar(c)} className="text-[10px] font-black text-gray-400 hover:text-black uppercase italic">Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}