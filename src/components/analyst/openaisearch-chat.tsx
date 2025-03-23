"use client";

import React, { useRef, useEffect } from 'react';
import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Send, ExternalLink, Upload, Trash2, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { UIMessage } from 'ai';
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { tavilyTools } from '@/lib/tools/tavily'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Removed DCF and resizable panel imports as we focus on analysis only

// Type definitions
type Source = {
  id: string;
  url: string;
  title?: string;
};

type UploadedFile = {
  id: string;
  filename: string;
  url: string;
};

// SourcesList component
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
            <span className="truncate">
              {source.title || new URL(source.url).hostname}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
};

// UserMessage component
const UserMessage = ({ content }: { content: string }) => (
  <p className="whitespace-pre-wrap text-sm">{content}</p>
);

// EmptyState component
const EmptyState = () => (
  <div className="h-full flex items-center justify-center">
    <div className="text-center max-w-md space-y-4">
      <h3 className="text-xl font-semibold">
        Welcome to the OpenAI Investment Analyst with search
      </h3>
      <p className="text-muted-foreground">
        Get insights on stocks, market trends, and investment strategies.
        Ask me anything about financial markets.
      </p>
    </div>
  </div>
);

// ChatInput component
const ChatInput = ({
  input,
  handleInputChange,
  handleSubmit,
  status,
}: {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  status: string;
}) => (
  <div className="w-full">
    <form onSubmit={handleSubmit} className="flex gap-2 relative">
      <Input
        value={input}
        onChange={handleInputChange}
        placeholder="Ask a question about investments..."
        className="flex-1 pr-10 py-6 h-12"
        disabled={status === 'submitted' || status === 'streaming'}
      />
      <Button
        type="submit"
        size="icon"
        disabled={(status === 'submitted' || status === 'streaming') || !input.trim()}
        className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-green-700 hover:bg-green-800 text-white"
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

// AssistantMessage component
type AssistantMessageProps = {
  message: UIMessage;
};

const AssistantMessage = ({ message }: AssistantMessageProps) => {
  // Extract all sources (if any) from message parts
  const sources =
    message.parts?.filter((part) => part.type === 'source').map((part) => part.source!) || [];

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      {message.parts.map((part, index) => {
        switch (part.type) {
          case 'text':
            return <ReactMarkdown key={index}>{part.text}</ReactMarkdown>;
          case 'tool-invocation':
            // For removed DCF functionality, display a placeholder or ignore the invocation.
            return <div key={index}>[Tool Invocation]</div>;
          case 'source':
            // Sources will be rendered at the end.
            return null;
          default:
            return null;
        }
      })}
      {sources.length > 0 && <SourcesList sources={sources} />}
    </div>
  );
};

// MessageBubble component
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
          <AssistantMessage message={message} />
        )}
      </div>
    </div>
  );
};

// FileUploadButton component
const FileUploadButton = ({ onUpload }: { onUpload: (file: UploadedFile) => void }) => {
  const [isUploading, setIsUploading] = React.useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/analyst/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      onUpload(data);
      toast.success("File uploaded successfully", {
        description: file.name,
      });
    } catch (error) {
      toast.error("Upload failed", {
        description: "Please try again",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative">
      <input
        type="file"
        onChange={handleUpload}
        className="hidden"
        id="file-upload"
        accept=".pdf,.doc,.docx,.txt,.csv"
        disabled={isUploading}
      />
      <label
        htmlFor="file-upload"
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-md border border-green-500 hover:bg-green-500/10 cursor-pointer",
          isUploading && "opacity-50 cursor-not-allowed"
        )}
      >
        {isUploading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
      </label>
    </div>
  );
};

// FileManager component
const FileManager = ({ 
  files, 
  onDelete 
}: { 
  files: UploadedFile[], 
  onDelete: (id: string) => void 
}) => {
  if (files.length === 0) return null;
  
  return (
    <div className="mt-4 p-4 bg-muted rounded-lg">
      <h4 className="text-sm font-semibold mb-2">Uploaded Files:</h4>
      <ul className="space-y-2">
        {files.map((file) => (
          <li key={file.id} className="text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ExternalLink size={14} />
              <span className="truncate">{file.filename}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(file.id)}
              className="h-6 w-6 p-0"
            >
              <Trash2 size={14} className="text-muted-foreground hover:text-destructive" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
};

// FilesDialog component
const FilesDialog = ({ 
  files, 
  onDelete 
}: { 
  files: UploadedFile[], 
  onDelete: (id: string) => void 
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 border-green-500 hover:bg-green-500/10"
          aria-label="View uploaded files"
        >
          <FileText className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Uploaded Files</DialogTitle>
        </DialogHeader>
        {files.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            No files uploaded yet
          </div>
        ) : (
          <div className="mt-4">
            <ul className="space-y-3">
              {files.map((file) => (
                <li key={file.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-muted-foreground" />
                    <a 
                      href={file.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm hover:underline"
                    >
                      {file.filename}
                    </a>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(file.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 size={16} className="text-muted-foreground hover:text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Main component
export function OpenAIChat() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [uploadedFiles, setUploadedFiles] = React.useState<UploadedFile[]>([]);

  const { messages, input, handleInputChange, handleSubmit, status, error } = useChat({
    api: "/api/analyst/openaisearch",
    maxSteps: 5,
  });

  const handleFileUpload = (file: UploadedFile) => {
    setUploadedFiles(prev => [...prev, file]);
  };

  const handleDeleteFile = async (id: string) => {
    try {
      const response = await fetch(`/api/analyst/files/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete file');
      }
      
      setUploadedFiles(prev => prev.filter(file => file.id !== id));
      toast.success("File deleted successfully");
    } catch (error) {
      toast.error("Failed to delete file");
    }
  };

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

  // Render the chat-only layout focusing on analysis
  return (
    <motion.div
      className="h-dvh flex flex-col max-w-3xl mx-auto p-4"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex-1 overflow-y-auto py-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <EmptyState />
            <FileManager files={uploadedFiles} onDelete={handleDeleteFile} />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <FilesDialog files={uploadedFiles} onDelete={handleDeleteFile} />
        <div className="flex-1 flex items-center gap-2">
          <FileUploadButton onUpload={handleFileUpload} />
          <ChatInput
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            status={status}
          />
        </div>
      </div>
    </motion.div>
  );
}