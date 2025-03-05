import { streamText } from "ai";
import { defaultChatModel } from "@/lib/ai/models";

export const maxDuration = 30; // Allow streaming responses up to 30 seconds

export async function POST(req: Request) {
    const { messages } = await req.json();

    const result = streamText({
        model: defaultChatModel,
        system: "You are an Investment Analyst, a financial expert chatbot that helps users analyze stocks, interpret market trends, and make informed investment decisions. Provide in-depth, data-driven analysis when answering queries.",
        messages,
    });

    return result.toDataStreamResponse();
} 