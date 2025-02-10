import { z } from 'zod';
import { streamObject } from 'ai';
import { defaultChatModel } from '@/lib/ai/models';

export const parameterSchema = z.object({
    parameters: z.array(
        z.object({
            name: z.string().describe('Name of the parameter.'),
            value: z.number().describe('Chosen value of the parameter.'),
            reasoning: z.string().describe('Explanation of why this value was chosen.'),
        }),
    ),
});

export interface GenParamsPayload {
    stock: string;
}

export async function POST(req: Request) {
    const payload: GenParamsPayload = await req.json();

    const result = streamObject({
        model: defaultChatModel,
        schema: parameterSchema,
        prompt:
            `Generate financial parameters for a discounted cash flow model of the stock: ` + payload.stock,
    });

    return result.toTextStreamResponse();
}