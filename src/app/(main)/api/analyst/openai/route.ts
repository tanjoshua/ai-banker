import { streamText, tool } from "ai";
import { z } from "zod";
import { dcfParametersSchema } from "@/components/spreadsheet/types";
import { openai } from "@ai-sdk/openai";
export const maxDuration = 60; // Increase to 60 seconds for complex operations

// Force dynamic to ensure we don't get static rendering issues
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const { messages } = await req.json();

    try {
        const result = streamText({
            model: openai('gpt-4o'),
            // model: google('gemini-1.5-pro'),
            system: `
                You are an Investment Analyst, a financial expert chatbot that helps users analyze stocks, interpret market trends, and make informed investment decisions.
                Provide in-depth, data-driven analysis when answering queries.

                If the user asks for a spreadsheet model, you should use the createSpreadsheetModel tool with proper parameters.
            `,
            messages,
            toolCallStreaming: true,
            toolChoice: 'auto',
            tools: {
                createSpreadsheetModel: tool({
                    description: "Create a DCF spreadsheet model for financial analysis with detailed company parameters",
                    parameters: z.object({
                        modelParameters: dcfParametersSchema
                    }),
                })
            },
            maxSteps: 5
        });

        return result.toDataStreamResponse({
            sendSources: true,
            getErrorMessage: (error) => {
                console.error("Tool execution error:", error);
                return `Error processing request: ${error instanceof Error ? error.message : String(error)}`;
            }
        });
    } catch (error) {
        console.error("API route error:", error);
        return new Response(
            JSON.stringify({
                error: `Failed to process request: ${error instanceof Error ? error.message : String(error)}`
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
} 