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

// Financial statement line items
export enum LineItem {
    Revenue = "revenue",
    COGS = "cogs",
    SGNA = "SG&A",
    DNA = "D&A",
    CAPEX = "CAPEX",
    Taxes = "Taxes",
    CONWC = "CONWC",
}

// Historical data types
export type HistoricalData = {
    [year: number]: {
        [key in LineItem]: number;
    };
};

// Zod schema for historical data validation
export const historicalDataSchema = z.record(
    // Year keys can be strings or numbers, but will be converted to numbers
    z.string().or(z.number()).transform(v => typeof v === 'string' ? parseInt(v, 10) : v),
    // Each year should have all the fields defined in LineItem enum
    z.record(
        z.string(),
        z.number()
    ).superRefine((data, ctx) => {
        // Get all LineItem enum values to validate against
        const requiredKeys = Object.values(LineItem);

        // Check if all LineItem keys are present (using case-insensitive matching)
        for (const requiredKey of requiredKeys) {
            const keyExists = Object.keys(data).some(
                key => key.toLowerCase() === requiredKey.toLowerCase()
            );

            if (!keyExists) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Missing required field: ${requiredKey}`
                });
            }
        }
    })
).describe(`Historical financial data organized by year. 
Format: { "2020": { "revenue": 1000, "cogs": 600, ... }, "2021": { ... } }

Required fields for each year (exactly as named in LineItem enum):
1. ${LineItem.Revenue} - Total company revenue 
2. ${LineItem.COGS} - Cost of Goods Sold
3. ${LineItem.SGNA} - Selling, General & Administrative expenses
4. ${LineItem.DNA} - Depreciation & Amortization
5. ${LineItem.CAPEX} - Capital Expenditures
6. ${LineItem.Taxes} - Income taxes
7. ${LineItem.CONWC} - Change in Net Working Capital

All values should be in millions of dollars (or the company's primary currency).
Provide at least 3-5 years of historical data for best results.`);

export const dcfParametersSchema = z.object({
    revenueGrowth: z.number().describe("Estimated revenue growth rate as a decimal based on the average of historical growth rates barring any anomalies."),
    cogsMargin: z.number().describe("Estimated cost of goods sold margin as a decimal. Calculated by cost of goods sold over revenue. Derived from a linear regression on historical data."),
    sgaMargin: z.number().describe("Estimated SG&A margin as a decimal. Calculated by SG&A expense over revenue. Derived from a linear growth rate with respect to revenue and historical data."),
    daCapex: z.number().describe("Estimated depreciation and amortization proportion of capital expenditures as a decimal. Taken as a percentage of capital expenditures and grows in line with revenue barring historical trends."),
    taxRate: z.number().describe("Estimated effective tax rate as a decimal. Taken as the weighted average of revenue segmentation by geographies"),
    salesIntensity: z.number().describe("Estimated capital expenditures as a proportion of revenue, expressed as a decimal. Derived from a linear growth rate based on historical capital expenditure and revenue trends."),
    // perpetuityGrowthRate: z.number().describe("The rate at which revenue is expected to grow at every year if we assume that the company continues to operate forever"),
    // wacc: z.number().describe("Weighted Average Cost of Capital"),
});

export type DCFParameters = z.infer<typeof dcfParametersSchema>;

export const renderSpreadsheetCell = z.object({
    format: z.nativeEnum(CellFormat),
    value: z.union([z.string(), z.number()]),
    className: z.string().optional().describe("tailwind classes to style the cell"),
});

export type RenderSpreadsheetCell = z.infer<typeof renderSpreadsheetCell>;
