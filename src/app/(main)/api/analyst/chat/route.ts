import { streamText, tool } from "ai";
import { perplexity } from "@ai-sdk/perplexity";
import { z } from "zod";

export const maxDuration = 30; // Allow streaming responses up to 30 seconds

export async function POST(req: Request) {
    const { messages } = await req.json();

    const result = streamText({
        model: perplexity('sonar'),
        system: `
            You are an Investment Analyst, a financial expert chatbot that helps users analyze stocks, interpret market trends, and make informed investment decisions.
            Provide in-depth, data-driven analysis when answering queries. You can create spreadsheet models to help visualize financial data and projections.
        `,
        messages,
        toolCallStreaming: true,
        tools: {
            createSpreadsheetModel: tool({
                description: "Create a spreadsheet model",
                parameters: z.object({
                    type: z.enum(["Discounted Cash Flow"])
                }),
                execute: async ({ type }) => {
                    return {
                        type
                    };
                }
            })
        },
        maxSteps: 3 // Allow the model to make multiple tool calls in a single conversation turn
    });

    return result.toDataStreamResponse({
        sendSources: true,
    });
} 