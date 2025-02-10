import { openai } from "@ai-sdk/openai";
import { customProvider } from "ai";
import { ollama } from "ollama-ai-provider";


export const modelProvider = customProvider({
    languageModels: {
        'altman': openai('gpt-4o-mini'),
        'zuck': ollama('llama3.2'),
    },
    imageModels: {
    },
});

export const defaultChatModel = modelProvider.languageModel("zuck")