'use server';
/**
 * @fileOverview Busca por voz blindada.
 */

import {ai, isAiReady} from '@/ai/genkit';
import {z} from 'genkit';

const VoiceSearchContentInputSchema = z.object({
  query: z.string(),
});

export async function voiceSearchContent(input: { query: string }) {
  if (!isAiReady) {
    // Se a IA estiver off, faz a busca literal para não travar o cliente
    return { searchCategory: 'general', searchTerm: input.query };
  }

  try {
    const {output} = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: `Analise o comando de voz do usuário de IPTV e extraia o termo de busca: "${input.query}". Responda apenas o termo.`,
    });
    return { searchCategory: 'general', searchTerm: output?.text || input.query };
  } catch (error) {
    return { searchCategory: 'general', searchTerm: input.query };
  }
}
