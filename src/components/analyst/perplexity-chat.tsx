"use client";

import { useChat } from "ai/react";
import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Send } from "lucide-react";
import ReactMarkdown from "react-markdown";

export function PerplexityChat() {
    const { messages, input, handleInputChange, handleSubmit, isLoading, data, metadata, } = useChat({
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
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center max-w-md space-y-4">
                            <h3 className="text-xl font-semibold">Welcome to Investment Analyst</h3>
                            <p className="text-muted-foreground">
                                Get insights on stocks, market trends, and investment strategies.
                                Ask me anything about financial markets.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 py-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
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
                                        <p className="whitespace-pre-wrap text-sm">
                                            {message.content}
                                        </p>
                                    ) : (
                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                            <ReactMarkdown>
                                                {message.content}
                                            </ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            <div className="border-t pt-4 pb-2">
                <form onSubmit={handleSubmit} className="flex gap-2 relative">
                    <Input
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Ask a question about investments..."
                        className="flex-1 pr-10 py-6"
                        disabled={isLoading}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={isLoading || !input.trim()}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2"
                    >
                        {isLoading ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
} 