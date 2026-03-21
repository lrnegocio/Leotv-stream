'use server';
/**
 * @fileOverview AI Flow for generating high-quality channel covers/posters.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateChannelImageInputSchema = z.object({
  title: z.string().describe('The name of the TV channel or movie.'),
  genre: z.string().describe('The genre or category.'),
});
export type GenerateChannelImageInput = z.infer<typeof GenerateChannelImageInputSchema>;

const GenerateChannelImageOutputSchema = z.object({
  imageUrl: z.string().describe('The base64 data URI of the generated image.'),
});
export type GenerateChannelImageOutput = z.infer<typeof GenerateChannelImageOutputSchema>;

export async function generateChannelImage(input: GenerateChannelImageInput): Promise<GenerateChannelImageOutput> {
  const { media } = await ai.generate({
    model: 'googleai/imagen-4.0-fast-generate-001',
    prompt: `Create a cinematic, professional and high-quality streaming service poster for a channel named "${input.title}". 
    The theme should be related to "${input.genre}". 
    Use vibrant lighting, 4k resolution style, no text on the image, and a dark aesthetic background.`,
  });

  if (!media) throw new Error('Falha ao gerar imagem.');

  return { imageUrl: media.url };
}