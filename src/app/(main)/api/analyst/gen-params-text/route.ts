import { defaultChatModel } from "@/lib/ai/models";
import { streamText } from "ai";


export async function POST(req: Request) {
    const { prompt }: { prompt: string } = await req.json();

    const result = await streamText({
        model: defaultChatModel,
        prompt:
            `Generate financial parameters for a discounted cash flow model of the stock: ` + prompt,
    });


    return result.toDataStreamResponse();

}