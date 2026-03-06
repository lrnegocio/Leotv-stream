// Removido sistema de backend externo para evitar erros de servidor.
// Todo o acesso agora é controlado via LocalStorage e PIN fixo de administrador.
export const validateUserPin = (pin: string) => {
  if (pin === 'adm77x2p') return { role: 'admin' };
  return { role: 'user' };
}
