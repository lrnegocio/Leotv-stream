import { redirect } from 'next/navigation';

/**
 * REDIRECIONADOR SOBERANO v385-S
 * Garante que qualquer acesso ao IP ou Domínio caia direto no Login.
 * Isso elimina o erro "Cannot GET /".
 */
export default function Home() {
  redirect('/login');
}
