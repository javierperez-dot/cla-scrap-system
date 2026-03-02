'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/ui/Navbar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { Html5Qrcode } from 'html5-qrcode'; // Cambiado a la clase base para mayor control

// --- Interfaces de Tipado ---
interface ServicioAutorizado {
  id: string;
  nombre_servicio: string;
  provincia: string;
  can_create: boolean;
  can_delete: boolean;
}

interface RegistroNOK {
  id: string;
  nombre_pieza: string;
  referencia: string;
  trazabilidad: string;
  cliente_id: string;
  servicio_id: string;
  foto_url: string;
  operario_nombre: string;
  fecha: string;
  clientes?: { nombre_empresa: string };
  servicios?: { nombre_servicio: string };
}

const SUPERADMIN_EMAIL = 'javier.perez@randstad.es';

export default function RegistroNOKPage() {
  const [formData, setFormData] = useState({ 
    nombre_pieza: '', referencia: '', cliente_id: '', servicio_id: '', trazabilidad: '' 
  });
  const [usuarioLogueado, setUsuarioLogueado] = useState<any>(null);
  const [clientes, setClientes] = useState<any[]>([]);
  const [serviciosAutorizados, setServiciosAutorizados] = useState<ServicioAutorizado[]>([]);
  const [registros, setRegistros] = useState<RegistroNOK[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [campoEscaneo, setCampoEscaneo] = useState<'referencia' | 'trazabilidad' | null>(null);
  const [fotoArchivo, setFotoArchivo] = useState<File | null>(null);

  const cargarDatos = useCallback(async (userId: string, email: string) => {
    const esSuperAdmin = email === SUPERADMIN_EMAIL;
    const { data: cl } = await supabase.from('clientes').select('*').order('nombre_empresa');
    setClientes(cl || []);

    if (esSuperAdmin) {
      const { data: todosServs } = await supabase.from('servicios').select('*').order('nombre_servicio');
      const { data: todosRegs } = await supabase.from('registros_nok').select('*, clientes(nombre_empresa), servicios(nombre_servicio)').order('fecha', { ascending: false });
      setServiciosAutorizados(todosServs?.map(s => ({ ...s, can_create: true, can_delete: true })) || []);
      setRegistros(todosRegs || []);
    } else {
      const { data: permisos } = await supabase.from('usuario_servicios').select(`can_create, can_delete, servicios ( id, nombre_servicio, provincia )`).eq('usuario_id', userId);
      if (permisos) {
        const filtrados = permisos.map((p: any) => ({ ...p.servicios, can_create: p.can_create, can_delete: p.can_delete }));
        setServiciosAutorizados(filtrados);
        const idsAutorizados = filtrados.map(s => s.id);
        if (idsAutorizados.length > 0) {
          const { data: rg } = await supabase.from('registros_nok').select('*, clientes(nombre_empresa), servicios(nombre_servicio)').in('servicio_id', idsAutorizados).order('fecha', { ascending: false });
          setRegistros(rg || []);
        }
      }
    }
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem('usuario_scrap');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUsuarioLogueado(user);
      cargarDatos(user.id, user.email);
    }
  }, [cargarDatos]);

  // --- LÓGICA DE ESCANEO OPTIMIZADA PARA MÓVIL ---
  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;

    if (campoEscaneo) {
      html5QrCode = new Html5Qrcode("reader");
      
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };

      // Intentar iniciar la cámara directamente al abrir el modal
      html5QrCode.start(
        { facingMode: "environment" }, 
        config,
        (decodedText) => {
          setFormData(prev => ({ ...prev, [campoEscaneo]: decodedText.toUpperCase() }));
          setCampoEscaneo(null);
        },
        undefined
      ).catch(err => {
        console.error("Error al iniciar cámara:", err);
      });
    }

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => console.error("Error al detener:", err));
      }
    };
  }, [campoEscaneo]);

  const registrosFiltrados = registros.filter(r => 
    r.nombre_pieza.toLowerCase().includes(busqueda.toLowerCase()) ||
    r.referencia.toLowerCase().includes(busqueda.toLowerCase()) ||
    r.clientes?.nombre_empresa.toLowerCase().includes(busqueda.toLowerCase())
  );

  const esSuperAdmin = usuarioLogueado?.email === SUPERADMIN_EMAIL;
  const servicioActual = serviciosAutorizados.find(s => s.id === formData.servicio_id);
  const puedeRegistrar = esSuperAdmin || servicioActual?.can_create === true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!puedeRegistrar) return;
    setCargando(true);
    let fotoUrl = '';
    try {
      if (fotoArchivo) {
        const filePath = `${Date.now()}-${fotoArchivo.name}`;
        await supabase.storage.from('fotos_nok').upload(filePath, fotoArchivo);
        const { data: urlData } = supabase.storage.from('fotos_nok').getPublicUrl(filePath);
        fotoUrl = urlData.publicUrl;
      }
      const { error } = await supabase.from('registros_nok').insert([{
        ...formData,
        nombre_pieza: formData.nombre_pieza.toUpperCase(),
        foto_url: fotoUrl,
        registrado_por: usuarioLogueado.email,
        operario_nombre: usuarioLogueado.nombre
      }]);
      if (error) throw error;
      alert('Sincronizado con éxito');
      setFormData({ nombre_pieza: '', referencia: '', cliente_id: '', servicio_id: '', trazabilidad: '' });
      setFotoArchivo(null);
      cargarDatos(usuarioLogueado.id, usuarioLogueado.email);
    } catch (err: any) { alert('Error: ' + err.message); } finally { setCargando(false); }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-gray-800 text-[13px]">
      <Navbar />

      {/* MODAL DEL ESCÁNER */}
      {campoEscaneo && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-4 w-full max-w-md rounded-lg shadow-2xl">
            <h3 className="text-black font-black uppercase text-center mb-4 italic text-sm tracking-tighter">
              ESCANEANDO {campoEscaneo}
            </h3>
            {/* Contenedor del visor de cámara */}
            <div id="reader" className="w-full aspect-square bg-gray-100 rounded-md overflow-hidden"></div>
            
            <p className="text-[10px] text-center text-gray-400 mt-4 uppercase font-bold">
              Apunta al código QR o de barras
            </p>
            
            <Button 
              onClick={() => setCampoEscaneo(null)} 
              className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white font-black italic"
            >
              CANCELAR LECTURA
            </Button>
          </div>
        </div>
      )}

      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
        {/* CABECERA */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 shadow-sm border-l-8 border-red-600 gap-4">
          <div>
            <h2 className="text-[10px] font-black text-red-600 uppercase tracking-[0.4em] mb-2 italic">Terminal de Calidad</h2>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-3">
              REGISTRO NOK {esSuperAdmin && <span title="Superadmin">👑</span>}
            </h1>
            <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">
              Operario: <span className="text-black">{usuarioLogueado?.nombre}</span>
            </p>
          </div>
          <Link href="/dashboard" className="bg-black text-white px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all italic">
            ← VOLVER A DASHBOARD
          </Link>
        </div>

        {/* FORMULARIO DE REGISTRO */}
        <div className="bg-white p-8 shadow-xl border-t-4 border-red-600">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-6">
              <Input label="Nombre de la Pieza" value={formData.nombre_pieza} onChange={(e)=>setFormData({...formData, nombre_pieza: e.target.value})} required />
              <div className="relative">
                <Input label="Referencia" value={formData.referencia} onChange={(e)=>setFormData({...formData, referencia: e.target.value})} required />
                <button type="button" onClick={() => setCampoEscaneo('referencia')} className="absolute right-2 top-8 bg-black text-white p-2 rounded hover:bg-red-600">QR</button>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex flex-col">
                <label className="text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">proveedor</label>
                <select className="bg-gray-100 p-3 text-sm font-bold border-b-2 border-transparent focus:border-red-600 uppercase h-[46px]"
                  value={formData.cliente_id} onChange={(e)=>setFormData({...formData, cliente_id: e.target.value})} required>
                  <option value="">Seleccionar Cliente...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre_empresa}</option>)}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest italic">Servicio</label>
                <select className="bg-gray-100 p-3 text-sm font-bold border-b-2 border-transparent focus:border-red-600 uppercase h-[46px] text-[#f29100]"
                  value={formData.servicio_id} onChange={(e)=>setFormData({...formData, servicio_id: e.target.value})} required>
                  <option value="">Seleccionar Centro...</option>
                  {serviciosAutorizados.map(s => <option key={s.id} value={s.id}>{s.nombre_servicio}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-6 flex flex-col justify-between">
              <div className="relative">
                <Input label="Trazabilidad" value={formData.trazabilidad} onChange={(e)=>setFormData({...formData, trazabilidad: e.target.value})} />
                <button type="button" onClick={() => setCampoEscaneo('trazabilidad')} className="absolute right-2 top-8 bg-black text-white p-2 rounded hover:bg-[#f29100]">QR</button>
              </div>
              
              <div className="flex flex-col">
                <label className="text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">Evidencia Fotográfica</label>
                <label className={`flex items-center justify-center gap-2 p-3 border-2 border-dashed cursor-pointer transition-all ${fotoArchivo ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 bg-gray-50 text-gray-400 hover:border-red-600'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  <span className="text-[10px] font-black uppercase">{fotoArchivo ? 'FOTO CAPTURADA' : 'HACER FOTO / SUBIR'}</span>
                  <input type="file" accept="image/*" capture="environment" onChange={(e) => setFotoArchivo(e.target.files?.[0] || null)} className="hidden" />
                </label>
              </div>

              <Button type="submit" disabled={cargando || !puedeRegistrar}>{cargando ? 'PROCESANDO...' : 'REGISTRAR NOK'}</Button>
            </div>
          </form>
        </div>

        {/* --- BLOQUE DE BUSQUEDA --- */}
        <div className="bg-white p-6 shadow-sm border-l-8 border-[#f29100] flex items-center gap-4">
          <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input 
            type="text" 
            placeholder="FILTRAR POR PIEZA, REFERENCIA O CLIENTE..." 
            className="w-full bg-transparent outline-none font-black uppercase tracking-widest text-[11px] text-gray-400 placeholder:text-gray-200"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {/* LOG HISTÓRICO FILTRADO */}
        <div className="bg-white shadow-xl border-t-4 border-black">
          <div className="p-6 bg-gray-50 border-b flex justify-between items-center text-xs font-black uppercase text-gray-500 italic">
            Log de Calidad {esSuperAdmin ? "(Vista Total)" : "(Filtrado)"}
            <span className="text-[10px] not-italic text-gray-400">Items: {registrosFiltrados.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] text-gray-400 uppercase border-b font-black bg-white">
                  <th className="p-5">Pieza / Ref</th>
                  <th className="p-5">Cliente</th>
                  <th className="p-5 text-right">Fecha / Hora</th>
                </tr>
              </thead>
              <tbody>
                {registrosFiltrados.map(r => (
                  <tr key={r.id} className="border-b hover:bg-red-50/10 group">
                    <td className="p-5 font-black uppercase italic leading-tight">{r.nombre_pieza} <br/><span className="text-[9px] font-mono text-gray-400 font-normal">{r.referencia}</span></td>
                    <td className="p-5 uppercase text-[10px] font-bold text-red-600">{r.clientes?.nombre_empresa}</td>
                    <td className="p-5 text-right font-mono text-[10px]">
                      <span className="text-black font-bold">{new Date(r.fecha).toLocaleDateString()}</span>
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