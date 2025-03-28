import { tool, type Tool } from 'ai'
import { z } from 'zod'
import { tavily } from '@tavily/core'
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf"

type TavilyTools = 'search' | 'searchContext' | 'searchQNA' | 'extract'

interface TavilyImage {
  url: string
  description?: string
}

interface TavilySearchResult {
  title: string
  url: string
  content: string
  rawContent?: string
  score: number
  publishedDate?: string
}

interface TavilySearchResponse {
  query: string
  answer?: string
  images?: TavilyImage[]
  results: TavilySearchResult[]
  responseTime: number
  error?: string // Added to handle errors
}

interface TavilyExtractResult {
  url: string
  rawContent: string
  images?: string[]
  error?: string
}

interface TavilyExtractResponse {
  results: TavilyExtractResult[]
  error?: string
}

// Helper function to check if a URL points to a PDF
function isPdfUrl(url: string): boolean {
  return url.toLowerCase().endsWith('.pdf') || url.toLowerCase().includes('.pdf?');
}

export const tavilyTools = (
  { apiKey }: { apiKey: string },
  config?: {
    excludeTools?: TavilyTools[]
  }
): Partial<Record<TavilyTools, Tool>> => {
  const client = tavily({ apiKey })

  const tools: Partial<Record<TavilyTools, Tool>> = {
    search: tool({
      description:
        'Perform a comprehensive web search and get detailed results including optional images and AI-generated answers',
      parameters: z.object({
        query: z
          .string()
          .describe('The search query to find information about'),
        searchDepth: z
          .enum(['basic', 'advanced'])
          .optional()
          .describe(
            'Depth of search - basic is faster, advanced is more thorough'
          ),
        topic: z
          .enum(['general', 'news'])
          .optional()
          .describe(
            'Category of search - general for broad searches, news for recent events'
          ),
        days: z
          .number()
          .optional()
          .describe(
            'Number of days back to search (only works with news topic, defaults to 3)'
          ),
        timeRange: z
          .enum(['day', 'week', 'month', 'year', 'd', 'w', 'm', 'y'])
          .optional()
          .describe('Time range for results - alternative to days parameter'),
        maxResults: z
          .number()
          .optional()
          .describe('Maximum number of results to return (default: 5)'),
        includeImages: z
          .boolean()
          .optional()
          .describe('Include related images in the response'),
        includeImageDescriptions: z
          .boolean()
          .optional()
          .describe(
            'Add descriptive text for each image (requires includeImages)'
          ),
        includeAnswer: z
          .boolean()
          .optional()
          .describe(
            'Include AI-generated answer to query - basic is quick, advanced is detailed'
          ),
        includeRawContent: z
          .boolean()
          .optional()
          .describe('Include cleaned HTML content of each result'),
        includeDomains: z
          .array(z.string())
          .optional()
          .describe('List of domains to specifically include in results'),
        excludeDomains: z
          .array(z.string())
          .optional()
          .describe('List of domains to exclude from results'),
      }),
      execute: async ({ query, ...options }) => {
        try {
          return await client.search(query, {
            ...options,
          })
        } catch (error) {
          return { error: String(error) } as TavilySearchResponse
        }
      },
    }),
    searchContext: tool({
      description:
        'Search the web and get content and sources within a specified token limit, optimized for context retrieval',
      parameters: z.object({
        query: z
          .string()
          .describe('The search query to find information about'),
        maxTokens: z
          .number()
          .optional()
          .describe('Maximum number of tokens in the response (default: 4000)'),
        searchDepth: z
          .enum(['basic', 'advanced'])
          .optional()
          .describe(
            'Depth of search - basic is faster, advanced is more thorough'
          ),
        topic: z
          .enum(['general', 'news'])
          .optional()
          .describe(
            'Category of search - general for broad searches, news for recent events'
          ),
        days: z
          .number()
          .optional()
          .describe(
            'Number of days back to search (only works with news topic)'
          ),
        maxResults: z
          .number()
          .optional()
          .describe('Maximum number of results to return'),
        includeDomains: z
          .array(z.string())
          .optional()
          .describe('List of domains to specifically include in results'),
        excludeDomains: z
          .array(z.string())
          .optional()
          .describe('List of domains to exclude from results'),
      }),
      execute: async ({ query, ...options }) => {
        try {
          return await client.searchContext(query, options)
        } catch (error) {
          return String(error)
        }
      },
    }),
    searchQNA: tool({
      description:
        'Search the web and get a direct answer to your question, optimized for AI agent interactions',
      parameters: z.object({
        query: z.string().describe('The question to find an answer for'),
        searchDepth: z
          .enum(['basic', 'advanced'])
          .optional()
          .describe(
            'Depth of search - defaults to advanced for better answers'
          ),
        topic: z
          .enum(['general', 'news'])
          .optional()
          .describe(
            'Category of search - general for broad searches, news for recent events'
          ),
        days: z
          .number()
          .optional()
          .describe(
            'Number of days back to search (only works with news topic)'
          ),
        maxResults: z
          .number()
          .optional()
          .describe('Maximum number of results to consider'),
        includeDomains: z
          .array(z.string())
          .optional()
          .describe('List of domains to specifically include in results'),
        excludeDomains: z
          .array(z.string())
          .optional()
          .describe('List of domains to exclude from results'),
      }),
      execute: async ({ query, ...options }) => {
        try {
          return await client.searchQNA(query, options)
        } catch (error) {
          return String(error)
        }
      },
    }),
    extract: tool({
      description: 'Extract content from URLs, with special handling for PDF files using LangChain.',
      parameters: z.object({
        urls: z
          .array(z.string().url())
          .max(20)
          .describe('List of URLs to extract content from (maximum 20 URLs)'),
        extractDepth: z
          .enum(['basic', 'advanced'])
          .optional()
          .describe(
            'Depth of extraction - advanced retrieves more data including tables and embedded content'
          ),
        includeImages: z
          .boolean()
          .optional()
          .describe('Include images found in the extracted content')
      }),
      execute: async ({ urls, ...options }) => {
        try {
          console.log(`[EXTRACT] Processing ${urls.length} URLs`);

          // Filter to only get PDF URLs
          const pdfUrls = urls.filter(url => isPdfUrl(url));
          const nonPdfUrls = urls.filter(url => !isPdfUrl(url));

          console.log(`[EXTRACT] Found ${pdfUrls.length} PDF URLs and ${nonPdfUrls.length} non-PDF URLs`);

          let results: TavilyExtractResult[] = [];
          let errorMessage = '';

          // Process non-PDF URLs with Tavily
          if (nonPdfUrls.length > 0) {
            try {
              console.log(`[EXTRACT] Processing non-PDF URLs with Tavily: ${nonPdfUrls.join(', ')}`);
              const response = await client.extract(nonPdfUrls, options);
              const tavilyResults = response.results.map((result) => {
                console.log(`[EXTRACT] ✅ Successfully extracted content from ${result.url} (${result.rawContent.length} chars)`);
                return {
                  url: result.url,
                  rawContent: result.rawContent,
                  images: result.images
                };
              });
              results = [...results, ...tavilyResults];
            } catch (error) {
              console.error(`[EXTRACT] ❌ Error extracting non-PDF content with Tavily: ${String(error)}`);
              errorMessage += `Error extracting non-PDF content with Tavily: ${String(error)}. `;
              // Add fallback placeholders for failed non-PDF URLs
              nonPdfUrls.forEach(url => {
                results.push({
                  url,
                  rawContent: `Tavily extraction failed for URL: ${url}`,
                  error: String(error)
                });
              });
            }
          }

          // Process PDF URLs with LangChain's WebPDFLoader
          if (pdfUrls.length > 0) {
            console.log(`[EXTRACT] Processing PDF URLs with LangChain: ${pdfUrls.join(', ')}`);
            for (const url of pdfUrls) {
              try {
                console.log(`[EXTRACT] Fetching PDF from ${url}`);
                // First download the PDF from the URL
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.statusText}`);

                const pdfBlob = await response.blob();
                console.log(`[EXTRACT] Downloaded PDF blob of size ${pdfBlob.size} bytes from ${url}`);

                // Use WebPDFLoader with the blob directly
                const loader = new WebPDFLoader(pdfBlob);
                const docs = await loader.load();
                console.log(`[EXTRACT] PDF parsed into ${docs.length} pages`);

                // Combine content from all pages
                const pdfContent = docs.map((doc: { pageContent: string }) => doc.pageContent).join("\n\n");
                console.log(`[EXTRACT] ✅ Successfully extracted content from PDF ${url} (${pdfContent.length} chars)`);

                results.push({
                  url,
                  rawContent: pdfContent,
                  // Note: WebPDFLoader doesn't extract images natively
                });
              } catch (pdfError) {
                console.error(`[EXTRACT] ❌ Error processing PDF ${url}: ${String(pdfError)}`);
                results.push({
                  url,
                  rawContent: `Failed to extract content from PDF: ${url}`,
                  error: String(pdfError)
                });
                errorMessage += `Error processing PDF ${url}: ${String(pdfError)}. `;
              }
            }
          }

          console.log(`[EXTRACT] Completed with ${results.length} results. ${errorMessage ? 'Errors: ' + errorMessage : 'No errors.'}`);
          return {
            results,
            error: errorMessage || undefined
          } as TavilyExtractResponse;
        } catch (error) {
          return {
            results: [],
            error: String(error),
          } as TavilyExtractResponse
        }
      },
    }),
  }

  for (const toolName in tools) {
    if (config?.excludeTools?.includes(toolName as TavilyTools)) {
      delete tools[toolName as TavilyTools]
    }
  }

  return tools
}
