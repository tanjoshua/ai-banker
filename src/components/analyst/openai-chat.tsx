"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Send, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ToolInvocation, UIMessage } from 'ai';
import { toast } from 'sonner';
import { Cell, RenderSpreadsheetCell } from '../spreadsheet/types';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../ui/resizable';
import { motion, AnimatePresence } from "motion/react";
import { SpreadSheet } from '../spreadsheet/sheet';
import { createDCFCells } from '../spreadsheet/dcf';
import { LineItem } from '../spreadsheet/types';
import { HistoricalData } from '../spreadsheet/types';
import { financialDataMap } from '../spreadsheet/mockData';

// Type definitions
type Source = {
    id: string;
    url: string;
    title?: string;
};

// SourcesList component (external)
const SourcesList = ({ sources }: { sources: Source[] }) => {
    if (!sources || sources.length === 0) return null;

    return (
        <div className="mt-4 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2 font-semibold">Sources:</p>
            <div className="space-y-1">
                {sources.map((source) => (
                    <a
                        key={`source-${source.id}`}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary"
                    >
                        <ExternalLink size={14} />
                        <span className="truncate">{source.title || new URL(source.url).hostname}</span>
                    </a>
                ))}
            </div>
        </div>
    );
};

// UserMessage component (external)
const UserMessage = ({ content }: { content: string }) => (
    <p className="whitespace-pre-wrap text-sm">{content}</p>
);

// EmptyState component (external)
const EmptyState = () => (
    <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md space-y-4">
            <h3 className="text-xl font-semibold">Welcome to OpenAI Investment Analyst</h3>
            <p className="text-muted-foreground">
                Get insights on stocks, market trends, and investment strategies.
                Ask me anything about financial markets.
            </p>
        </div>
    </div>
);

// ChatInput component (external)
const ChatInput = ({
    input,
    handleInputChange,
    handleSubmit,
    status
}: {
    input: string;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    status: string;
}) => (
    <div className="">
        <form onSubmit={handleSubmit} className="flex gap-2 relative">
            <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask a question about investments..."
                className="flex-1 pr-10 py-6"
                disabled={status === 'submitted' || status === 'streaming'}
            />
            <Button
                type="submit"
                size="icon"
                disabled={(status === 'submitted' || status === 'streaming') || !input.trim()}
                className="absolute right-1 top-1/2 transform -translate-y-1/2"
            >
                {(status === 'submitted' || status === 'streaming') ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                    <Send className="h-4 w-4" />
                )}
            </Button>
        </form>
    </div>
);

// ToolInvocationRenderer component with context
type ToolInvocationProps = {
    toolInvocation: ToolInvocation;
};

// Reusable components for tool invocation rendering
const ToolLoadingState = ({ message }: { message: string }) => (
    <div className="my-2 flex items-center gap-2 p-3 rounded-md bg-muted">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        <p className="text-sm font-medium">{message}</p>
    </div>
);

const ToolResultContainer = ({
    successMessage,
    description,
    children,
    error
}: {
    successMessage: string;
    description?: string;
    children?: React.ReactNode;
    error?: string;
}) => (
    <div className="my-2 border rounded-md p-3">
        <p className="text-sm text-green-700 font-medium mb-2">
            ✓ {successMessage}
        </p>
        {description && (
            <p className="text-xs text-muted-foreground">
                {description}
            </p>
        )}
        {error && (
            <p className="text-sm text-red-500">{error}</p>
        )}
        {children}
    </div>
);

// Source link component for consistent rendering
const SourceLink = ({
    url,
    title,
    index,
    prefix = ""
}: {
    url: string;
    title?: string;
    index: number;
    prefix?: string;
}) => (
    <a
        key={`${prefix}source-${index}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
    >
        <ExternalLink size={12} />
        <span className="truncate">{title || new URL(url).hostname}</span>
    </a>
);

// Search results component
const SearchResults = ({ results }: { results: any[] }) => (
    <div>
        <p className="text-xs text-muted-foreground mb-2">Search Results:</p>
        <div className="space-y-2">
            {results.map((result, index) => (
                <div key={`result-${index}`} className="text-xs border-l-2 border-primary pl-2">
                    <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:underline flex items-center gap-1"
                    >
                        {result.title} <ExternalLink size={12} />
                    </a>
                    <p className="line-clamp-2 text-muted-foreground mt-1">
                        {result.content}
                    </p>
                </div>
            ))}
        </div>
    </div>
);

// Sources list component for tools
const ToolSourcesList = ({
    results,
    title = "Sources:",
    prefix = ""
}: {
    results: any[];
    title?: string;
    prefix?: string;
}) => (
    <div>
        <p className="text-xs text-muted-foreground mb-2">{title}</p>
        <div className="space-y-1">
            {results.map((result, index) => (
                <SourceLink
                    key={index}
                    url={result.url}
                    title={result.title}
                    index={index}
                    prefix={prefix}
                />
            ))}
        </div>
    </div>
);

// AI Answer component for displaying answers
const AIAnswer = ({ answer }: { answer: string }) => (
    <div className="mb-3 p-2 bg-muted/50 rounded-md">
        <p className="text-sm font-medium">AI Answer:</p>
        <p className="text-sm">{answer}</p>
    </div>
);

const ToolInvocationRenderer = ({
    toolInvocation,
}: ToolInvocationProps) => {
    const { toolName, state, args } = toolInvocation;
    console.log(toolInvocation.args)

    // Handle each tool with its loading and result states in the same case
    switch (toolName) {
        case "renderDCFModel":
            if (state === "partial-call" || state === "call") {
                return <ToolLoadingState message="Creating DCF model..." />;
            } else if (state === "result") {
                return (
                    <ToolResultContainer successMessage="DCF model created successfully">
                        <p className="text-xs text-muted-foreground mb-2">
                            The DCF model will appear in the panel on the right.
                        </p>
                    </ToolResultContainer>
                );
            }
            break;

        case "getSpreadsheetTemplate":
            if (state === "partial-call" || state === "call") {
                return <ToolLoadingState message="Fetching spreadsheet template..." />;
            } else if (state === "result") {
                return (
                    <ToolResultContainer
                        successMessage="Template fetched successfully"
                    />
                );
            }
            break;

        case "renderSpreadsheet":
            if (state === "partial-call" || state === "call") {
                return <ToolLoadingState message="Creating spreadsheet model..." />;
            } else if (state === "result") {
                return (
                    <ToolResultContainer
                        successMessage="Spreadsheet created successfully"
                        description="The spreadsheet model is now available in the panel on the right."
                    />
                );
            }
            break;

        case "search":
            if (state === "partial-call" || state === "call") {
                const query = args?.query || "";
                return <ToolLoadingState message={`Searching the web for: "${query}"...`} />;
            } else if (state === "result") {
                const result = toolInvocation.result as any;
                return (
                    <ToolResultContainer successMessage="Web search completed">
                        {result.results?.length > 0 && (
                            <SearchResults results={result.results} />
                        )}

                        {result.images?.length > 0 && (
                            <div className="mt-3">
                                <p className="text-xs text-muted-foreground mb-2">Images:</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {result.images.map((image: any, index: number) => (
                                        <div key={`image-${index}`} className="text-xs">
                                            <a
                                                href={image.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="hover:opacity-90"
                                            >
                                                <img
                                                    src={image.url}
                                                    alt={image.description || 'Search result image'}
                                                    className="w-full h-auto rounded-md"
                                                />
                                            </a>
                                            {image.description && (
                                                <p className="mt-1 text-muted-foreground">{image.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </ToolResultContainer>
                );
            }
            break;

        case "searchContext":
            if (state === "partial-call" || state === "call") {
                const query = args?.query || "";
                return <ToolLoadingState message={`Retrieving context for: "${query}"...`} />;
            } else if (state === "result") {
                const query = args?.query || "";
                return (
                    <ToolResultContainer
                        successMessage="Context retrieved successfully"
                        description={`Found relevant information from web sources for: "${query}"`}
                    />
                );
            }
            break;

        case "searchQNA":
            if (state === "partial-call" || state === "call") {
                const query = args?.query || "";
                return <ToolLoadingState message={`Finding an answer to: "${query}"...`} />;
            } else if (state === "result") {
                const result = toolInvocation.result as any;
                const query = args?.query || "";

                if (typeof result === 'string') {
                    return (
                        <ToolResultContainer successMessage={`Answer found for: "${query}"`}>
                            <p className="text-sm">{result}</p>
                        </ToolResultContainer>
                    );
                }

                return (
                    <ToolResultContainer successMessage={`Answer found for: "${query}"`}>
                        {result.answer && (
                            <div className="mb-2 p-2 bg-muted/50 rounded-md">
                                <p className="text-sm">{result.answer}</p>
                            </div>
                        )}

                        {result.results?.length > 0 && (
                            <ToolSourcesList
                                results={result.results}
                                prefix="qna-"
                            />
                        )}
                    </ToolResultContainer>
                );
            }
            break;

        case "extract":
            if (state === "partial-call" || state === "call") {
                const urls = args?.urls || [];
                const urlCount = urls.length;

                return (
                    <div>
                        <ToolLoadingState
                            message={urlCount === 1
                                ? `Extracting content from 1 URL...`
                                : `Extracting content from ${urlCount} URLs...`}
                        />
                        {urls.length > 0 && (
                            <div className="mt-2 ml-4 text-xs text-muted-foreground">
                                {urls.length <= 3 ? (
                                    // Show all URLs if there are 3 or fewer
                                    <div className="space-y-1">
                                        {urls.map((url: string, index: number) => (
                                            <div key={`extracting-${index}`} className="truncate">
                                                • {url}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    // Show first 2 URLs and a count for the rest if there are more than 3
                                    <div className="space-y-1">
                                        {urls.slice(0, 2).map((url: string, index: number) => (
                                            <div key={`extracting-${index}`} className="truncate">
                                                • {url}
                                            </div>
                                        ))}
                                        <div>• and {urls.length - 2} more URLs...</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            } else if (state === "result") {
                const result = toolInvocation.result as any;
                const urls = args?.urls || [];
                const urlCount = urls.length;
                const extractMessage = urlCount === 1
                    ? `Content extracted from 1 URL successfully`
                    : `Content extracted from ${urlCount} URLs successfully`;

                return (
                    <ToolResultContainer
                        successMessage={extractMessage}
                        error={result.error}
                    >
                        {result.results?.length > 0 ? (
                            <ToolSourcesList
                                results={result.results.map((r: any) => ({ url: r.url })) || []}
                                title="Extracted from:"
                                prefix="extract-"
                            />
                        ) : (
                            // If no results but we have URLs in args, show the original URLs
                            urls.length > 0 && (
                                <div className="mt-2 text-xs text-muted-foreground">
                                    <p className="font-medium mb-1">Attempted to extract from:</p>
                                    <div className="space-y-1 ml-2">
                                        {urls.map((url: string, index: number) => (
                                            <div key={`extract-attempt-${index}`} className="truncate">
                                                • {url}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        )}
                    </ToolResultContainer>
                );
            }
            break;

        default:
            if (state === "partial-call" || state === "call") {
                return <ToolLoadingState message={`Processing ${toolName}...`} />;
            }
            break;
    }

    return null;
};

// AssistantMessage component
type AssistantMessageProps = {
    message: UIMessage;
};

const AssistantMessage = ({
    message,
}: AssistantMessageProps) => {
    // Extract all sources (if any) from message parts
    const sources = message.parts?.filter(part => part.type === 'source')
        .map(part => part.source!) || [];

    return (
        <div className="prose prose-sm dark:prose-invert max-w-none">
            {message.parts.map((part, index) => {
                switch (part.type) {
                    case 'text':
                        return (
                            <ReactMarkdown
                                key={index}
                                components={{
                                    // Configure links to open in new tabs
                                    a: ({ node, ...props }) => (
                                        <a
                                            {...props}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline"
                                        />
                                    )
                                }}
                            >
                                {part.text}
                            </ReactMarkdown>
                        );
                    case 'tool-invocation':
                        return (
                            <div key={index}>
                                <ToolInvocationRenderer
                                    toolInvocation={part.toolInvocation}
                                />
                            </div>
                        );
                    case 'source':
                        // Skip individual source rendering, we'll show them all at the end
                        return null;
                    default:
                        return null;
                }
            })}

            {/* Display all sources at the end */}
            {sources.length > 0 && <SourcesList sources={sources} />}
        </div>
    );
};

// MessageBubble Component
type MessageBubbleProps = {
    message: UIMessage;
};

const MessageBubble = ({ message }: MessageBubbleProps) => {
    if (message.role === 'data' || message.role === 'system') {
        return null;
    }

    return (
        <div
            className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start"
            )}
        >
            <div
                className={cn(
                    "max-w-[80%] px-4 py-3 rounded-2xl",
                    message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-muted rounded-tl-none"
                )}
            >
                {message.role === "user" ? (
                    <UserMessage content={message.content} />
                ) : (
                    <AssistantMessage
                        message={message}
                    />
                )}
            </div>
        </div>
    );
};

// Main component
export function OpenAIChat() {
    const [spreadsheetCells, setSpreadsheetCells] = useState<Cell[][] | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { messages, input, handleInputChange, handleSubmit, status, error } = useChat({
        api: "/api/analyst/openai",
        maxSteps: 5,
        async onToolCall({ toolCall }) {
            switch (toolCall.toolName) {
                case 'renderSpreadsheet':
                    try {
                        // Type assert args first or create a type guard
                        const args = toolCall.args as { cells: RenderSpreadsheetCell[][] };
                        // Then validate the model parameters with your schema

                        setSpreadsheetCells(args.cells.map(row => row.map(cell => ({
                            format: cell.format,
                            value: cell.value,
                            className: cell.className
                        }))));

                        return "Spreadsheet model created successfully";
                    } catch (e) {
                        console.error("Error creating spreadsheet:", e);
                        return "Failed to create spreadsheet: " + (e instanceof Error ? e.message : String(e));
                    }
                case 'renderDCFModel':
                    try {
                        const args = toolCall.args as { dcfParameters: any, historicalData?: Record<string, Record<string, number>> };

                        // Use provided historicalData or use mock data
                        const currentYear = 2024;
                        let historicalData: HistoricalData = {};

                        if (args.historicalData) {
                            // Map API-provided historical data to LineItem enum
                            historicalData = Object.entries(args.historicalData).reduce((acc, [year, yearData]) => {
                                const yearNumber = parseInt(year);
                                // Convert string keys to LineItem enum values
                                acc[yearNumber] = {
                                    [LineItem.Revenue]: yearData.Revenue || yearData.revenue || 0,
                                    [LineItem.COGS]: yearData.COGS || yearData.cogs || 0,
                                    [LineItem.SGNA]: yearData.SGNA || yearData.sgna || yearData.SGA || yearData.sga || 0,
                                    [LineItem.DNA]: yearData.DNA || yearData.dna || yearData.DA || yearData.da || 0,
                                    [LineItem.CAPEX]: yearData.CAPEX || yearData.capex || yearData.CapEx || 0,
                                    [LineItem.Taxes]: yearData.Taxes || yearData.taxes || 0,
                                    [LineItem.CONWC]: yearData.CONWC || yearData.conwc || yearData.NWC || yearData.nwc || 0
                                };
                                return acc;
                            }, {} as HistoricalData);
                        } else {
                            // Use McDonald's historical data from mock dataset instead of generating random data
                            console.warn("No historical data provided for DCF model, using McDonald's (MCD) historical data");

                            const mcdData = financialDataMap.get("MCD");
                            if (mcdData) {
                                // Convert Map to HistoricalData format
                                mcdData.forEach((yearData, year) => {
                                    historicalData[year] = {
                                        [LineItem.Revenue]: yearData[LineItem.Revenue],
                                        [LineItem.COGS]: yearData[LineItem.COGS],
                                        [LineItem.SGNA]: yearData[LineItem.SGNA],
                                        [LineItem.DNA]: yearData[LineItem.DNA],
                                        [LineItem.CAPEX]: yearData[LineItem.CAPEX],
                                        [LineItem.Taxes]: yearData[LineItem.Taxes],
                                        [LineItem.CONWC]: yearData[LineItem.CONWC],
                                    };
                                });
                            } else {
                                // Fall back to generated data if McDonald's data is not available (shouldn't happen)
                                for (let year = currentYear - 5; year <= currentYear; year++) {
                                    historicalData[year] = {
                                        [LineItem.Revenue]: 100 * (1 + (year - (currentYear - 5)) * 0.1),
                                        [LineItem.COGS]: 60 * (1 + (year - (currentYear - 5)) * 0.1),
                                        [LineItem.SGNA]: 20 * (1 + (year - (currentYear - 5)) * 0.1),
                                        [LineItem.DNA]: 5 * (1 + (year - (currentYear - 5)) * 0.1),
                                        [LineItem.CAPEX]: 10 * (1 + (year - (currentYear - 5)) * 0.1),
                                        [LineItem.Taxes]: 5 * (1 + (year - (currentYear - 5)) * 0.1),
                                        [LineItem.CONWC]: 2 * (1 + (year - (currentYear - 5)) * 0.1)
                                    };
                                }
                            }

                            // Notify user that we're using McDonald's data
                            toast.warning("Using McDonald's (MCD) historical data for the DCF model. Specify a ticker or provide custom historical data for more accurate results.");
                        }

                        const cells = createDCFCells(
                            10, // futureYears
                            currentYear,
                            historicalData,
                            args.dcfParameters
                        );
                        setSpreadsheetCells(cells);
                        return "DCF model created successfully";
                    } catch (e) {
                        console.error("Error creating DCF model:", e);
                        return "Failed to create DCF model: " + (e instanceof Error ? e.message : String(e));
                    }
            }
        }
    });

    useEffect(() => {
        if (error) {
            console.error(error);
            toast.error(error.message);
        }
    }, [error]);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    // Render different layouts based on whether a spreadsheet model exists
    return (
        <AnimatePresence mode="wait">
            {!spreadsheetCells ? (
                <motion.div
                    key="chat-only"
                    className="h-dvh flex flex-col max-w-3xl mx-auto p-4"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="flex-1 overflow-y-auto py-4">
                        {messages.length === 0 ? (
                            <EmptyState />
                        ) : (
                            <div className="space-y-6 py-4">
                                {messages.map((message) => (
                                    <MessageBubble
                                        key={message.id}
                                        message={message}
                                    />
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    <ChatInput
                        input={input}
                        handleInputChange={handleInputChange}
                        handleSubmit={handleSubmit}
                        status={status}
                    />
                </motion.div>
            ) : (
                <motion.div
                    key="chat-with-spreadsheet"
                    className="h-dvh"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                        duration: 0.4,
                        ease: "easeOut"
                    }}
                >
                    <ResizablePanelGroup direction="horizontal">
                        <ResizablePanel defaultSize={30}>
                            <div className="h-dvh flex-1 flex flex-col">
                                <div className="flex-1 overflow-y-auto p-2 rounded-lg">
                                    {messages.length === 0 ? (
                                        <EmptyState />
                                    ) : (
                                        <div className="space-y-6 py-4">
                                            {messages.map((message) => (
                                                <MessageBubble
                                                    key={message.id}
                                                    message={message}
                                                />
                                            ))}
                                            <div ref={messagesEndRef} />
                                        </div>
                                    )}
                                </div>

                                <div className="px-2 pb-2">
                                    <ChatInput
                                        input={input}
                                        handleInputChange={handleInputChange}
                                        handleSubmit={handleSubmit}
                                        status={status}
                                    />
                                </div>
                            </div>
                        </ResizablePanel>
                        <ResizableHandle />
                        <ResizablePanel defaultSize={70}>
                            <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                    duration: 0.5,
                                    delay: 0.2,
                                    ease: "easeOut"
                                }}
                                className="h-dvh flex flex-col"
                            >
                                <SpreadSheet
                                    cells={spreadsheetCells}
                                    setCells={setSpreadsheetCells}
                                />
                            </motion.div>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </motion.div>
            )}
        </AnimatePresence>
    );
} 