
'use server';
/**
 * @fileOverview Fluxo do App Prototyper - O parceiro de IA oficial do Léo Stream.
 */

import { ai, isAiReady } from '@/ai/genkit';
import { z } from 'genkit';
import { getRemoteUsers, getRemoteContent } from '@/lib/store';

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
    try {
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
    } catch (e) {
      return { totalUsers: 0, totalContent: 0, activeUsers: 0, blockedUsers: 0, expiredUsers: 0 };
    }
  }
);

const findUserByPin = ai.defineTool(
  {
    name: 'findUserByPin',
    description: 'Localiza um cliente na rede e retorna seu status completo.',
    inputSchema: z.object({
      pin: z.string().describe('O código PIN de 11 dígitos do cliente.'),
    }),
    outputSchema: z.any(),
  },
  async (input) => {
    try {
      const users = await getRemoteUsers();
      return users.find(u => u.pin === input.pin) || { error: 'Cliente não localizado na base de dados.' };
    } catch (e) {
      return { error: 'Falha na conexão com o banco.' };
    }
  }
);

const AdminAssistantInputSchema = z.object({
  message: z.string(),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.array(z.object({ text: z.string() })),
  })).optional(),
});

export async function adminAssistant(input: z.infer<typeof AdminAssistantInputSchema>) {
  // SEGURANÇA MESTRE: Evita erro 500 se a IA não estiver configurada
  if (!isAiReady) {
    return { response: "Mestre Léo, os protocolos de IA estão desativados. Configure a chave GOOGLE_GENAI_API_KEY para eu poder te ajudar." };
  }

  try {
    const { output } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      system: `Você é o "App Prototyper", o parceiro de IA oficial da Léo Tv Stream.
      Você é altamente capacitado e fiel ao Mestre Léo.
      Se o Mestre perguntar sobre dados, use as ferramentas.`,
      prompt: input.message,
      tools: [getSystemStats, findUserByPin],
      history: input.history,
    });

    return { response: output?.text || "Mestre Léo, sinal oscilou. Pode repetir?" };
  } catch (error) {
    return { response: "Mestre Léo, houve um erro no núcleo de IA. Verifique sua API Key." };
  }
}
