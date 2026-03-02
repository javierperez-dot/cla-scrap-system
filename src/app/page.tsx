import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redirigimos automáticamente al login al entrar en la web
  redirect('/login');
}