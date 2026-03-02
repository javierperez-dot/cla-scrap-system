'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export const useLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      // Buscamos el usuario en la tabla de Supabase
      const { data, error: dbError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();

      if (dbError || !data) {
        setError('Credenciales incorrectas');
      } else {
        // Guardamos la sesión localmente
        localStorage.setItem('usuario_scrap', JSON.stringify(data));
        // Navegamos al dashboard
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Fallo de conexión');
    } finally {
      setCargando(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    handleSubmit,
    error,
    cargando
  };
};