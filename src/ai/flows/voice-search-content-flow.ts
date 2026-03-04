'use server';
/**
 * @fileOverview A Genkit flow for voice-activated content search.
 *
 * - voiceSearchContent - A function that handles the voice search process.
 * - VoiceSearchContentInput - The input type for the voiceSearchContent function.
 * - VoiceSearchContentOutput - The return type for the voiceSearchContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema
const VoiceSearchContentInputSchema = z.object({
  query: z.string().describe('The transcribed voice search query from the user.'),
});
export type VoiceSearchContentInput = z.infer<typeof VoiceSearchContentInputSchema>;

// Output Schema
const VoiceSearchContentOutputSchema = z.object({
  searchCategory: z.enum(['movie', 'series', 'category', 'general']).describe('The inferred category of the search query.'),
  searchTerm: z.string().describe('The extracted search term from the query.'),
});
export type VoiceSearchContentOutput = z.infer<typeof VoiceSearchContentOutputSchema>;

// Prompt definition
const voiceSearchContentPrompt = ai.definePrompt({
  name: 'voiceSearchContentPrompt',
  input: {schema: VoiceSearchContentInputSchema},
  output: {schema: VoiceSearchContentOutputSchema},
  prompt: `You are a helpful assistant for a TV and streaming content application.
Your task is to understand a user's voice search query and identify if they are looking for a 'movie', 'series', 'category', or 'general' content, and extract the primary search term.

Here are some examples:
- "Find me action movies" -> {"searchCategory": "movie", "searchTerm": "action"}
- "Search for the series The Crown" -> {"searchCategory": "series", "searchTerm": "The Crown"}
- "What's in the comedy category?" -> {"searchCategory": "category", "searchTerm": "comedy"}
- "Show me content related to space" -> {"searchCategory": "general", "searchTerm": "space"}
- "Look up 'Star Wars'" -> {"searchCategory": "general", "searchTerm": "Star Wars"}
- "I want to watch documentaries" -> {"searchCategory": "category", "searchTerm": "documentaries"}
- "Is there anything new in thrillers?" -> {"searchCategory": "category", "searchTerm": "thrillers"}

User query: "{{{query}}}"
Identify the search category and the search term.`,
});

// Flow definition
const voiceSearchContentFlow = ai.defineFlow(
  {
    name: 'voiceSearchContentFlow',
    inputSchema: VoiceSearchContentInputSchema,
    outputSchema: VoiceSearchContentOutputSchema,
  },
  async (input) => {
    const {output} = await voiceSearchContentPrompt(input);
    if (!output) {
      throw new Error('Failed to get output from voiceSearchContentPrompt.');
    }
    return output;
  }
);

// Wrapper function
export async function voiceSearchContent(input: VoiceSearchContentInput): Promise<VoiceSearchContentOutput> {
  return voiceSearchContentFlow(input);
}
