'use server';
/**
 * @fileOverview Um assistente de IA para diagnosticar falhas de stream e fornecer soluções.
 *
 * - streamFailureTroubleshooting - Uma função que analisa o status de um stream com falha e oferece diagnóstico e etapas de solução de problemas.
 * - StreamFailureTroubleshootingInput - O tipo de entrada para a função streamFailureTroubleshooting.
 * - StreamFailureTroubleshootingOutput - O tipo de retorno para a função streamFailureTroubleshooting.
 */

import { ai, isAiReady } from '@/ai/genkit';
import { z } from 'genkit';

const StreamFailureTroubleshootingInputSchema = z.object({
  streamUrl: z.string().describe('A URL do stream que falhou ao carregar ou reproduzir.'),
  errorCode: z.string().optional().describe('Um código de erro opcional fornecido pelo reprodutor de vídeo.'),
  errorMessage: z.string().optional().describe('Uma mensagem de erro opcional detalhando a falha do stream.'),
  networkStatus: z.string().describe('O status atual da conexão de rede do usuário (e.g., online, offline, conexão fraca).'),
  deviceInfo: z.string().describe('Informações sobre o dispositivo e ambiente do usuário (e.g., "Web Browser no Windows", "Android TV").'),
  troubleshootingHistory: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.array(z.object({ text: z.string() })),
  })).optional().describe('Histórico de conversas anteriores para manter o contexto, se houver.'),
});
export type StreamFailureTroubleshootingInput = z.infer<typeof StreamFailureTroubleshootingInputSchema>;

const StreamFailureTroubleshootingOutputSchema = z.object({
  diagnosis: z.string().describe('O diagnóstico da IA sobre a causa provável da falha do stream.'),
  troubleshootingSteps: z.array(z.string()).describe('Uma lista de etapas claras e acionáveis que o usuário pode seguir para tentar resolver o problema.'),
  alternativeStreamSuggestions: z.array(z.object({
    title: z.string().describe('O título do stream alternativo.'),
    url: z.string().describe('A URL do stream alternativo.'),
  })).optional().describe('Sugestões de streams alternativos, se o problema parecer insolúvel para o stream atual.'),
  isResolvable: z.boolean().describe('Indica se a IA acredita que o problema é potencialmente resolúvel pelo usuário com as etapas fornecidas.'),
});
export type StreamFailureTroubleshootingOutput = z.infer<typeof StreamFailureTroubleshootingOutputSchema>;

const streamFailureTroubleshootingPrompt = ai.definePrompt({
  name: 'streamFailureTroubleshootingPrompt',
  input: { schema: StreamFailureTroubleshootingInputSchema },
  output: { schema: StreamFailureTroubleshootingOutputSchema },
  prompt: `Você é um agente de suporte técnico especializado em streaming para a plataforma StreamSight. Seu objetivo é ajudar o usuário a resolver problemas de reprodução de streams.
Analise as informações fornecidas sobre a falha do stream e forneça um diagnóstico claro, etapas acionáveis de solução de problemas e, se apropriado, sugestões de streams alternativos.

Informações sobre a falha do stream:
- URL do Stream com Problema: {{{streamUrl}}}
{{#if errorCode}}- Código de Erro: {{{errorCode}}}{{/if}}
{{#if errorMessage}}- Mensagem de Erro: {{{errorMessage}}}{{/if}}
- Status da Conexão de Rede: {{{networkStatus}}}
- Dispositivo e Ambiente: {{{deviceInfo}}}

Com base nessas informações, forneça um diagnóstico, uma lista de etapas de solução de problemas que o usuário pode seguir e, se o problema parecer insolúvel ou se houver uma alternativa clara, sugira outros streams. Determine se o problema é algo que o usuário pode resolver com as etapas fornecidas.

Estruture sua resposta estritamente no formato JSON, conforme o schema de saída.`,
});

const streamFailureTroubleshootingFlow = ai.defineFlow(
  {
    name: 'streamFailureTroubleshootingFlow',
    inputSchema: StreamFailureTroubleshootingInputSchema,
    outputSchema: StreamFailureTroubleshootingOutputSchema,
  },
  async (input) => {
    const { output } = await streamFailureTroubleshootingPrompt(input);
    return output!;
  }
);

export async function streamFailureTroubleshooting(
  input: StreamFailureTroubleshootingInput
): Promise<StreamFailureTroubleshootingOutput> {
  // BLINDAGEM MESTRE: Evita erro 500 se a IA não estiver configurada
  if (!isAiReady) {
    return {
      diagnosis: 'O sistema de IA não está configurado. Por favor, verifique a chave GOOGLE_GENAI_API_KEY.',
      troubleshootingSteps: [
        'Verifique se a variável de ambiente GOOGLE_GENAI_API_KEY está definida e é válida.',
        'Entre em contato com o suporte técnico se o problema persistir.',
      ],
      alternativeStreamSuggestions: [],
      isResolvable: false,
    };
  }

  try {
    const flowInput = { ...input, history: input.troubleshootingHistory };
    const result = await streamFailureTroubleshootingFlow(flowInput);
    return result;
  } catch (error: any) {
    console.error('Erro ao executar o fluxo streamFailureTroubleshooting:', error);
    return {
      diagnosis: 'Erro no núcleo de IA. Houve uma falha ao diagnosticar o problema do stream.',
      troubleshootingSteps: [
        'Verifique sua conexão com a internet.',
        'Tente recarregar a página ou o aplicativo.',
        'Entre em contato com o suporte técnico e forneça os detalhes do erro.',
      ],
      alternativeStreamSuggestions: [],
      isResolvable: false,
    };
  }
}
