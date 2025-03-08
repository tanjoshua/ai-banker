"use client";

import React from 'react';
import { useChat } from "@ai-sdk/react";
import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Send, ExternalLink } from "lucide-react";
import ReactMarkdown, { Components } from "react-markdown";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { UIMessage } from 'ai';

// Type definitions
type Source = {
    id: string;
    url: string;
    title?: string;
};


// Citation component for displaying individual citation markers
const Citation = ({ sourceIndex, source }: { sourceIndex: number; source: Source }) => {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <sup className="inline-block align-baseline mx-1">
                        <a
                            href={`#source-${source.id}`}
                            className="inline-flex items-center justify-center rounded-sm bg-primary/10 text-primary text-[0.7rem] h-4 w-4 font-medium no-underline hover:bg-primary/20 transition-colors"
                            onClick={(e) => {
                                e.preventDefault();
                                highlightAndScrollToSource(source.id);
                            }}
                        >
                            {sourceIndex + 1}
                        </a>
                    </sup>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-sm">
                    <p className="text-xs">{source.title || new URL(source.url).hostname}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

// Sources list component for displaying references
const SourcesList = ({ sources }: { sources: Source[] }) => {
    if (!sources || sources.length === 0) return null;

    return (
        <div className="mt-4 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2 font-semibold">References:</p>
            <div className="flex flex-col gap-1.5">
                {sources.map((source, idx) => (
                    <a
                        id={`source-${source.id}`}
                        key={`source-${source.id}`}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs py-0.5 px-1 rounded transition-colors duration-200 hover:bg-muted/50"
                    >
                        <span className="font-medium text-muted-foreground align-top">[{idx + 1}]</span>
                        <span className="flex-1">{source.title || new URL(source.url).hostname}</span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    </a>
                ))}
            </div>
        </div>
    );
};

// User message component
const UserMessage = ({ content }: { content: string }) => (
    <p className="whitespace-pre-wrap text-sm">{content}</p>
);

// Assistant message component that handles text and parts-based messages
const AssistantMessage = ({ message }: { message: UIMessage }) => {
    // Extract all sources (if any) from message parts
    const sources = message.parts?.filter(part => part.type === 'source')
        .map(part => part.source!) || [];

    return (
        <div className="prose prose-sm dark:prose-invert max-w-none">
            {/* Render message content differently based on whether it uses parts */}
            {message.parts ? (
                <>
                    {/* Process text parts */}
                    {message.parts.filter(part => part.type === 'text').map((part, index) => (
                        <div key={`text-${index}`}>
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={createMarkdownComponents(sources)}
                                rehypePlugins={[rehypeRaw]}
                            >
                                {processCitations(part.text!, sources)}
                            </ReactMarkdown>
                        </div>
                    ))}

                    {/* Display sources list if available */}
                    {sources.length > 0 && <SourcesList sources={sources} />}
                </>
            ) : (
                // Fall back to regular markdown rendering for simple content
                <ReactMarkdown>{message.content}</ReactMarkdown>
            )}
        </div>
    );
};

// Utility function to highlight and scroll to a source
const highlightAndScrollToSource = (sourceId: string) => {
    const element = document.getElementById(`source-${sourceId}`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        element.classList.add('bg-primary/10');
        setTimeout(() => element.classList.remove('bg-primary/10'), 2000);
    }
};

// Utility function to process citations in text
const processCitations = (text: string, sources: Source[]) => {
    if (!sources || sources.length === 0) return text;

    return text.replace(/\[(\d+)\]/g, (match, num) => {
        const index = parseInt(num, 10) - 1;
        if (index >= 0 && index < sources.length) {
            const source = sources[index];
            return `<sup class="citation" data-source-id="${source.id}" data-source-index="${index}">${num}</sup>`;
        }
        return match;
    });
};

// Create custom markdown components for rendering citations
const createMarkdownComponents = (sources: Source[]): Components => {
    return {
        p: (props: React.HTMLProps<HTMLParagraphElement>) => {
            const { children, ...rest } = props;
            return <p {...rest}>{children}</p>;
        },
        span: (props: React.HTMLProps<HTMLSpanElement>) => {
            const { children } = props;
            const text = String(children || '');

            if (!text || !text.match(/\[\d+\]/)) {
                return <span>{children}</span>;
            }

            const parts = text.split(/(\[\d+\])/g);

            return (
                <>
                    {parts.map((part, i) => {
                        const match = part.match(/\[(\d+)\]/);
                        if (match) {
                            const sourceIndex = parseInt(match[1], 10) - 1;
                            if (sourceIndex >= 0 && sourceIndex < sources.length) {
                                return (
                                    <Citation
                                        key={i}
                                        sourceIndex={sourceIndex}
                                        source={sources[sourceIndex]}
                                    />
                                );
                            }
                        }
                        return <React.Fragment key={i}>{part}</React.Fragment>;
                    })}
                </>
            );
        },
        sup: (props: React.HTMLProps<HTMLElement>) => {
            const dataProps = props as React.HTMLAttributes<HTMLElement> & {
                'data-source-id'?: string;
                'data-source-index'?: string;
                className?: string;
            };

            if (dataProps.className === 'citation' && dataProps['data-source-id'] && dataProps['data-source-index']) {
                const sourceId = dataProps['data-source-id'];
                const sourceIndex = parseInt(dataProps['data-source-index'], 10);
                const source = sources[sourceIndex];

                return (
                    <Citation sourceIndex={sourceIndex} source={source} />
                );
            }
            return <sup {...props} />;
        }
    };
};

// Main component
export function PerplexityChat() {
    const { messages, input, handleInputChange, handleSubmit, status, } = useChat({
        api: "/api/analyst/chat",
    });

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    return (
        <div className="flex flex-col h-[calc(100vh-180px)] max-w-3xl mx-auto">
            <div className="flex-1 overflow-y-auto mb-4 px-4 py-2 rounded-lg">
                {messages.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="space-y-6 py-4">
                        {messages.map((message) => (
                            <MessageBubble key={message.id} message={message} />
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
        </div>
    );
}

// Helper components
const EmptyState = () => (
    <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md space-y-4">
            <h3 className="text-xl font-semibold">Welcome to Investment Analyst</h3>
            <p className="text-muted-foreground">
                Get insights on stocks, market trends, and investment strategies.
                Ask me anything about financial markets.
            </p>
        </div>
    </div>
);

const MessageBubble = ({ message }: { message: UIMessage }) => {
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
                    <AssistantMessage message={message} />
                )}
            </div>
        </div>
    );
};

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
    <div className="border-t pt-4 pb-2">
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