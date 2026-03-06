'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/ui/Navbar';
import Link from 'next/link';

export default function TerminalOperarioPage() {
  const [turno, setTurno] = useState<any>(null);
  const [usuario, setUsuario] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem('usuario_scrap');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUsuario(user);
      comprobarTurnoHoy(user.id);
    }
  }, []);

  const comprobarTurnoHoy = async (userId: string) => {
    const hoy = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('gestion_turnos')
      .select('*, servicios(nombre_servicio)')
      .eq('usuario_id', userId)
      .eq('fecha_turno', hoy)
      // Buscamos el turno que NO esté finalizado primero, o el más reciente
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    setTurno(data);
    setCargando(false);
  };

  const iniciarJornada = async () => {
    if (!turno) return;
    const { error } = await supabase
      .from('gestion_turnos')
      .update({ 
        estado_presencia: 'Presente',
        hora_inicio_real: new Date().toISOString() 
      })
      .eq('id', turno.id);

    if (!error) {
      alert('¡JORNADA INICIADA! Buen turno.');
      comprobarTurnoHoy(usuario.id);
    }
  };

  // NUEVA FUNCIÓN: FINALIZAR JORNADA
  const finalizarJornada = async () => {
    if (!turno) return;
    const confirmar = confirm("¿ESTÁS SEGURO DE QUE DESEAS FINALIZAR TU JORNADA?");
    if (!confirmar) return;

    const { error } = await supabase
      .from('gestion_turnos')
      .update({ 
        estado_presencia: 'Finalizado',
        hora_fin_real: new Date().toISOString() 
      })
      .eq('id', turno.id);

    if (!error) {
      alert('JORNADA FINALIZADA. Gracias por tu trabajo.');
      comprobarTurnoHoy(usuario.id);
    } else {
      alert('Error al finalizar: ' + error.message);
    }
  };

  if (cargando) return <div className="p-10 text-center font-black uppercase italic text-white bg-black min-h-screen">Cargando Terminal...</div>;

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans">
      <Navbar />
      
      <div className="p-6 max-w-xl mx-auto space-y-6 pt-12 pb-20">
        {/* IDENTIFICACIÓN */}
        <div className="bg-zinc-900 p-8 border-t-8 border-[#f29100] shadow-2xl">
          <h2 className="text-[10px] font-black text-[#f29100] uppercase tracking-[0.4em] mb-2 italic">Operario Identificado</h2>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-4">{usuario?.nombre}</h1>
          <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest italic">{usuario?.dni}</p>
        </div>

        {!turno || turno.estado_presencia === 'Finalizado' ? (
          <div className="space-y-6">
            <div className="bg-zinc-900/50 border border-zinc-800 p-10 text-center">
              <p className="text-zinc-500 font-black uppercase text-xs italic">
                {turno?.estado_presencia === 'Finalizado' 
                  ? 'Has completado tu jornada de hoy' 
                  : 'Sin turnos activos asignados'}
              </p>
            </div>
            <button 
              onClick={() => { localStorage.clear(); window.location.href='/login'; }}
              className="w-full bg-zinc-800 p-4 text-[10px] font-black uppercase tracking-widest border border-zinc-700"
            >
              Cerrar Sesión de Terminal
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* INSTRUCCIONES DEL SUPERVISOR */}
            {turno.mensaje_instrucciones && (
              <div className="bg-[#f29100]/10 border-2 border-[#f29100] p-6">
                <p className="text-[10px] font-black text-[#f29100] uppercase mb-2">⚠️ Instrucciones del Supervisor</p>
                <p className="text-lg font-black italic uppercase leading-tight text-white">
                  "{turno.mensaje_instrucciones}"
                </p>
              </div>
            )}

            <div className="bg-zinc-900 p-8 border-l-4 border-zinc-700">
              <p className="text-[9px] font-black text-zinc-500 uppercase mb-4 italic">Puesto Asignado</p>
              <h3 className="text-xl font-black italic uppercase text-white">{turno.servicios?.nombre_servicio}</h3>
              <p className="text-sm font-bold uppercase text-[#f29100] mt-1">{turno.puesto}</p>
            </div>

            {turno.estado_presencia !== 'Presente' ? (
              <button 
                onClick={iniciarJornada}
                className="w-full bg-green-600 hover:bg-white hover:text-black p-10 text-2xl font-black italic uppercase tracking-tighter transition-all"
              >
                ▶ Iniciar Turno
              </button>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-green-600/20 border border-green-500/50 p-4 text-center">
                  <p className="text-green-500 font-black uppercase text-[10px] tracking-[0.2em]">Jornada en Curso</p>
                </div>
                
                {/* ENLACE CORREGIDO A REGISTRO */}
                <Link 
                  href="/dashboard/registro"
                  className="w-full bg-white text-black p-6 font-black uppercase italic hover:bg-[#f29100] hover:text-white transition-all shadow-xl text-center flex items-center justify-center gap-2"
                >
                  Registrar Pieza NOK <span className="text-lg">→</span>
                </Link>

                {/* BOTÓN PARA FINALIZAR */}
                <button 
                  onClick={finalizarJornada}
                  className="w-full bg-red-600/20 border border-red-600 text-red-500 p-6 font-black uppercase italic hover:bg-red-600 hover:text-white transition-all mt-8"
                >
                  ■ Finalizar Jornada
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}