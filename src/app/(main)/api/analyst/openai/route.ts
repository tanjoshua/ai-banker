import { streamText, tool } from "ai";
import { z } from "zod";
import { CellFormat, dcfParametersSchema, renderSpreadsheetCell } from "@/components/spreadsheet/types";
import { openai } from "@ai-sdk/openai";
import { dcfExample } from "@/components/spreadsheet/templates/dcf";
export const maxDuration = 60; // Increase to 60 seconds for complex operations

// Force dynamic to ensure we don't get static rendering issues
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const { messages } = await req.json();

    try {
        const result = streamText({
            model: openai('gpt-4o'),
            system: `
                You are an Investment Analyst, a financial expert chatbot that helps users analyze stocks, interpret market trends, and make informed investment decisions.
                Provide in-depth, data-driven analysis when answering queries.

                If the user asks for a spreadsheet model, you should first use the getSpreadsheetTemplate tool to get the template. Then, fill in the template with the relevant parameters and assumptions.
                
                Once you have the final spreadsheet, use the renderSpreadsheet tool with the final spreadsheet cells.
            `,
            messages,
            toolCallStreaming: true,
            toolChoice: 'auto',
            tools: {
                getSpreadsheetTemplate: tool({
                    description: "A tool to get the spreadsheet template",
                    parameters: z.object({
                        type: z.enum(['dcf'])
                    }),
                    execute: async ({ type }) => {
                        if (type === 'dcf') {
                            return dcfExample;
                        }
                        // can add other templates next time, or even let the user choose the template
                    }
                }),
                renderSpreadsheet: tool({
                    description: "A tool to render the final spreadsheet",
                    parameters: z.object({
                        cells: z.array(z.array(renderSpreadsheetCell))
                    })
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