"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Send, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { UIMessage } from 'ai';
import { toast } from 'sonner';
import { DCFParameters, dcfParametersSchema } from '../spreadsheet/types';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../ui/resizable';
import { ScrollArea } from '../ui/scroll-area';
import { DCF } from '../spreadsheet/dcf';
import { motion, AnimatePresence } from "motion/react";

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
    toolInvocation: any;
    setSpreadsheetModel: (model: DCFParameters) => void;
    spreadsheetModel: DCFParameters | null;
};

const ToolInvocationRenderer = ({
    toolInvocation,
    setSpreadsheetModel,
    spreadsheetModel
}: ToolInvocationProps) => {
    const { toolName, state, args, error, result } = toolInvocation;

    // Check if this is the active model
    const isModelActive = spreadsheetModel !== null;

    switch (toolName) {
        case 'createSpreadsheetModel':
            switch (state) {
                case 'call':
                    // This will still be shown briefly before the result comes back
                    return (
                        <motion.div
                            className="my-2 p-3 rounded-md bg-muted"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            <p className="text-sm font-medium">
                                Creating spreadsheet model...
                            </p>
                        </motion.div>
                    );

                case 'result':
                    return (
                        <motion.div
                            className="border rounded p-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            <p className="text-sm text-green-700 font-medium">
                                ✓ Spreadsheet created successfully
                            </p>
                            <p className="text-xs text-muted-foreground">
                                The spreadsheet model is now available in the panel on the right.
                            </p>
                            <div className="mt-3 space-y-2">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>Revenue Growth:</div>
                                    <div className="text-right">{(args.modelParameters.revenueGrowth * 100).toFixed(1)}%</div>
                                    <div>COGS Margin:</div>
                                    <div className="text-right">{(args.modelParameters.cogsMargin * 100).toFixed(1)}%</div>
                                    <div>SG&A Margin:</div>
                                    <div className="text-right">{(args.modelParameters.sgaMargin * 100).toFixed(1)}%</div>
                                    <div>D&A as % of CAPEX:</div>
                                    <div className="text-right">{(args.modelParameters.daCapex * 100).toFixed(1)}%</div>
                                    <div>Tax Rate:</div>
                                    <div className="text-right">{(args.modelParameters.taxRate * 100).toFixed(1)}%</div>
                                    <div>CAPEX as % of Revenue:</div>
                                    <div className="text-right">{(args.modelParameters.salesIntensity * 100).toFixed(1)}%</div>
                                </div>
                            </div>
                        </motion.div>
                    );

                case 'error':
                    return (
                        <motion.div
                            className="text-sm my-2 p-3 bg-red-100 dark:bg-red-900/20 rounded-md"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            <p className="font-medium mb-1 text-red-600 dark:text-red-400">
                                Error creating spreadsheet
                            </p>
                            <p className="text-xs">{error || "Unknown error occurred"}</p>
                        </motion.div>
                    );

                default:
                    return null;
            }
        default:
            return null;
    }
};

// AssistantMessage component
type AssistantMessageProps = {
    message: UIMessage;
    setSpreadsheetModel: (model: DCFParameters) => void;
    spreadsheetModel: DCFParameters | null;
};

const AssistantMessage = ({
    message,
    setSpreadsheetModel,
    spreadsheetModel
}: AssistantMessageProps) => {
    // Extract all sources (if any) from message parts
    const sources = message.parts?.filter(part => part.type === 'source')
        .map(part => part.source!) || [];

    return (
        <div className="prose prose-sm dark:prose-invert max-w-none">
            {message.parts.map((part, index) => {
                switch (part.type) {
                    case 'text':
                        return <ReactMarkdown key={index}>{part.text}</ReactMarkdown>;
                    case 'tool-invocation':
                        return (
                            <div key={index}>
                                <ToolInvocationRenderer
                                    toolInvocation={part.toolInvocation}
                                    setSpreadsheetModel={setSpreadsheetModel}
                                    spreadsheetModel={spreadsheetModel}
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
    setSpreadsheetModel: (model: DCFParameters) => void;
    spreadsheetModel: DCFParameters | null;
};

const MessageBubble = ({ message, setSpreadsheetModel, spreadsheetModel }: MessageBubbleProps) => {
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
                        setSpreadsheetModel={setSpreadsheetModel}
                        spreadsheetModel={spreadsheetModel}
                    />
                )}
            </div>
        </div>
    );
};

// Main component
export function OpenAIChat() {
    const [spreadsheetModel, setSpreadsheetModel] = useState<DCFParameters | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { messages, input, handleInputChange, handleSubmit, status, error } = useChat({
        api: "/api/analyst/openai",
        maxSteps: 5,
        async onToolCall({ toolCall }) {
            if (toolCall.toolName === 'createSpreadsheetModel') {
                try {
                    // Type assert args first or create a type guard
                    const args = toolCall.args as { modelParameters: unknown };
                    // Then validate the model parameters with your schema
                    const modelParameters = dcfParametersSchema.parse(args.modelParameters);
                    setSpreadsheetModel(modelParameters);

                    return "Spreadsheet model created successfully";
                } catch (e) {
                    console.error("Error creating spreadsheet:", e);
                    return "Failed to create spreadsheet: " + (e instanceof Error ? e.message : String(e));
                }
            }
        },
    });

    useEffect(() => {
        if (error) {
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
            {!spreadsheetModel ? (
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
                                        setSpreadsheetModel={setSpreadsheetModel}
                                        spreadsheetModel={spreadsheetModel}
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
                                                    setSpreadsheetModel={setSpreadsheetModel}
                                                    spreadsheetModel={spreadsheetModel}
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
                                <DCF
                                    ticker={'MCD'}
                                    params={{
                                        revenueGrowth: spreadsheetModel.revenueGrowth,
                                        cogsMargin: spreadsheetModel.cogsMargin,
                                        sgaMargin: spreadsheetModel.sgaMargin,
                                        daCapex: spreadsheetModel.daCapex,
                                        taxRate: spreadsheetModel.taxRate,
                                        salesIntensity: spreadsheetModel.salesIntensity,
                                    }}
                                />
                            </motion.div>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </motion.div>
            )}
        </AnimatePresence>
    );
} 