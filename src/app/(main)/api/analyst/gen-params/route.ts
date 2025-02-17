import { z } from 'zod';
import { streamObject, } from 'ai';
import { defaultChatModel } from '@/lib/ai/models';

export const parameterSchema = z.object({
    parameters: z.object({
        revenueGrowth: z.object({
            name: z.literal('Revenue Growth'),
            value: z.number().describe('Estimated revenue growth rate for the future of the company.'),
            reasoning: z.string().describe('Explanation of why this value was chosen.'),
        }),
        cogsMargin: z.object({
            name: z.literal('COGS Margin'),
            value: z.number().describe('Estimated cost of goods sold margin for the future of the company. Calculated by cost of goods sold over revenue.'),
            reasoning: z.string().describe('Explanation of why this value was chosen.'),
        }),
        sgaMargin: z.object({
            name: z.literal('SG&A Margin'),
            value: z.number().describe('Estimated SG&A margin for the future of the company. Calculated by SG&A expense sold over revenue.'),
            reasoning: z.string().describe('Explanation of why this value was chosen.'),
        }),
        daCapex: z.object({
            name: z.literal('D&A as a % of CAPEX'),
            value: z.number().describe('Estimated percentage of depreciation and amortization out of capital expenditures.'),
            reasoning: z.string().describe('Explanation of why this value was chosen.'),
        }),
        taxRate: z.object({
            name: z.literal('Effective Tax Rate'),
            value: z.number().describe('Estimated effective tax rate for the future of the company.'),
            reasoning: z.string().describe('Explanation of why this value was chosen.'),
        }),
        salesIntensity: z.object({
            name: z.literal('Capex as a % of Revenue'),
            value: z.number().describe('Estimated percentage of capital expenditures out of revenue.'),
            reasoning: z.string().describe('Explanation of why this value was chosen.'),
        }),
    }),
});
export type Parameters = z.infer<typeof parameterSchema>['parameters'];


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