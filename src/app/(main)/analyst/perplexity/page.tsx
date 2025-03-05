import { PerplexityChat } from "@/components/analyst/perplexity-chat";

export default function PerplexityAnalystPage() {
    return (
        <div className="container mx-auto py-8">
            <h1 className="text-2xl font-bold mb-6">Investment Analyst</h1>
            <PerplexityChat />
        </div>
    );
} 