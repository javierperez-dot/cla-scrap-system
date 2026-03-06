'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/ui/Navbar';
import { supabase } from '@/lib/supabase';

export default function ReportesSupervisorPage() {
  const [turnos, setTurnos] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);

  const [filtroServicio, setFiltroServicio] = useState('');
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    cargarServicios();
    consultarDatos();
  }, []);

  const cargarServicios = async () => {
    const { data } = await supabase.from('servicios').select('*');
    setServicios(data || []);
  };

  const consultarDatos = async () => {
    setCargando(true);
    // Ajuste de consulta para que coincida con la imagen_3f5aa2 de Supabase
    let query = supabase
      .from('gestion_turnos')
      .select(`
        *,
        usuarios:usuario_id (nombre, dni),
        servicios:servicio_id (nombre_servicio)
      `)
      .gte('fecha_turno', fechaInicio)
      .lte('fecha_turno', fechaFin)
      .order('fecha_turno', { ascending: false });

    if (filtroServicio) {
      query = query.eq('servicio_id', filtroServicio);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error cargando reportes:", error);
    } else {
      setTurnos(data || []);
    }
    setCargando(false);
  };

  // Función para limpiar campos solicitada
  const limpiarFiltros = () => {
    setFiltroServicio('');
    const hoy = new Date().toISOString().split('T')[0];
    setFechaInicio(hoy);
    setFechaFin(hoy);
    setTurnos([]);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-[13px]">
      <Navbar />
      <div className="p-10 max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center border-b-2 border-zinc-200 pb-6">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-black underline decoration-[#f29100] decoration-4">Reportes Supervisor</h1>
          <div className="text-right flex gap-4 items-center">
            <button onClick={limpiarFiltros} className="text-[10px] font-black uppercase text-zinc-400 hover:text-red-600 transition-colors">Limpiar Filtros ×</button>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Registros</p>
              <p className="text-3xl font-black italic">{turnos.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-black p-6 shadow-xl grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-black text-[#f29100] uppercase">Centro de Trabajo</label>
            <select className="bg-zinc-900 text-white p-2 font-bold uppercase border border-zinc-800 outline-none" value={filtroServicio} onChange={(e) => setFiltroServicio(e.target.value)}>
              <option value="">TODOS LOS CENTROS</option>
              {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre_servicio}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-black text-[#f29100] uppercase">Desde</label>
            <input type="date" className="bg-zinc-900 text-white p-2 font-bold border border-zinc-800 outline-none" value={fechaInicio} onChange={(e)=>setFechaInicio(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-black text-[#f29100] uppercase">Hasta</label>
            <input type="date" className="bg-zinc-900 text-white p-2 font-bold border border-zinc-800 outline-none" value={fechaFin} onChange={(e)=>setFechaFin(e.target.value)} />
          </div>
          <button onClick={consultarDatos} className="bg-[#f29100] text-black h-[40px] font-black uppercase italic hover:bg-white transition-all shadow-lg active:scale-95">
            {cargando ? 'PROCESANDO...' : 'GENERAR REPORTE'}
          </button>
        </div>

        <div className="bg-white shadow-2xl overflow-hidden border border-zinc-200">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 text-black text-[10px] uppercase font-black border-b border-zinc-200">
              <tr>
                <th className="p-4">Fecha / Turno</th>
                <th className="p-4">Operario</th>
                <th className="p-4">Servicio / Centro</th>
                <th className="p-4 text-center">Entrada Real</th>
                <th className="p-4 text-center">Salida Real</th>
                <th className="p-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {turnos.map(t => (
                <tr key={t.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="p-4">
                    <p className="font-bold">{t.fecha_turno}</p>
                    <span className="text-[8px] bg-zinc-800 text-white px-1 uppercase font-black">{t.tipo_turno}</span>
                  </td>
                  <td className="p-4 font-black uppercase italic text-gray-900">
                    {t.usuarios?.nombre} <br/>
                    <span className="text-[9px] text-zinc-400 font-mono not-italic">{t.usuarios?.dni}</span>
                  </td>
                  <td className="p-4 text-blue-600 font-black uppercase tracking-tighter">{t.servicios?.nombre_servicio}</td>
                  <td className="p-4 text-center font-mono text-green-600 font-bold">
                    {t.hora_inicio_real ? new Date(t.hora_inicio_real).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--:--'}
                  </td>
                  <td className="p-4 text-center font-mono text-red-600 font-bold">
                    {t.hora_fin_real ? new Date(t.hora_fin_real).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--:--'}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-[9px] font-black uppercase rounded-sm border ${
                      t.estado_presencia === 'Finalizado' ? 'bg-zinc-900 text-white border-black' : 
                      t.estado_presencia === 'Presente' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    }`}>
                      {t.estado_presencia}
                    </span>
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