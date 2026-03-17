// Sistema de autenticação blindado. 
// O acesso agora é validado exclusivamente via banco de dados para segurança total.
export const validateUserPin = (pin: string) => {
  // A validação real agora ocorre no store.ts via consulta ao banco.
  // Esta função permanece apenas como interface compatível.
  return { role: 'user' };
}
