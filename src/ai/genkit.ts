import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// Blinda a inicialização para evitar Internal Server Error sem API Key
const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;

export const ai = genkit({
  plugins: apiKey ? [googleAI({ apiKey })] : [],
  model: 'googleai/gemini-2.5-flash',
});
