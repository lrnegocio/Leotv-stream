'use server';
/**
 * @fileOverview Fluxo do App Prototyper - O parceiro de IA oficial do Léo Stream.
 * 
 * - adminAssistant - Função principal de interação e suporte técnico.
 * - Ferramentas integradas para consulta de dados em tempo real.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getRemoteUsers, getRemoteContent } from '@/lib/store';

// Ferramenta para buscar estatísticas do sistema
const getSystemStats = ai.defineTool(
  {
    name: 'getSystemStats',
    description: 'Retorna estatísticas técnicas reais sobre a rede Léo Stream.',
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
    description: 'Localiza um cliente na rede e retorna seu status completo.',
    inputSchema: z.object({
      pin: z.string().describe('O código PIN de 6 dígitos do cliente.'),
    }),
    outputSchema: z.any(),
  },
  async (input) => {
    const users = await getRemoteUsers();
    return users.find(u => u.pin === input.pin) || { error: 'Cliente não localizado na base de dados.' };
  }
);

const AdminAssistantInputSchema = z.object({
  message: z.string().describe('A pergunta ou comando técnico do Mestre Léo.'),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.array(z.object({ text: z.string() })),
  })).optional(),
});

const AdminAssistantOutputSchema = z.object({
  response: z.string().describe('A resposta técnica e proativa do App Prototyper.'),
});

export async function adminAssistant(input: z.infer<typeof AdminAssistantInputSchema>) {
  try {
    const { output } = await ai.generate({
      // Usando o modelo configurado no genkit.ts para estabilidade
      model: 'googleai/gemini-2.5-flash',
      system: `Você é o "App Prototyper", o parceiro de IA oficial e engenheiro de sistemas da Léo Stream.
      Você é altamente capacitado, técnico e focado em manter a rede operando em 100% de performance.
      Seu tom é profissional, direto e muito leal ao "Mestre Léo".
      
      Suas capacidades:
      1. Analisar estatísticas de rede (usuários ativos, bloqueios, expirações).
      2. Diagnosticar problemas com PINs específicos usando as ferramentas.
      3. Sugerir melhorias no código e na estrutura da biblioteca de canais.
      4. Auxiliar o Mestre Léo na gestão de milhares de canais P2P.
      
      IMPORTANTE: Sempre que o Mestre perguntar sobre dados do sistema, use as ferramentas.
      Se ele pedir para mudar o código, forneça o código pronto.
      Você é o co-piloto do sistema.`,
      prompt: input.message,
      tools: [getSystemStats, findUserByPin],
      history: input.history,
    });

    return { response: output?.text || "Mestre Léo, houve uma oscilação no meu processamento. Pode reenviar o comando?" };
  } catch (error) {
    return { response: "Mestre Léo, houve um erro na conexão com o núcleo de inteligência. Vou reiniciar os protocolos de comunicação." };
  }
}