import { streamText, tool } from "ai";
import { z } from "zod";
import { openai } from "@ai-sdk/openai";
import { generateText } from 'ai';
export const maxDuration = 60; // Increase to 60 seconds for complex operations

// Force dynamic to ensure we don't get static rendering issues
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const { messages } = await req.json();

    try {
        const result = await generateText({
            model: openai.responses('gpt-4o-mini'),
            // model: google('gemini-1.5-pro'),
            system: `
                You are an Investment Analyst, a financial expert chatbot that helps users analyze stocks, interpret market trends, and make informed investment decisions.
                Provide in-depth, data-driven analysis when answering queries.
            `,
            messages,
            tools: {
                web_search_preview: openai.tools.webSearchPreview()
            }
            //toolCallStreaming: true,
            //toolChoice: 'auto',
            //maxSteps: 5
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