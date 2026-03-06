'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/ui/Navbar';
import { supabase } from '@/lib/supabase';
// Importaciones necesarias para PDF
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ReportesSupervisorPage() {
  const [turnos, setTurnos] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  const [usuarioActual, setUsuarioActual] = useState<any>(null);

  const [filtroServicio, setFiltroServicio] = useState('');
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);

  const SUPERADMIN_EMAIL = 'javier.perez@randstad.es';

  useEffect(() => {
    const userStr = localStorage.getItem('usuario_scrap');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUsuarioActual(user);
      cargarServiciosAsignados(user);
    }
  }, []);

  const cargarServiciosAsignados = async (user: any) => {
    const esRangoAlto = user.rol === 'Administrador' || user.rol === 'Maestro' || user.email === SUPERADMIN_EMAIL;
    
    try {
      if (esRangoAlto) {
        const { data } = await supabase.from('servicios').select('*').order('nombre_servicio');
        setServicios(data || []);
      } else {
        const { data, error } = await supabase
          .from('usuario_servicios')
          .select(`
            servicio_id,
            servicios!servicio_id (
              id,
              nombre_servicio
            )
          `)
          .eq('usuario_id', user.id);

        if (error) throw error;

        const centrosMapeados = data
          ?.map((item: any) => item.servicios)
          .filter((s: any) => s !== null) || [];
        
        setServicios(centrosMapeados);
      }
    } catch (err) {
      console.error("Error cargando asignaciones de centros:", err);
    }
  };

  const consultarDatos = async () => {
    if (!usuarioActual) return;
    setCargando(true);

    const esRangoAlto = usuarioActual.rol === 'Administrador' || usuarioActual.rol === 'Maestro' || usuarioActual.email === SUPERADMIN_EMAIL;

    try {
      let idsDeMisCentros: string[] = [];

      if (!esRangoAlto) {
        const { data: asignaciones } = await supabase
          .from('usuario_servicios')
          .select('servicio_id')
          .eq('usuario_id', usuarioActual.id);
        
        idsDeMisCentros = asignaciones?.map(a => a.servicio_id) || [];
        
        if (idsDeMisCentros.length === 0) {
          setTurnos([]);
          setCargando(false);
          return;
        }
      }

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

      if (!esRangoAlto) {
        query = query.in('servicio_id', idsDeMisCentros);
      }

      if (filtroServicio) {
        query = query.eq('servicio_id', filtroServicio);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTurnos(data || []);

    } catch (err) {
      console.error("Error en reporte operativo:", err);
    } finally {
      setCargando(false);
    }
  };

  const limpiarFiltros = () => {
    setFiltroServicio('');
    const hoy = new Date().toISOString().split('T')[0];
    setFechaInicio(hoy);
    setFechaFin(hoy);
    setTurnos([]);
  };

  // --- NUEVA FUNCIÓN DE EXPORTACIÓN PDF ---
  const exportarPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4'); // Paisaje para mejor lectura de columnas
    
    // Título y Metadatos
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text('MONITOR OPERATIVO - REPORTE DE PERSONAL', 14, 15);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Desde: ${fechaInicio} | Hasta: ${fechaFin}`, 14, 22);
    doc.text(`Supervisor: ${usuarioActual?.nombre || 'S/N'}`, 14, 27);
    doc.text(`Fecha de exportación: ${new Date().toLocaleString()}`, 14, 32);

    // Preparación de datos para la tabla
    const body = turnos.map(t => [
      t.fecha_turno,
      t.usuarios?.nombre || 'N/A',
      t.usuarios?.dni || 'N/A',
      t.servicios?.nombre_servicio || 'N/A',
      t.puesto || 'GENERAL',
      t.tipo_turno || 'N/A',
      t.hora_inicio_real ? new Date(t.hora_inicio_real).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--:--',
      t.hora_fin_real ? new Date(t.hora_fin_real).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--:--',
      t.estado_presencia || 'S/E'
    ]);

    autoTable(doc, {
      startY: 38,
      head: [['Fecha', 'Operario', 'DNI', 'Centro', 'Puesto', 'Turno', 'Entrada', 'Salida', 'Estado']],
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], textColor: [242, 145, 0], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        8: { fontStyle: 'bold' }
      }
    });

    doc.save(`Reporte_CLA_${fechaInicio}_al_${fechaFin}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-[13px]">
      <Navbar />
      <div className="p-10 max-w-7xl mx-auto space-y-6">
        
        <div className="flex justify-between items-center border-b-2 border-zinc-200 pb-6">
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-black underline decoration-[#f29100] decoration-4">Monitor Operativo</h1>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mt-2 italic">Análisis de personal por centros vinculados</p>
          </div>
          <div className="text-right flex gap-6 items-center">
            <button onClick={limpiarFiltros} className="text-[10px] font-black uppercase text-zinc-400 hover:text-red-600 transition-colors">Limpiar Filtros ×</button>
            
            {/* BOTÓN DE EXPORTACIÓN PDF */}
            {turnos.length > 0 && (
                <button 
                  onClick={exportarPDF}
                  className="bg-black text-[#f29100] px-4 py-2 text-[10px] font-black uppercase italic hover:bg-[#f29100] hover:text-black transition-all shadow-md"
                >
                  Exportar PDF ↓
                </button>
            )}

            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none text-right">Fichajes</p>
              <p className="text-3xl font-black italic">{turnos.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-black p-6 shadow-xl grid grid-cols-1 md:grid-cols-4 gap-4 items-end rounded-xl">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-black text-[#f29100] uppercase italic">Centro Vinculado</label>
            <select 
              className="bg-zinc-900 text-white p-2 font-bold uppercase border border-zinc-800 outline-none text-xs rounded-sm w-full" 
              value={filtroServicio} 
              onChange={(e) => setFiltroServicio(e.target.value)}
            >
              <option value="">{servicios.length > 0 ? 'TODOS MIS CENTROS' : 'Cargando centros...'}</option>
              {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre_servicio}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-black text-[#f29100] uppercase italic">Desde</label>
            <input type="date" className="bg-zinc-900 text-white p-2 font-bold border border-zinc-800 outline-none text-xs" value={fechaInicio} onChange={(e)=>setFechaInicio(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-black text-[#f29100] uppercase italic">Hasta</label>
            <input type="date" className="bg-zinc-900 text-white p-2 font-bold border border-zinc-800 outline-none text-xs" value={fechaFin} onChange={(e)=>setFechaFin(e.target.value)} />
          </div>
          <button onClick={consultarDatos} className="bg-[#f29100] text-black h-[40px] font-black uppercase italic hover:bg-white transition-all shadow-lg active:scale-95 text-xs rounded-sm">
            {cargando ? 'CONSULTANDO...' : 'GENERAR REPORTE'}
          </button>
        </div>

        <div className="bg-white shadow-2xl overflow-hidden border border-zinc-200 rounded-xl">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 text-black text-[10px] uppercase font-black border-b border-zinc-200">
              <tr>
                <th className="p-5">Fecha / Turno</th>
                <th className="p-5">Operario</th>
                <th className="p-5">Centro / Servicio</th>
                <th className="p-5 text-center">Entrada</th>
                <th className="p-5 text-center">Salida</th>
                <th className="p-5 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {turnos.map(t => (
                <tr key={t.id} className="hover:bg-zinc-50 transition-colors group">
                  <td className="p-5">
                    <p className="font-black italic text-zinc-800">{t.fecha_turno}</p>
                    <span className="text-[8px] bg-zinc-800 text-white px-2 py-0.5 rounded-sm uppercase font-black">{t.tipo_turno}</span>
                  </td>
                  <td className="p-5">
                    <p className="font-black uppercase italic text-gray-900 group-hover:text-[#f29100] transition-colors">{t.usuarios?.nombre}</p>
                    <p className="text-[9px] text-zinc-400 font-mono font-bold">{t.usuarios?.dni}</p>
                  </td>
                  <td className="p-5 font-black uppercase italic text-zinc-800 text-[11px] leading-tight">
                    {t.servicios?.nombre_servicio} <br/>
                    <span className="text-[8px] text-[#f29100] uppercase not-italic font-bold">PUESTO: {t.puesto || 'GENERAL'}</span>
                  </td>
                  <td className="p-5 text-center font-mono text-green-600 font-black text-xs">
                    {t.hora_inicio_real ? new Date(t.hora_inicio_real).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--:--'}
                  </td>
                  <td className="p-5 text-center font-mono text-red-600 font-black text-xs">
                    {t.hora_fin_real ? new Date(t.hora_fin_real).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--:--'}
                  </td>
                  <td className="p-5 text-center">
                    <span className={`px-3 py-1 text-[9px] font-black uppercase rounded-full border shadow-sm ${
                      t.estado_presencia === 'Finalizado' ? 'bg-zinc-900 text-white border-zinc-900' : 
                      t.estado_presencia === 'Presente' ? 'bg-green-100 text-green-700 border-green-200 animate-pulse' : 
                      'bg-red-50 text-red-600 border-red-100'
                    }`}>
                      {t.estado_presencia}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {turnos.length === 0 && !cargando && (
            <div className="p-20 text-center">
              <p className="text-zinc-300 font-black uppercase italic text-xs tracking-widest italic">
                Sin registros detectados en su panel de responsabilidad
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}