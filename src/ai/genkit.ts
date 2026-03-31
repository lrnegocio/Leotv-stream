import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// BLINDAGEM MESTRE: Verifica se a chave existe antes de iniciar o plugin
const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;

/**
 * Inicialização ultra-segura do Genkit.
 * Se a chave não estiver configurada, o sistema não tenta carregar o modelo 
 * para evitar erro 500 (Internal Server Error) no servidor NextJS.
 */
export const ai = genkit({
  plugins: apiKey ? [googleAI({ apiKey })] : [],
  // Só define o modelo se a chave existir, caso contrário o Genkit crasha no boot
  ...(apiKey ? { model: 'googleai/gemini-2.5-flash' } : {})
});

// Helper para verificar se a IA está pronta para uso
export const isAiReady = !!apiKey;
