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
    const users = await getRemoteUsers();
    return users.find(u => u.pin === input.pin) || { error: 'Cliente não localizado na base de dados.' };
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
  // TRAVA DE SEGURANÇA MESTRE: Evita erro 500 se não houver chave
  if (!isAiReady) {
    return { response: "Mestre Léo, os protocolos de IA estão desativados. Por favor, configure a chave GOOGLE_GENAI_API_KEY nas variáveis de ambiente da Vercel para eu poder te ajudar." };
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

    return { response: output?.text || "Mestre Léo, houve uma oscilação no sinal. Pode repetir o comando?" };
  } catch (error) {
    console.error("Erro no Admin Assistant:", error);
    return { response: "Mestre Léo, houve um erro na conexão com o núcleo de IA. Verifique se a sua cota da API Key não expirou." };
  }
}
