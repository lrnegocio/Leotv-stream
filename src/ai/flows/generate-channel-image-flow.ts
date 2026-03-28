'use server';
/**
 * @fileOverview IA para gerar capas blindada contra erros de chave.
 */

import {ai, isAiReady} from '@/ai/genkit';
import {z} from 'genkit';

export async function generateChannelImage(input: { title: string; genre: string }) {
  if (!isAiReady) {
    throw new Error('API KEY não configurada. Configure GOOGLE_GENAI_API_KEY no Vercel.');
  }

  try {
    const { media } = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: `Streaming poster for "${input.title}" genre "${input.genre}", cinematic style, high quality, no text.`,
    });

    if (!media) throw new Error('Imagem não retornada pela IA.');
    return { imageUrl: media.url };
  } catch (error: any) {
    console.error("Erro ao gerar imagem:", error);
    throw new Error("Falha na IA de Imagem: " + (error.message || "Erro desconhecido"));
  }
}
