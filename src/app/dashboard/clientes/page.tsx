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
    email_notificacion: '', // Este será el contacto principal (PARA:)
    emails_cc: '',          // NUEVO: Contactos en copia (CC:)
    telefono: '',
    servicio_id: '' 
  });
  const [clientes, setClientes] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [editando, setEditando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const cargarDatos = async (termino = '') => {
    const { data: servs } = await supabase.from('servicios').select('id, nombre_servicio').order('nombre_servicio');
    setServicios(servs || []);

    let query = supabase.from('clientes').select('*, servicios!left(nombre_servicio)').order('nombre_empresa');
    if (termino) {
      query = query.or(`nombre_empresa.ilike.%${termino}%,contacto_nombre.ilike.%${termino}%,email_notificacion.ilike.%${termino}%`);
    }
    const { data } = await query;
    setClientes(data || []);
  };

  useEffect(() => { 
    cargarDatos(busqueda); 
  }, [busqueda]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.servicio_id) return alert("ATENCIÓN: Debe asignar un servicio al cliente.");
    
    setCargando(true);

    const { id, ...datosSinId } = formData;
    const payload = {
      nombre_empresa: datosSinId.nombre_empresa.toUpperCase().trim(),
      contacto_nombre: datosSinId.contacto_nombre.toUpperCase().trim(),
      email_notificacion: datosSinId.email_notificacion.toLowerCase().trim(),
      emails_cc: datosSinId.emails_cc.toLowerCase().trim(), // Guardamos la lista de CC
      telefono: datosSinId.telefono.trim(),
      servicio_id: datosSinId.servicio_id 
    };

    try {
      if (editando) {
        const { error } = await supabase.from('clientes').update(payload).eq('id', id);
        if (error) throw error;
        alert('FICHA ACTUALIZADA CORRECTAMENTE');
      } else {
        const { error } = await supabase.from('clientes').insert([payload]);
        if (error) throw error;
        alert('CLIENTE VINCULADO AL SERVICIO SELECCIONADO');
      }

      cancelarEdicion();
      cargarDatos(busqueda);
    } catch (err: any) {
      alert('ERROR DE BASE DE DATOS: ' + err.message);
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
      emails_cc: c.emails_cc || '', // Cargamos CC si existe
      telefono: c.telefono,
      servicio_id: c.servicio_id || ''
    }); 
    setEditando(true); 
  };

  const cancelarEdicion = () => { 
    setFormData({ id: '', nombre_empresa: '', contacto_nombre: '', email_notificacion: '', emails_cc: '', telefono: '', servicio_id: '' }); 
    setEditando(false); 
  };

  const borrarCliente = async (id: string) => {
    if (confirm('¿ELIMINAR ESTE REGISTRO DE CLIENTE/SERVICIO?')) {
      await supabase.from('clientes').delete().eq('id', id);
      cargarDatos(busqueda);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-gray-800 text-[13px]">
      <Navbar />

      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 shadow-sm border-l-8 border-black gap-4">
          <div>
            <h2 className="text-[10px] font-black text-[#f29100] uppercase tracking-[0.4em] mb-2 italic">Control de Entidades</h2>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none">Gestión de Clientes CLA</h1>
          </div>
          <Link href="/dashboard/admin" className="bg-black text-white px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-[#f29100] transition-all italic shadow-lg">
            ← Volver al Panel
          </Link>
        </div>

        <div className="bg-white p-8 shadow-xl border-t-4 border-black">
          <h2 className="text-xs font-black uppercase mb-8 tracking-[0.2em] border-b pb-4 text-gray-400 italic">
            {editando ? 'Modificar Registro de Empresa' : 'Registro de Nueva Razón Social'}
          </h2>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-6">
              <Input label="Nombre Empresa" name="nombre_empresa" value={formData.nombre_empresa} onChange={handleChange} required />
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">Servicio Asociado</label>
                <select 
                  name="servicio_id" 
                  value={formData.servicio_id} 
                  onChange={handleChange} 
                  className="bg-gray-100 p-3 text-sm font-bold border-b-2 border-transparent focus:border-[#f29100] h-[46px] outline-none uppercase cursor-pointer text-gray-800"
                  required
                >
                  <option value="">Seleccionar Servicio...</option>
                  {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre_servicio}</option>)}
                </select>
              </div>
              <Input label="Teléfono" name="telefono" value={formData.telefono} onChange={handleChange} required />
            </div>

            <div className="space-y-6 md:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Persona de Contacto" name="contacto_nombre" value={formData.contacto_nombre} onChange={handleChange} required />
                <Input label="Email Principal (PARA:)" name="email_notificacion" value={formData.email_notificacion} onChange={handleChange} required />
              </div>
              
              <div className="flex flex-col mt-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">Emails en Copia (CC:) - Separar por comas</label>
                <textarea 
                  name="emails_cc"
                  value={formData.emails_cc}
                  onChange={handleChange}
                  placeholder="ejemplo1@mail.com, ejemplo2@mail.com"
                  className="bg-gray-100 p-3 text-xs font-mono border-b-2 border-transparent focus:border-[#f29100] outline-none h-[80px] resize-none"
                />
                <p className="text-[9px] text-gray-400 mt-1 italic font-bold">Añade aquí los emails secundarios que recibirán copia de los registros NOK.</p>
              </div>

              <div className="flex flex-col gap-2 mt-4">
                <Button type="submit" disabled={cargando}>
                  {cargando ? 'CONECTANDO...' : editando ? 'ACTUALIZAR DATOS' : 'Guardar en Base de Datos'}
                </Button>
                {editando && (
                  <button type="button" onClick={cancelarEdicion} className="text-[10px] font-black text-red-500 hover:underline uppercase">
                    Cancelar Edición
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* BUSCADOR */}
        <div className="bg-white p-4 shadow-lg border-l-4 border-[#f29100] flex items-center gap-4">
          <div className="bg-gray-100 p-2 rounded text-xs">🔍</div>
          <input 
            type="text" 
            placeholder="FILTRAR POR EMPRESA, CONTACTO O EMAIL..." 
            className="w-full bg-transparent outline-none text-xs font-black uppercase tracking-widest placeholder:text-gray-300"
            value={busqueda} 
            onChange={(e) => setBusqueda(e.target.value)} 
          />
        </div>

        {/* TABLA DE RESULTADOS */}
        <div className="bg-white shadow-xl border-t-4 border-[#f29100]">
          <div className="p-6 bg-gray-50 border-b flex justify-between items-center text-xs font-black uppercase tracking-[0.2em] text-gray-500 italic">
            Empresas por Servicio en Sistema
            <span className="text-[10px] text-[#f29100]">Total: {clientes.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] text-gray-400 uppercase border-b bg-white font-black">
                  <th className="p-5">Empresa / Servicio</th>
                  <th className="p-5">Responsable / PARA:</th>
                  <th className="p-5">Emails en CC:</th>
                  <th className="p-5 text-center">Gestión</th>
                </tr>
              </thead>
              <tbody>
                {clientes.length > 0 ? (
                  clientes.map((c) => (
                    <tr key={c.id} className="border-b hover:bg-gray-50 transition-colors group">
                      <td className="p-5">
                        <p className="font-black italic uppercase text-gray-900 group-hover:text-[#f29100] transition-colors leading-tight">{c.nombre_empresa}</p>
                        <p className="text-[9px] text-[#f29100] font-black uppercase tracking-tighter italic leading-none mt-1">
                          Área: {c.servicios?.nombre_servicio || 'SIN ASIGNAR'}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1 font-bold">{c.telefono}</p>
                      </td>
                      <td className="p-5 uppercase font-bold text-gray-600">
                        <p className="text-black">{c.contacto_nombre}</p>
                        <p className="text-[10px] font-mono lowercase text-blue-600 underline">{c.email_notificacion}</p>
                      </td>
                      <td className="p-5">
                        <p className="text-[9px] font-mono text-gray-500 break-words max-w-[200px]">
                          {c.emails_cc || <span className="text-gray-300 italic">SIN COPIAS</span>}
                        </p>
                      </td>
                      <td className="p-5 text-center">
                        <div className="flex justify-center gap-6">
                          <button onClick={() => seleccionarParaEditar(c)} className="text-[10px] font-black text-gray-300 hover:text-black uppercase italic transition-colors">Editar</button>
                          <button onClick={() => borrarCliente(c.id)} className="text-[10px] font-black text-gray-400 hover:text-red-600 uppercase italic transition-colors">Borrar</button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={4} className="p-10 text-center text-gray-300 italic font-black uppercase text-xs">Sin registros</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}