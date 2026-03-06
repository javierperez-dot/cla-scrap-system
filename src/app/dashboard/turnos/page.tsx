'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/ui/Navbar';
import { supabase } from '@/lib/supabase';
import Link from 'next/link'; // Importante para la navegación pro

export default function GestionTurnosPage() {
  const [servicios, setServicios] = useState<any[]>([]);
  const [operarios, setOperarios] = useState<any[]>([]);
  const [operariosOcupadosIds, setOperariosOcupadosIds] = useState<string[]>([]);
  const [busqueda, setBusqueda] = useState(''); 
  const [servicioSeleccionado, setServicioSeleccionado] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  
  const [turnoGlobal, setTurnoGlobal] = useState('Mañana');
  const [puestoGlobal, setPuestoGlobal] = useState('');
  const [instrucciones, setInstrucciones] = useState('');

  // Carga inicial única
  useEffect(() => {
    cargarServicios();
  }, []);

  // Recarga reactiva sin errores de "size changed"
  useEffect(() => {
    cargarTodosLosOperarios();
    cargarDisponibilidadRealTime();
  }, [fecha, servicioSeleccionado]);

  const cargarServicios = async () => {
    const { data } = await supabase.from('servicios').select('*');
    setServicios(data || []);
  };

  const cargarTodosLosOperarios = async () => {
    const { data } = await supabase
      .from('usuarios')
      .select('*')
      .eq('rol', 'Operario') 
      .order('nombre', { ascending: true });
    setOperarios(data || []);
  };

  const cargarDisponibilidadRealTime = async () => {
    const { data } = await supabase
      .from('gestion_turnos')
      .select('usuario_id')
      .eq('fecha_turno', fecha)
      .in('estado_presencia', ['Programado', 'Presente']); 
    
    setOperariosOcupadosIds(data?.map(a => a.usuario_id) || []);
  };

  const filtrarPorServicio = async (idServicio: string) => {
    setServicioSeleccionado(idServicio);
    if (!idServicio) {
      cargarTodosLosOperarios();
      return;
    }
    const { data } = await supabase
      .from('usuario_servicios')
      .select('usuarios(*)')
      .eq('servicio_id', idServicio)
      .eq('usuarios.rol', 'Operario');
    
    setOperarios(data?.map(d => d.usuarios).filter(u => u !== null) || []);
  };

  const operariosVisibles = operarios.filter(u => {
    const coincideBusqueda = u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || 
                             u.dni?.toLowerCase().includes(busqueda.toLowerCase());
    const estaDisponible = !operariosOcupadosIds.includes(u.id);
    return coincideBusqueda && estaDisponible;
  });

  const asignarTurno = async (uId: string) => {
    if (!servicioSeleccionado) {
      alert("POR FAVOR, SELECCIONA UN CENTRO DE TRABAJO DESTINO");
      return;
    }
    try {
      const { error } = await supabase.from('gestion_turnos').upsert([{
        usuario_id: uId,
        servicio_id: servicioSeleccionado,
        fecha_turno: fecha,
        tipo_turno: turnoGlobal,
        puesto: puestoGlobal || 'Sin definir',
        mensaje_instrucciones: instrucciones,
        estado_presencia: 'Programado'
      }], { onConflict: 'usuario_id,fecha_turno,tipo_turno' });

      if (error) throw error;
      
      // Limpieza total de campos tras el éxito
      setBusqueda(''); 
      setServicioSeleccionado('');
      setPuestoGlobal('');
      setInstrucciones('');
      
      alert('ASIGNACIÓN LANZADA Y FORMULARIO LIMPIADO');
      cargarDisponibilidadRealTime();
      
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-[13px]">
      <Navbar />
      <div className="p-10 max-w-6xl mx-auto space-y-6">
        
        {/* CABECERA CON ACCESO A REPORTES */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-4">
             <div className="h-10 w-2 bg-[#f29100]"></div>
             <h1 className="text-3xl font-black italic uppercase tracking-tighter">Consola de Despacho</h1>
          </div>
          
          <Link 
            href="/dashboard/reportes_supervisor"
            className="bg-black text-[#f29100] border border-[#f29100] px-4 py-2 font-black uppercase italic text-[10px] hover:bg-[#f29100] hover:text-black transition-all flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
            Ver Historial y Reportes
          </Link>
        </div>

        {/* CONSOLA DE CONFIGURACIÓN */}
        <div className="bg-white p-8 shadow-sm border border-zinc-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-400 uppercase mb-1">Centro de Trabajo Destino</label>
              <select 
                className="bg-gray-100 p-2 font-bold uppercase outline-none focus:ring-2 ring-blue-500" 
                value={servicioSeleccionado}
                onChange={(e) => filtrarPorServicio(e.target.value)}
              >
                <option value="">SELECCIONAR CENTRO...</option>
                {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre_servicio}</option>)}
              </select>
            </div>
            
            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-400 uppercase mb-1">Turno</label>
              <select value={turnoGlobal} onChange={(e)=>setTurnoGlobal(e.target.value)} className="bg-gray-100 p-2 font-bold">
                <option>Mañana</option><option>Tarde</option><option>Noche</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-400 uppercase mb-1">Puesto</label>
              <input className="bg-gray-100 p-2 font-bold uppercase outline-none focus:ring-2 ring-blue-500" placeholder="EJ: LÍNEA A" value={puestoGlobal} onChange={(e)=>setPuestoGlobal(e.target.value)} />
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-400 uppercase mb-1">Fecha de Turno</label>
              <input type="date" value={fecha} onChange={(e)=>setFecha(e.target.value)} className="bg-gray-100 p-2 font-bold" />
            </div>
          </div>

          <div className="mt-6">
            <label className="text-[10px] font-black text-blue-600 uppercase mb-1 tracking-widest">Órdenes para el Operario</label>
            <textarea 
              className="w-full bg-blue-50/50 p-4 font-bold uppercase text-blue-900 border border-blue-100 outline-none focus:bg-white"
              placeholder="ESCRIBE AQUÍ LAS INSTRUCCIONES QUE EL TRABAJADOR LEERÁ EN SU TERMINAL..."
              rows={2}
              value={instrucciones}
              onChange={(e)=>setInstrucciones(e.target.value)}
            />
          </div>
        </div>

        {/* BUSCADOR */}
        <div className="bg-black p-4 flex items-center gap-4 shadow-lg">
          <div className="bg-[#f29100] p-2 text-black font-black italic text-[10px]">SEARCH</div>
          <input 
            type="text"
            placeholder="BUSCAR OPERARIO DISPONIBLE POR NOMBRE O DNI..."
            className="w-full bg-transparent text-white font-black uppercase italic outline-none placeholder:text-zinc-700 text-lg"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {/* TABLA DE PERSONAL */}
        <div className="bg-white shadow-xl overflow-hidden border border-gray-100">
          <table className="w-full text-left">
            <thead className="bg-zinc-100 text-black text-[10px] uppercase font-black border-b border-zinc-200">
              <tr>
                <th className="p-4">Operario Disponible ({operariosVisibles.length})</th>
                <th className="p-4 text-right">Lanzar Turno</th>
              </tr>
            </thead>
            <tbody>
              {operariosVisibles.map(u => (
                <tr key={u.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <p className="font-black uppercase italic text-gray-900 leading-none mb-1">{u.nombre}</p>
                    <p className="text-[9px] text-gray-400 font-mono tracking-tighter">{u.dni}</p>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => asignarTurno(u.id)}
                      className="bg-blue-600 text-white px-6 py-2 text-[10px] font-black uppercase italic hover:bg-black transition-all shadow-md active:scale-95"
                    >
                      Asignar a Centro →
                    </button>
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