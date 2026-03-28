'use server';
/**
 * @fileOverview IA para gerar descrições automáticas sem travar o sistema.
 */

import {ai, isAiReady} from '@/ai/genkit';
import {z} from 'genkit';

const AutoGenerateContentDescriptionInputSchema = z.object({
  title: z.string(),
  contentType: z.enum(['movie', 'series', 'channel']),
});

const autoGenerateContentDescriptionPrompt = ai.definePrompt({
  name: 'autoGenerateContentDescriptionPrompt',
  input: {schema: AutoGenerateContentDescriptionInputSchema},
  output: {schema: z.object({ description: z.string() })},
  prompt: `Você é um redator de streaming. Crie uma descrição curta e chamativa para o {{contentType}}: {{title}}.`,
});

export async function autoGenerateContentDescription(input: any) {
  if (!isAiReady) {
    return { description: "IA desativada. Configure sua API KEY para gerar descrições automáticas." };
  }

  try {
    const {output} = await autoGenerateContentDescriptionPrompt(input);
    return { description: output?.description || "Descrição não gerada." };
  } catch (error) {
    return { description: "Erro ao conectar com a IA. Verifique sua chave secreta." };
  }
}
