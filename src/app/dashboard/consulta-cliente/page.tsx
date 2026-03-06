'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Navbar } from '@/components/ui/Navbar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Componente Interno de Tarjeta - ESTILO CLARO
const TarjetaServicio = ({ grupo }: { grupo: any }) => {
  const [filtroTurno, setFiltroTurno] = useState('todos');

  const obtenerDatosVisibles = () => {
    if (filtroTurno === 'todos') {
      return { total: grupo.total, activos: grupo.activos, finalizados: grupo.finalizados };
    }
    const turno = grupo.desglose?.[filtroTurno] || { total: 0, activos: 0, finalizados: 0 };
    return { 
      total: turno.total, 
      activos: turno.activos, 
      finalizados: turno.finalizados 
    };
  };

  const datos = obtenerDatosVisibles();

  return (
    <div className="bg-white border border-zinc-200 p-6 shadow-sm rounded-xl relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      </div>
      <h3 className="text-[#f29100] font-black uppercase italic text-xl mb-6 border-b border-zinc-100 pb-2 leading-none">{grupo.nombre}</h3>
      
      <div className="grid grid-cols-4 gap-1 mb-6">
        {['todos', 'mañana', 'tarde', 'noche'].map((t) => (
          <button 
            key={t}
            onClick={() => setFiltroTurno(t)}
            className={`p-2 text-center border transition-all text-[8px] font-black uppercase rounded-md ${
              filtroTurno === t 
                ? 'bg-[#f29100] text-white border-[#f29100]' 
                : 'bg-zinc-50 text-zinc-500 border-zinc-200 hover:bg-white hover:text-[#f29100]'
            }`}
          >
            {t === 'todos' ? '★' : (grupo.desglose?.[t]?.total || 0)}
            <br />
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <span className="text-[10px] font-black text-zinc-400 uppercase italic">Operarios {filtroTurno}:</span>
          <span className="text-3xl font-black italic text-zinc-800 leading-none">{datos.total}</span>
        </div>
        <div className="flex justify-between items-end">
          <span className="text-[10px] font-black text-green-600 uppercase italic">Activos:</span>
          <span className="text-3xl font-black italic text-green-600 leading-none">{datos.activos}</span>
        </div>
        <div className="flex justify-between items-end">
          <span className="text-[10px] font-black text-blue-600 uppercase italic">Finalizados:</span>
          <span className="text-3xl font-black italic text-blue-600 leading-none">{datos.finalizados}</span>
        </div>
      </div>
      <div className="mt-6 pt-4 border-t border-zinc-50">
         <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-green-500 h-full transition-all duration-1000" 
              style={{ width: `${datos.total > 0 ? (datos.activos / datos.total) * 100 : 0}%` }}
            ></div>
         </div>
         <p className="text-[8px] font-bold text-zinc-400 uppercase mt-2 italic tracking-widest">
           Vista segmentada: {filtroTurno}
         </p>
      </div>
    </div>
  );
};

export default function ConsultaClientePage() {
  const [userLogueado, setUserLogueado] = useState<any>(null);
  const [listaClientes, setListaClientes] = useState<any[]>([]);
  const [idClienteVisualizado, setIdClienteVisualizado] = useState<string | null>(null);

  const [datosAgrupados, setDatosAgrupados] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [statsGlobales, setStatsGlobales] = useState({ total: 0, activos: 0, finalizados: 0 });
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toLocaleDateString('sv-SE'));

  const [datosGrafico, setDatosGrafico] = useState<any[]>([]);
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1);
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [cargandoGrafico, setCargandoGrafico] = useState(false);

  const meses = [
    { v: 1, n: 'Enero' }, { v: 2, n: 'Febrero' }, { v: 3, n: 'Marzo' }, { v: 4, n: 'Abril' },
    { v: 5, n: 'Mayo' }, { v: 6, n: 'Junio' }, { v: 7, n: 'Julio' }, { v: 8, n: 'Agosto' },
    { v: 9, n: 'Septiembre' }, { v: 10, n: 'Octubre' }, { v: 11, n: 'Noviembre' }, { v: 12, n: 'Diciembre' }
  ];

  useEffect(() => {
    const datosGuardados = localStorage.getItem('usuario_scrap');
    if (datosGuardados) {
      const user = JSON.parse(datosGuardados);
      setUserLogueado(user);
      setIdClienteVisualizado(user.id);
      if (user.email === 'javier.perez@randstad.es') {
        obtenerListaClientes();
      }
    }
  }, []);

  useEffect(() => {
    if (idClienteVisualizado) {
      cargarDatosResumen();
      fetchEstadisticasMensuales();
    }
  }, [fechaSeleccionada, mesSeleccionado, anioSeleccionado, idClienteVisualizado]);

  const obtenerListaClientes = async () => {
    // REPARACIÓN SEGÚN image_dd1b52: El rol es tipo custom y está como 'Cliente'
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, email, rol')
      .eq('rol', 'Cliente') // Corregido a 'Cliente' con mayúscula según pantallazo
      .order('nombre');
    
    if (error) {
      console.error("Error cargando lista de clientes:", error);
      return;
    }
    setListaClientes(data || []);
  };

  const cargarDatosResumen = async () => {
    if (!idClienteVisualizado) return;
    setCargando(true);
    try {
      const { data: asignaciones } = await supabase
        .from('usuario_servicios')
        .select('servicio_id')
        .eq('usuario_id', idClienteVisualizado);
      
      const serviciosIds = asignaciones?.map(a => a.servicio_id) || [];

      let query = supabase.from('gestion_turnos').select(`
          id, estado_presencia, hora_fin_real, tipo_turno, servicio_id,
          servicios!servicio_id (nombre_servicio)
        `).eq('fecha_turno', fechaSeleccionada);

      if (serviciosIds.length > 0) {
        query = query.in('servicio_id', serviciosIds);
      } else {
         // Si el cliente seleccionado no tiene servicios asignados, vaciamos la vista
         setDatosAgrupados([]); setCargando(false); return; 
      }

      const { data, error } = await query;
      if (error) throw error;

      const grupos: any = {};
      let gTotal = 0, gActivos = 0, gFin = 0;

      data?.forEach((turno: any) => {
        const srvNombre = turno.servicios?.nombre_servicio || 'Servicio Desconocido';
        const tNombre = (turno.tipo_turno || '').toLowerCase();
        if (!grupos[srvNombre]) {
          grupos[srvNombre] = { 
            nombre: srvNombre, total: 0, activos: 0, finalizados: 0,
            desglose: { mañana: { total: 0, activos: 0, finalizados: 0 }, tarde: { total: 0, activos: 0, finalizados: 0 }, noche: { total: 0, activos: 0, finalizados: 0 } }
          };
        }
        const g = grupos[srvNombre];
        g.total++; gTotal++;
        let clave = tNombre.includes('mañana') ? 'mañana' : tNombre.includes('tarde') ? 'tarde' : tNombre.includes('noche') ? 'noche' : '';
        if (clave) {
          g.desglose[clave].total++;
          if (turno.hora_fin_real) g.desglose[clave].finalizados++;
          else if (turno.estado_presencia === 'Presente') g.desglose[clave].activos++;
        }
        if (turno.hora_fin_real) { g.finalizados++; gFin++; }
        else if (turno.estado_presencia === 'Presente') { g.activos++; gActivos++; }
      });
      setDatosAgrupados(Object.values(grupos));
      setStatsGlobales({ total: gTotal, activos: gActivos, finalizados: gFin });
    } catch (err) { console.error(err); } finally { setCargando(false); }
  };

  const fetchEstadisticasMensuales = async () => {
    if (!idClienteVisualizado) return;
    setCargandoGrafico(true);
    try {
      const { data: asignaciones } = await supabase.from('usuario_servicios').select('servicio_id').eq('usuario_id', idClienteVisualizado);
      const serviciosIds = asignaciones?.map(a => a.servicio_id) || [];
      const primerDia = `${anioSeleccionado}-${String(mesSeleccionado).padStart(2, '0')}-01`;
      const ultimoDia = `${anioSeleccionado}-${String(mesSeleccionado).padStart(2, '0')}-31`;
      let query = supabase.from('gestion_turnos').select('fecha_turno, estado_presencia').gte('fecha_turno', primerDia).lte('fecha_turno', ultimoDia);
      if (serviciosIds.length > 0) query = query.in('servicio_id', serviciosIds);
      const { data } = await query;
      const dias: any = {};
      data?.forEach(t => {
        const d = t.fecha_turno.split('-')[2];
        if (!dias[d]) dias[d] = { dia: d, total: 0, activos: 0 };
        dias[d].total++;
        if (t.estado_presencia === 'Presente') dias[d].activos++;
      });
      setDatosGrafico(Object.values(dias).sort((a: any, b: any) => Number(a.dia) - Number(b.dia)));
    } catch (err) { console.error(err); } finally { setCargandoGrafico(false); }
  };

  const exportarResumenPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`RESUMEN DE PERSONAL - FECHA: ${fechaSeleccionada}`, 14, 20);
    const tableRows = datosAgrupados.map(g => [g.nombre, g.total, g.activos, g.finalizados]);
    autoTable(doc, {
      startY: 30,
      head: [['Servicio / Centro', 'Total Operarios', 'Activos', 'Finalizados']],
      body: tableRows,
      headStyles: { fillColor: [242, 145, 0], textColor: [255, 255, 255] }
    });
    doc.save(`Resumen_Personal_${fechaSeleccionada}.pdf`);
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 p-8 font-sans">
      <Navbar />
      <div className="max-w-7xl mx-auto border-b border-zinc-200 pb-8 mb-10 mt-6">
        
        {/* SELECTOR MASTER: Solo visible para Javier Pérez */}
        {userLogueado?.email === 'javier.perez@randstad.es' && (
          <div className="mb-10 p-5 bg-white border-2 border-[#f29100]/20 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 bg-[#f29100] rounded-full animate-pulse"></div>
              <span className="text-xs font-black uppercase italic text-[#f29100]">Modo Master: Simular Vista Cliente</span>
            </div>
            <select 
              value={idClienteVisualizado || ''}
              onChange={(e) => setIdClienteVisualizado(e.target.value)}
              className="w-full md:w-80 bg-zinc-50 border border-zinc-200 text-zinc-800 text-xs font-bold p-3 rounded-xl outline-none"
            >
              <option value={userLogueado.id}>Mi Vista Master</option>
              {listaClientes.map(cliente => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase text-[#f29100]">Monitor de Volúmenes</h1>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-2 italic">Segmentación por Turnos y Centros</p>
          </div>
          <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-zinc-200 shadow-sm">
            <input type="date" value={fechaSeleccionada} onChange={(e) => setFechaSeleccionada(e.target.value)} className="bg-transparent border-none text-zinc-800 font-bold py-1 px-3 rounded text-sm outline-none" />
            <button onClick={exportarResumenPDF} className="bg-[#f29100] text-white px-4 py-2 text-[10px] font-black uppercase hover:bg-black transition-all rounded-lg">Exportar Resumen ↓</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 border-b-4 border-[#f29100] shadow-sm rounded-xl">
            <p className="text-[10px] font-black text-zinc-400 uppercase mb-2 italic tracking-widest text-center">Operarios Totales (Día)</p>
            <p className="text-4xl font-black italic text-zinc-800 text-center leading-none">{statsGlobales.total}</p>
          </div>
          <div className="bg-white p-6 border-b-4 border-green-500 shadow-sm rounded-xl">
            <p className="text-[10px] font-black text-zinc-400 uppercase mb-2 italic tracking-widest text-center">Activos Ahora</p>
            <p className="text-4xl font-black italic text-green-600 text-center leading-none">{statsGlobales.activos}</p>
          </div>
          <div className="bg-white p-6 border-b-4 border-blue-500 shadow-sm rounded-xl">
            <p className="text-[10px] font-black text-zinc-400 uppercase mb-2 italic tracking-widest text-center">Jornadas Cerradas</p>
            <p className="text-4xl font-black italic text-blue-600 text-center leading-none">{statsGlobales.finalizados}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {cargando ? (
          <div className="col-span-full py-20 text-center text-zinc-400 animate-pulse italic uppercase font-black tracking-widest text-xs">Sincronizando Resumen Operativo...</div>
        ) : (
          <>
            {datosAgrupados.map((grupo, idx) => <TarjetaServicio key={idx} grupo={grupo} />)}
            {datosAgrupados.length === 0 && (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-zinc-200 rounded-2xl">
                <p className="text-zinc-400 font-bold uppercase italic text-xs tracking-widest">No hay actividad para este cliente en la fecha seleccionada</p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="max-w-7xl mx-auto bg-white border border-zinc-200 p-8 rounded-2xl shadow-sm mb-10">
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datosGrafico}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="dia" stroke="#a1a1aa" fontSize={10} fontWeight="bold" />
              <YAxis stroke="#a1a1aa" fontSize={10} fontWeight="bold" />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '12px' }} />
              <Bar name="Total Operarios" dataKey="total" fill="#f29100" radius={[4, 4, 0, 0]} />
              <Bar name="Asistencia Real" dataKey="activos" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}