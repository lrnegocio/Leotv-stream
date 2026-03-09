'use server';
/**
 * @fileOverview Fluxo da Léo IA - A assistente inteligente (Alexa) do Painel Administrativo.
 * 
 * - adminAssistant - Função principal de interação.
 * - Ferramentas integradas para consultar Supabase.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getRemoteUsers, getRemoteContent } from '@/lib/store';

// Ferramenta para buscar estatísticas do sistema
const getSystemStats = ai.defineTool(
  {
    name: 'getSystemStats',
    description: 'Retorna estatísticas gerais sobre clientes, canais e assinaturas.',
    inputSchema: z.object({}),
    outputSchema: z.object({
      totalUsers: z.number(),
      totalContent: z.number(),
      activeUsers: z.number(),
      blockedUsers: z.number(),
      expiredUsers: z.number(),
    }),
  },
  async () => {
    const users = await getRemoteUsers();
    const content = await getRemoteContent();
    const now = new Date();
    
    return {
      totalUsers: users.length,
      totalContent: content.length,
      activeUsers: users.filter(u => !u.isBlocked).length,
      blockedUsers: users.filter(u => u.isBlocked).length,
      expiredUsers: users.filter(u => u.expiryDate && new Date(u.expiryDate) < now).length,
    };
  }
);

// Ferramenta para buscar um cliente específico pelo PIN
const findUserByPin = ai.defineTool(
  {
    name: 'findUserByPin',
    description: 'Busca informações detalhadas de um cliente usando o código PIN.',
    inputSchema: z.object({
      pin: z.string().describe('O código PIN de 6 dígitos do cliente.'),
    }),
    outputSchema: z.any(),
  },
  async (input) => {
    const users = await getRemoteUsers();
    return users.find(u => u.pin === input.pin) || { error: 'Cliente não encontrado.' };
  }
);

const AdminAssistantInputSchema = z.object({
  message: z.string().describe('A pergunta ou comando do mestre/administrador.'),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.array(z.object({ text: z.string() })),
  })).optional(),
});

const AdminAssistantOutputSchema = z.object({
  response: z.string().describe('A resposta inteligente da assistente.'),
});

export async function adminAssistant(input: z.infer<typeof AdminAssistantInputSchema>) {
  const { output } = await ai.generate({
    model: 'googleai/gemini-2.0-flash',
    system: `Você é a "Léo IA", a assistente inteligente oficial do sistema Léo Stream.
    Você é inspirada na Alexa: educada, eficiente e muito proativa.
    Seu tom é profissional mas amigável (chame o administrador de "Mestre" ou "Mestre Léo").
    
    Suas capacidades:
    1. Consultar estatísticas de rede (clientes ativos, bloqueados, etc).
    2. Verificar status de PINs específicos.
    3. Analisar o catálogo de canais.
    
    Se o Mestre perguntar sobre o sistema, use as ferramentas disponíveis para dar dados REAIS.
    Nunca invente estatísticas. Se não souber, peça para verificar no banco de dados.`,
    prompt: input.message,
    tools: [getSystemStats, findUserByPin],
    history: input.history,
  });

  return { response: output?.text || "Desculpe Mestre, tive um pequeno problema no sinal. Pode repetir?" };
}
