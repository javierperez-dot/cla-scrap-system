'use client';

import React, { useEffect, useState } from 'react';
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

  const SUPERADMIN_EMAIL = 'javier.perez@randstad.es';

  const cargarUsuarios = async (termino = '') => {
    const userStr = localStorage.getItem('usuario_scrap');
    const me = userStr ? JSON.parse(userStr) : null;
    
    let query = supabase.from('usuarios').select('*').order('nombre');
    
    // Filtro de jerarquía profesional: 
    // Supervisor solo ve Operarios. Maestro/Admin ven todo.
    if (me && me.rol === 'Supervisor' && me.email !== SUPERADMIN_EMAIL && me.rol !== 'Maestro') {
      query = query.eq('rol', 'Operario');
    }

    if (termino) {
      query = query.or(`nombre.ilike.%${termino}%,dni.ilike.%${termino}%,email.ilike.%${termino}%`);
    }

    const { data } = await query;
    setUsuarios(data || []);
  };

  useEffect(() => { 
    const userStr = localStorage.getItem('usuario_scrap');
    if (userStr) {
      const parsed = JSON.parse(userStr);
      setUsuarioActual(parsed);
      if (parsed.rol === 'Supervisor') {
        setFormData(prev => ({ ...prev, rol: 'Operario' }));
      }
    }
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
      // Lógica de seguridad: solo Maestro/Admin pueden asignar roles altos
      rol: (usuarioActual?.rol === 'Maestro' || usuarioActual?.rol === 'Administrador' || usuarioActual?.email === SUPERADMIN_EMAIL) 
           ? formData.rol 
           : 'Operario' 
    };

    try {
      const { data: duplicados } = await supabase
        .from('usuarios')
        .select('dni')
        .eq('dni', datosProcesados.dni)
        .maybeSingle();

      if (duplicados) throw new Error(`El DNI ${datosProcesados.dni} ya está registrado.`);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: datosProcesados.email,
        password: datosProcesados.password,
        options: { data: { full_name: datosProcesados.nombre } }
      });

      if (authError) throw authError;

      const { error: dbError } = await supabase.from('usuarios').insert([{
        id: authData.user?.id,
        nombre: datosProcesados.nombre,
        dni: datosProcesados.dni,
        email: datosProcesados.email,
        password: datosProcesados.password,
        rol: datosProcesados.rol,
        tiene_acceso_centros: false 
      }]);

      if (dbError) throw dbError;
      
      alert('USUARIO SINCRONIZADO EN SISTEMA CLA');
      setFormData({ id: '', nombre: '', dni: '', email: '', password: '', rol: 'Operario' });
      cargarUsuarios();
    } catch (err: any) {
      alert('ERROR: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  const soyMaestroTotal = usuarioActual?.rol === 'Maestro' || usuarioActual?.email === SUPERADMIN_EMAIL;
  const soyAdminGlobal = usuarioActual?.rol === 'Administrador' || soyMaestroTotal;

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-gray-800 text-[13px]">
      <Navbar />

      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 shadow-sm border-l-8 border-black gap-4">
          <div>
            <h2 className="text-[10px] font-black text-[#f29100] uppercase tracking-[0.4em] mb-2 italic">Seguridad y Jerarquía</h2>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none">
                Gestión de Personal {soyMaestroTotal && <span className="text-[#f29100]">/ Maestro</span>}
            </h1>
          </div>
          <Link href="/dashboard/admin" className="bg-black text-white px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-[#f29100] transition-all italic shadow-lg">
            ← Volver al Panel Admin
          </Link>
        </div>

        <div className="bg-white p-8 shadow-xl border-t-4 border-black">
          <h2 className="text-xs font-black uppercase mb-8 tracking-[0.2em] border-b pb-4 text-gray-400 italic">
            Alta de Nuevo Personal (Jerarquía: {usuarioActual?.rol})
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
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest italic">Nivel de Acceso Global</label>
                <select 
                  name="rol" 
                  value={formData.rol} 
                  onChange={handleChange}
                  disabled={!soyAdminGlobal}
                  className={`bg-gray-100 p-3 text-sm font-bold border-b-2 border-black h-[46px] outline-none uppercase appearance-none ${!soyAdminGlobal ? 'cursor-not-allowed opacity-60' : 'cursor-pointer text-gray-800'}`}
                >
                  <option value="Operario">Operario</option>
                  <option value="Cliente">Cliente</option>
                  {soyAdminGlobal && (
                    <>
                      <option value="Supervisor">Supervisor</option>
                      <option value="Administrador">Administrador</option>
                    </>
                  )}
                  {soyMaestroTotal && (
                    <option value="Maestro">Maestro (Full Access)</option>
                  )}
                </select>
                {!soyAdminGlobal && <p className="text-[8px] font-bold text-red-500 uppercase mt-1 italic">Solo puedes crear Operarios y Clientes</p>}
              </div>
              <Button type="submit" disabled={cargando}>
                {cargando ? 'PROCESANDO...' : 'Sincronizar Nuevo Usuario'}
              </Button>
            </div>
          </form>
        </div>

        {/* BUSCADOR */}
        <div className="bg-white p-4 shadow-lg border-l-4 border-[#f29100] flex items-center gap-4">
          <div className="bg-gray-100 p-2 rounded text-xs">🔍</div>
          <input 
            type="text" 
            placeholder="BUSCAR EN BASE DE DATOS..." 
            className="w-full bg-transparent outline-none text-xs font-black uppercase tracking-widest placeholder:text-gray-300"
            value={busqueda} 
            onChange={(e) => setBusqueda(e.target.value)} 
          />
        </div>

        {/* TABLA DE USUARIOS */}
        <div className="bg-white shadow-xl border-t-4 border-black overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] text-gray-400 uppercase border-b bg-white font-black italic">
                  <th className="p-5">Personal / DNI</th>
                  <th className="p-5 text-center">Rango</th>
                  <th className="p-5 text-center">Gestión Perfil</th>
                  <th className="p-5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => {
                  const esRoot = u.email === SUPERADMIN_EMAIL || u.rol === 'Maestro';
                  const bloquearGestion = esRoot && !soyMaestroTotal;

                  return (
                    <tr key={u.id} className="border-b hover:bg-gray-50 transition-colors group">
                      <td className="p-5">
                        <p className="font-black italic uppercase text-gray-900 group-hover:text-[#f29100] transition-colors leading-none mb-1">
                          {u.nombre} {esRoot && <span>💎</span>}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono uppercase leading-none">{u.dni}</p>
                      </td>
                      <td className="p-5 text-center">
                        <span className={`text-[8px] font-black px-3 py-1 uppercase italic ${
                          u.rol === 'Maestro' ? 'bg-black text-[#f29100]' : 
                          u.rol === 'Supervisor' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {u.rol}
                        </span>
                      </td>
                      <td className="p-5 text-center">
                        {bloquearGestion ? (
                          <span className="text-[9px] font-black text-gray-300 uppercase italic">🔒 Blindado</span>
                        ) : (
                          <button 
                            onClick={() => router.push(`/dashboard/usuarios/${u.id}`)}
                            className="bg-gray-100 hover:bg-black hover:text-white px-4 py-2 text-[10px] font-black uppercase border border-black transition-all italic"
                          >
                            Editar →
                          </button>
                        )}
                      </td>
                      <td className="p-5 text-center">
                        {!esRoot || soyMaestroTotal ? (
                          <button 
                            onClick={async () => {
                              if(confirm(`¿ELIMINAR A ${u.nombre}?`)) {
                                await supabase.from('usuarios').delete().eq('id', u.id);
                                cargarUsuarios(busqueda);
                              }
                            }} 
                            className="text-[10px] font-black text-gray-400 hover:text-red-600 uppercase italic transition-colors"
                          >
                            Borrar
                          </button>
                        ) : (
                          <span className="text-[10px] grayscale opacity-30 cursor-not-allowed">🚫</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}