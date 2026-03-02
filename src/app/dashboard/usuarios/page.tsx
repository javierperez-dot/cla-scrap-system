'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/ui/Navbar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

export default function UsuariosPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ 
    id: '', 
    nombre: '', 
    dni: '', 
    email: '', 
    password: '', 
    rol: 'Operario' 
  });
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [usuarioActual, setUsuarioActual] = useState<any>(null);

  // EMAIL DEL SUPERADMIN (TÚ)
  const SUPERADMIN_EMAIL = 'javier.perez@randstad.es';

  const cargarUsuarios = async (termino = '') => {
    let query = supabase.from('usuarios').select('*').order('nombre');
    if (termino) {
      query = query.or(`nombre.ilike.%${termino}%,dni.ilike.%${termino}%,email.ilike.%${termino}%`);
    }
    const { data } = await query;
    setUsuarios(data || []);
  };

  useEffect(() => { 
    const userStr = localStorage.getItem('usuario_scrap');
    if (userStr) setUsuarioActual(JSON.parse(userStr));
    cargarUsuarios(busqueda); 
  }, [busqueda]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);

    const datosProcesados = {
      nombre: formData.nombre.toUpperCase().trim(),
      dni: formData.dni.toUpperCase().trim(),
      email: formData.email.toLowerCase().trim(),
      password: formData.password,
      rol: formData.rol 
    };

    try {
      const { data: duplicados } = await supabase
        .from('usuarios')
        .select('dni')
        .eq('dni', datosProcesados.dni)
        .maybeSingle();

      if (duplicados) {
        alert(`ERROR: El DNI ${datosProcesados.dni} ya está registrado.`);
        setCargando(false);
        return;
      }

      const { error } = await supabase.from('usuarios').insert([datosProcesados]);
      if (error) throw error;
      
      alert('USUARIO SINCRONIZADO EN EL SISTEMA');
      setFormData({ id: '', nombre: '', dni: '', email: '', password: '', rol: 'Operario' });
      cargarUsuarios();
    } catch (err: any) {
      alert('ERROR: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-gray-800 text-[13px]">
      <Navbar />

      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
        
        {/* CABECERA */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 shadow-sm border-l-8 border-black gap-4">
          <div>
            <h2 className="text-[10px] font-black text-[#f29100] uppercase tracking-[0.4em] mb-2 italic">Seguridad y Accesos</h2>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none">Gestión de Personal</h1>
          </div>
          <Link href="/dashboard/admin" className="bg-black text-white px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-[#f29100] transition-all italic shadow-lg">
            ← Volver al Panel Admin
          </Link>
        </div>

        {/* FORMULARIO DE ALTA */}
        <div className="bg-white p-8 shadow-xl border-t-4 border-black">
          <h2 className="text-xs font-black uppercase mb-8 tracking-[0.2em] border-b pb-4 text-gray-400 italic">
            Alta de Nuevo Operario (Configuración Inicial)
          </h2>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-6">
              <Input label="Nombre y Apellidos" name="nombre" value={formData.nombre} onChange={handleChange} required />
              <Input label="DNI / NIE" name="dni" value={formData.dni} onChange={handleChange} required />
            </div>
            <div className="space-y-6">
              <Input label="Email Corporativo" name="email" value={formData.email} onChange={handleChange} required />
              <Input label="Contraseña" name="password" type="password" value={formData.password} onChange={handleChange} required />
            </div>
            <div className="space-y-6 flex flex-col justify-between">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">Nivel de Acceso</label>
                <select 
                  name="rol" 
                  value={formData.rol} 
                  onChange={handleChange} 
                  className="bg-gray-100 p-3 text-sm font-bold border-b-2 border-transparent focus:border-[#f29100] h-[46px] outline-none uppercase appearance-none cursor-pointer text-gray-800"
                >
                  <option value="Operario">Operario</option>
                  <option value="Administrador">Administrador</option>
                </select>
              </div>
              <Button type="submit" disabled={cargando}>
                {cargando ? 'PROCESANDO...' : 'Sincronizar Usuario'}
              </Button>
            </div>
          </form>
        </div>

        {/* BUSCADOR */}
        <div className="bg-white p-4 shadow-lg border-l-4 border-[#f29100] flex items-center gap-4">
          <div className="bg-gray-100 p-2 rounded text-xs">🔍</div>
          <input 
            type="text" 
            placeholder="BUSCAR POR NOMBRE, DNI O EMAIL..." 
            className="w-full bg-transparent outline-none text-xs font-black uppercase tracking-widest placeholder:text-gray-300"
            value={busqueda} 
            onChange={(e) => setBusqueda(e.target.value)} 
          />
        </div>

        {/* TABLA DE PERSONAL BLINDADA */}
        <div className="bg-white shadow-xl border-t-4 border-[#f29100]">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] text-gray-400 uppercase border-b bg-white font-black">
                  <th className="p-5">Usuario / ID</th>
                  <th className="p-5">Email</th>
                  <th className="p-5 text-center">Configuración</th>
                  <th className="p-5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.length > 0 ? (
                  usuarios.map((u) => {
                    const esSuperadmin = u.email === SUPERADMIN_EMAIL;
                    const soyYo = usuarioActual?.email === SUPERADMIN_EMAIL;
                    const bloquearGestion = esSuperadmin && !soyYo;

                    return (
                      <tr key={u.id} className="border-b hover:bg-gray-50 transition-colors group">
                        <td className="p-5">
                          <p className="font-black italic uppercase text-gray-900 group-hover:text-[#f29100] transition-colors">
                            {u.nombre} {esSuperadmin && <span title="Master Root">👑</span>}
                          </p>
                          <p className="text-[10px] text-gray-400 font-mono uppercase">{u.dni}</p>
                        </td>
                        <td className="p-5 text-gray-500 font-mono lowercase">{u.email}</td>
                        <td className="p-5 text-center">
                          {bloquearGestion ? (
                            <span className="text-[9px] font-black text-gray-300 uppercase italic border border-gray-200 px-3 py-1 bg-gray-50">
                              🔒 Registro Blindado
                            </span>
                          ) : (
                            <button 
                              onClick={() => router.push(`/dashboard/usuarios/${u.id}`)}
                              className="bg-gray-100 hover:bg-black hover:text-white px-4 py-2 text-[10px] font-black uppercase border border-black transition-all italic"
                            >
                              Gestionar Perfil / Permisos →
                            </button>
                          )}
                        </td>
                        <td className="p-5 text-center">
                          {!esSuperadmin ? (
                            <button 
                              onClick={async () => {
                                if(confirm(`¿ELIMINAR A ${u.nombre} DEL SISTEMA?`)) {
                                  await supabase.from('usuarios').delete().eq('id', u.id);
                                  cargarUsuarios(busqueda);
                                }
                              }} 
                              className="text-[10px] font-black text-gray-400 hover:text-red-600 uppercase italic transition-colors"
                            >
                              Borrar
                            </button>
                          ) : (
                            <span className="text-[10px] grayscale opacity-30 select-none cursor-not-allowed">🚫</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
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