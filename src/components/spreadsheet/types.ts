export enum CellFormat {
    Number = "number",
    Percentage = "percentage",
    String = "string",
}

// Excel-compatible error types (including both parser and additional errors)
export type CellError = '#ERROR!' | '#DIV/0!' | '#NAME?' | '#N/A' | '#NUM!' | '#VALUE!' | '#REF!' | '#NULL!'

export type Cell = {
    format: CellFormat
    value: number | string;
    className?: string;
    evaluatedValue?: number | null;
    error?: CellError | null;
}

import { z } from "zod";

export const dcfParametersSchema = z.object({
    revenueGrowth: z.number().describe("Estimated revenue growth rate for the future of the company."),
    cogsMargin: z.number().describe("Estimated cost of goods sold margin for the future of the company. Calculated by cost of goods sold over revenue."),
    sgaMargin: z.number().describe("Estimated SG&A margin for the future of the company. Calculated by SG&A expense sold over revenue."),
    daCapex: z.number().describe("Estimated percentage of depreciation and amortization out of capital expenditures."),
    taxRate: z.number().describe("Estimated effective tax rate for the future of the company."),
    salesIntensity: z.number().describe("Estimated percentage of capital expenditures out of revenue."),
    // perpetuityGrowthRate: z.number().describe("The rate at which revenue is expected to grow at every year if we assume that the company continues to operate forever"),
    // wacc: z.number().describe("Weighted Average Cost of Capital"),
});

export type DCFParameters = z.infer<typeof dcfParametersSchema>;