'use server';
/**
 * @fileOverview IA Tradutora Master - Converte metadados estrangeiros para Português Brasil.
 */

import { ai, isAiReady } from '@/ai/genkit';
import { z } from 'genkit';

const TranslateMetadataInputSchema = z.object({
  text: z.string().describe('O texto (título ou descrição) em qualquer idioma.'),
  context: z.enum(['title', 'description']).default('description'),
});

const translateMetadataPrompt = ai.definePrompt({
  name: 'translateMetadataPrompt',
  input: { schema: TranslateMetadataInputSchema },
  output: { schema: z.object({ translatedText: z.string() }) },
  prompt: `Você é um tradutor especializado em serviços de streaming (Netflix, HBO, Disney+).
Sua missão é traduzir o seguinte conteúdo para o Português do Brasil, mantendo o tom chamativo e profissional.

Contexto: {{context}}
Texto original: {{text}}

Se for um título, mantenha nomes próprios conhecidos (Ex: Dragon Ball permanece Dragon Ball).
Se for uma descrição, crie uma sinopse envolvente em português.
Responda apenas com o JSON contendo o campo translatedText.`,
});

export async function translateMetadata(input: z.infer<typeof TranslateMetadataInputSchema>) {
  if (!isAiReady) {
    return { translatedText: input.text }; // Retorna o original se a IA estiver off
  }

  try {
    const { output } = await translateMetadataPrompt(input);
    return { translatedText: output?.translatedText || input.text };
  } catch (error) {
    console.error("Erro na tradução IA:", error);
    return { translatedText: input.text };
  }
}