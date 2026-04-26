import { config } from 'dotenv';
config();

import '@/ai/flows/admin-assistant-flow.ts';
import '@/ai/flows/auto-generate-content-description-flow.ts';
import '@/ai/flows/generate-channel-image-flow.ts';
import '@/ai/flows/voice-search-content-flow.ts';
import '@/ai/flows/stream-failure-troubleshooting-ai.ts';
import '@/ai/flows/translate-metadata-flow.ts';