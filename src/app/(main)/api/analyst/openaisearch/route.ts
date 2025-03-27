import { streamText } from "ai";
import { z } from "zod";
import { openai } from "@ai-sdk/openai";
import { generateText } from 'ai';
import { generateObject } from 'ai';
import { tavilyTools } from '@/lib/tools/tavily'
import { db } from '@/lib/db';
import { files } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const maxDuration = 300; // Increase to 5 minutes for complex operations

// Force dynamic to ensure we don't get static rendering issues
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const userId = "default-user";
    const { messages } = await req.json();

    try {
        // Get user's uploaded files
        const userFiles = await db.select()
            .from(files)
            .where(eq(files.userId, userId));

        // Create a more focused context that encourages selective retrieval
        const fileContext = userFiles.length > 0 
            ? `Available documents for analysis:
               ${userFiles.map((f, i) => `${i + 1}. ${f.filename} (URL: ${f.url})`).join('\n')}
               
               To analyze these documents effectively:
               1. First identify which specific documents you need based on the user's question
               2. Then use the extract tool with the FULL URLs provided above
               3. Focus on extracting specific sections rather than entire documents
               
               IMPORTANT: Always use the complete URLs when calling the extract tool, not just the numbers.`
            : '';

        const apiKey = process.env.TAVILY_API_KEY;

        if (!apiKey) {
            console.error('Tavily API key not found');
            return new Response('Configuration error: Tavily API key not found', { status: 500 })
        }

        const result = await streamText({
            model: openai('gpt-4o-mini'),
            system: `
                ${fileContext}
                
                ### Role & Goal:
                You are an equity research assistant focused on providing precise, targeted analysis.
                
                ### Document Analysis Strategy:
                1. FIRST identify which specific documents are relevant to the user's question
                2. Request ONLY those relevant documents using the extract tool
                3. Focus on extracting specific sections rather than entire documents
                4. If a document seems irrelevant after initial extraction, skip further analysis of it
                
                ### Key Principles:
                - Be selective: Don't analyze documents that aren't directly relevant
                - Be precise: Extract only the sections needed to answer the question
                - Be efficient: Stop analysis if a document proves irrelevant
                - Be thorough: But only with the most relevant content
                
                ### Guidelines:
                - Always explain which documents you're choosing to analyze and why
                - If the initial extraction doesn't yield relevant information, adjust your approach
                - Provide specific citations when quoting or referencing content
            `,
            messages,
            tools: {
                ...tavilyTools({ apiKey }, {
                    excludeTools: [],
                }),
            },
            toolCallStreaming: true,
            toolChoice: 'auto',
            maxSteps: 15,
            temperature: 0.7
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