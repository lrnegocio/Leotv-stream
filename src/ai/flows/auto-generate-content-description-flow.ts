'use server';
/**
 * @fileOverview An AI agent for automatically generating engaging content descriptions.
 *
 * - autoGenerateContentDescription - A function that handles the content description generation process.
 * - AutoGenerateContentDescriptionInput - The input type for the autoGenerateContentDescription function.
 * - AutoGenerateContentDescriptionOutput - The return type for the autoGenerateContentDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutoGenerateContentDescriptionInputSchema = z.object({
  title: z.string().describe('The title of the movie or series.'),
  contentType: z.enum(['movie', 'series']).describe('The type of content (movie or series).'),
  genre: z.string().optional().describe('The genre of the content (e.g., "sci-fi", "drama").'),
  keywords: z.string().optional().describe('Comma-separated keywords relevant to the content.'),
});
export type AutoGenerateContentDescriptionInput = z.infer<typeof AutoGenerateContentDescriptionInputSchema>;

const AutoGenerateContentDescriptionOutputSchema = z.object({
  description: z.string().describe('An engaging and concise description for the content.'),
});
export type AutoGenerateContentDescriptionOutput = z.infer<typeof AutoGenerateContentDescriptionOutputSchema>;

export async function autoGenerateContentDescription(input: AutoGenerateContentDescriptionInput): Promise<AutoGenerateContentDescriptionOutput> {
  return autoGenerateContentDescriptionFlow(input);
}

const autoGenerateContentDescriptionPrompt = ai.definePrompt({
  name: 'autoGenerateContentDescriptionPrompt',
  input: {schema: AutoGenerateContentDescriptionInputSchema},
  output: {schema: AutoGenerateContentDescriptionOutputSchema},
  prompt: `You are an expert content description writer for a streaming platform. Your task is to create an engaging and concise description for a piece of content.

Content Type: {{{contentType}}}
Title: {{{title}}}
{{#if genre}}Genre: {{{genre}}}{{/if}}
{{#if keywords}}Keywords: {{{keywords}}}{{/if}}

Generate a compelling description (around 2-3 sentences) that highlights the main appeal of this {{contentType}} for potential viewers.`,
});

const autoGenerateContentDescriptionFlow = ai.defineFlow(
  {
    name: 'autoGenerateContentDescriptionFlow',
    inputSchema: AutoGenerateContentDescriptionInputSchema,
    outputSchema: AutoGenerateContentDescriptionOutputSchema,
  },
  async (input) => {
    const {output} = await autoGenerateContentDescriptionPrompt(input);
    if (!output) {
      throw new Error('Failed to generate content description.');
    }
    return output;
  }
);
