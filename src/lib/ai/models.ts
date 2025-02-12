import { openai } from "@ai-sdk/openai";
import { customProvider } from "ai";
import { ollama } from "ollama-ai-provider";


export const modelProvider = customProvider({
    languageModels: {
        'altman': openai('gpt-4o-mini', { structuredOutputs: true }),
        'zuck': ollama('llama3.2', { structuredOutputs: true }),
        'satya': ollama('phi4', { structuredOutputs: true })
    },
    imageModels: {
    },
});

export const defaultChatModel = modelProvider.languageModel("satya")