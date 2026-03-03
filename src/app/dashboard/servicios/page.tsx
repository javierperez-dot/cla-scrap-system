'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/ui/Navbar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';


export default function ServiciosPage() {
  const [formData, setFormData] = useState({ 
    id: '', 
    nombre_servicio: '', 
    provincia: 'VALLADOLID', 
    jefe_servicio: '', 
    telefono_contacto: '', 
    mail_contacto: '' 
  });
  const [servicios, setServicios] = useState<any[]>([]);
  const [editando, setEditando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  // CARGA DE SERVICIOS PROTEGIDA
  const cargarServicios = async () => {
    try {
      // 1. Obtenemos el usuario del localStorage para verificar rol
      const userStr = localStorage.getItem('usuario_scrap');
      if (!userStr) return;
      const user = JSON.parse(userStr);

      let query = supabase.from('servicios').select('*').order('nombre_servicio', { ascending: true });

      // 2. Aplicamos filtro si no es Admin o Superadmin
      if (user.rol !== 'Administrador' && user.email !== 'javier.perez@randstad.es') {
        const { data: asignaciones } = await supabase
          .from('usuario_servicios')
          .select('servicio_id')
          .eq('usuario_id', user.id)
          .eq('is_supervisor', true);

        const idsAutorizados = asignaciones?.map(a => a.servicio_id) || [];
        query = query.in('id', idsAutorizados);
      }

      const { data, error } = await query;
      if (!error) setServicios(data || []);
    } catch (err) {
      console.error("Error cargando servicios protegidos");
    }
  };

  useEffect(() => {
    cargarServicios();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.name === 'mail_contacto' ? e.target.value : e.target.value.toUpperCase();
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);

    const payload = {
      nombre_servicio: formData.nombre_servicio.toUpperCase().trim(),
      provincia: formData.provincia.toUpperCase().trim(),
      jefe_servicio: formData.jefe_servicio.toUpperCase().trim(),
      telefono_contacto: formData.telefono_contacto.trim(),
      mail_contacto: formData.mail_contacto.toLowerCase().trim()
    };

    try {
      if (editando) {
        const { error } = await supabase.from('servicios').update(payload).eq('id', formData.id);
        if (error) throw error;
        alert('SERVICIO ACTUALIZADO EN MAYÚSCULAS');
      } else {
        const { error } = await supabase.from('servicios').insert([payload]);
        if (error) throw error;
        alert('NUEVO SERVICIO REGISTRADO EN MAYÚSCULAS');
      }
      
      cancelarEdicion();
      await cargarServicios();
    } catch (err: any) {
      alert('ERROR DE DB: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  const seleccionarParaEditar = (s: any) => {
    setFormData(s);
    setEditando(true);
  };

  const cancelarEdicion = () => {
    setFormData({ id: '', nombre_servicio: '', provincia: 'VALLADOLID', jefe_servicio: '', telefono_contacto: '', mail_contacto: '' });
    setEditando(false);
  };

  const borrarServicio = async (id: string) => {
    if (confirm('¿ELIMINAR ESTE CENTRO?')) {
      await supabase.from('servicios').delete().eq('id', id);
      cargarServicios();
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-gray-800 text-[13px]">
      <Navbar />

      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 shadow-sm border-l-8 border-[#f29100] gap-4">
          <div>
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-2 italic">Configuración Estructural</h2>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none">Gestión de Servicios CLA</h1>
          </div>
          <Link href="/dashboard/admin" className="bg-black text-white px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-[#f29100] transition-all italic shadow-lg">
            ← Volver a Administración
          </Link>
        </div>

        {/* FORMULARIO DE ALTA/EDICIÓN */}
        <div className="bg-white p-8 shadow-xl border-t-4 border-black text-left">
          <h2 className="text-xs font-black uppercase mb-8 tracking-[0.2em] border-b pb-4 text-gray-400 italic">
            {editando ? 'Modificar Registro' : 'Alta de Nuevo Centro Operativo'}
          </h2>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="space-y-6">
              <Input label="Nombre del Servicio" name="nombre_servicio" value={formData.nombre_servicio} onChange={handleChange} required />
              <div className="flex flex-col items-start">
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest leading-none">Sede / Provincia</label>
                <select 
                  name="provincia" 
                  value={formData.provincia} 
                  onChange={handleChange} 
                  className="bg-gray-100 p-3 text-sm font-bold border-b-2 border-transparent focus:border-[#f29100] outline-none uppercase h-[46px] w-full cursor-pointer transition-all"
                >
                  <option value="VALLADOLID">VALLADOLID</option>
                  <option value="PALENCIA">PALENCIA</option>
                  <option value="SEVILLA">SEVILLA</option>
                  <option value="MADRID">MADRID</option>
                  <option value="BARCELONA">BARCELONA</option>
                </select>
              </div>
            </div>

            <div className="space-y-6">
              <Input label="Jefe de Servicio" name="jefe_servicio" value={formData.jefe_servicio} onChange={handleChange} required />
              <Input label="Mail de Contacto" name="mail_contacto" type="email" value={formData.mail_contacto} onChange={handleChange} required />
            </div>

            <div className="space-y-6 flex flex-col justify-end">
              <Input label="Teléfono Directo" name="telefono_contacto" value={formData.telefono_contacto} onChange={handleChange} />
              <div className="flex flex-col gap-2 mt-4">
                <Button type="submit" disabled={cargando}>
                  {cargando ? 'CONECTANDO...' : (editando ? 'ACTUALIZAR DATOS' : 'GUARDAR EN SISTEMA')}
                </Button>
                {editando && (
                  <button type="button" onClick={cancelarEdicion} className="text-[10px] font-black text-red-500 uppercase hover:underline italic">
                    Cancelar Edición
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* FILTRO DE BÚSQUEDA */}
        <div className="bg-white p-4 shadow-lg border-l-4 border-[#f29100] flex items-center gap-4">
          <div className="text-gray-400 font-bold">🔍</div>
          <input 
            type="text" 
            placeholder="ESCRIBE AQUÍ PARA FILTRAR (PALENCIA, VALLADOLID...)" 
            className="w-full bg-transparent outline-none text-xs font-black uppercase tracking-widest placeholder:text-gray-300"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {/* TABLA DE RESULTADOS */}
        <div className="bg-white shadow-xl border-t-4 border-[#f29100]">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] text-gray-400 uppercase border-b bg-white font-black">
                  <th className="p-5">Servicio / Sede</th>
                  <th className="p-5">Responsable</th>
                  <th className="p-5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {servicios
                  .filter(s => {
                    const t = busqueda.toUpperCase().trim();
                    if (!t) return true;
                    return (
                      (s.nombre_servicio || "").toUpperCase().includes(t) ||
                      (s.provincia || "").toUpperCase().includes(t) ||
                      (s.jefe_servicio || "").toUpperCase().includes(t)
                    );
                  })
                  .map((s) => (
                    <tr key={s.id} className="border-b hover:bg-gray-50 transition-colors group">
                      <td className="p-5 text-left">
                        <p className="font-black text-base italic uppercase group-hover:text-[#f29100] transition-colors leading-none">{s.nombre_servicio}</p>
                        <p className="text-[10px] text-[#f29100] font-black uppercase tracking-[0.2em] mt-1 leading-none">{s.provincia}</p>
                      </td>
                      <td className="p-5 text-left">
                        <p className="text-xs font-black uppercase text-gray-700 leading-tight italic">{s.jefe_servicio}</p>
                        <p className="text-[10px] text-gray-400 font-mono mt-1">{s.mail_contacto}</p>
                      </td>
                      <td className="p-5 text-center">
                        <div className="flex justify-center gap-6">
                          <button onClick={() => seleccionarParaEditar(s)} className="text-[10px] font-black hover:text-black uppercase italic transition-colors">Editar</button>
                          <button onClick={() => borrarServicio(s.id)} className="text-[10px] font-black text-gray-300 hover:text-red-600 uppercase italic transition-colors">Borrar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}