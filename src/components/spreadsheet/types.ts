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
    revenueGrowth: z.number().describe("Estimated revenue growth rate as a decimal."),
    cogsMargin: z.number().describe("Estimated cost of goods sold margin as a decimal. Calculated by cost of goods sold over revenue."),
    sgaMargin: z.number().describe("Estimated SG&A margin as a decimal. Calculated by SG&A expense over revenue."),
    daCapex: z.number().describe("Estimated depreciation and amortization proportion of capital expenditures as a decimal."),
    taxRate: z.number().describe("Estimated effective tax rate as a decimal."),
    salesIntensity: z.number().describe("Estimated capital expenditures as a proportion of revenue, expressed as a decimal."),
    // perpetuityGrowthRate: z.number().describe("The rate at which revenue is expected to grow at every year if we assume that the company continues to operate forever"),
    // wacc: z.number().describe("Weighted Average Cost of Capital"),
});

export type DCFParameters = z.infer<typeof dcfParametersSchema>;