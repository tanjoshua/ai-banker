import { openai } from "@ai-sdk/openai";
import { customProvider } from "ai";
import { ollama } from "ollama-ai-provider";
import { google } from "@ai-sdk/google";
import { perplexity } from "@ai-sdk/perplexity";

export const modelProvider = customProvider({
    languageModels: {
        'altman': openai('gpt-4o-mini', { structuredOutputs: true }),
        'zuck': ollama('llama3.2', { structuredOutputs: true }),
        'satya': ollama('phi4', { structuredOutputs: true }),
        'sundar': google('gemini-2.0-flash-001', { structuredOutputs: true }),
        'aravind': perplexity('sonar')
    },
    imageModels: {
    },
});

export const defaultChatModel = modelProvider.languageModel("satya")