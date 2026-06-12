import { redirect } from 'next/navigation';

/**
 * REDIRECIONADOR SOBERANO v385-S
 * Elimina o erro 'Cannot GET /' forçando a rota de Login.
 */
export default function Home() {
  redirect('/login');
}
