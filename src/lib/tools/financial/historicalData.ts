import { tool, type Tool } from 'ai';
import { z } from 'zod';
import { LineItem, historicalDataSchema } from '@/components/spreadsheet/types';

// Available financial data sources
export type FinancialDataSource = 'yahoo' | 'alphavantage' | 'mock';

// Available financial statement types
export enum FinancialStatementType {
    IncomeStatement = 'income',
    BalanceSheet = 'balance',
    CashFlow = 'cash',
}


// NEW ARRAY-BASED SCHEMA - easier for AI to understand
export const simpleHistoricalDataSchema = z.array(
    z.object({
        year: z.number().int().positive().describe("The fiscal year (e.g., 2020, 2021)"),
        [LineItem.Revenue]: z.number().describe("Total company revenue in millions"),
        [LineItem.COGS]: z.number().describe("Cost of Goods Sold in millions"),
        [LineItem.SGNA]: z.number().describe("Selling, General & Administrative expenses in millions"),
        [LineItem.DNA]: z.number().describe("Depreciation & Amortization in millions"),
        [LineItem.CAPEX]: z.number().describe("Capital Expenditures in millions"),
        [LineItem.Taxes]: z.number().describe("Income taxes in millions"),
        [LineItem.CONWC]: z.number().describe("Change in Net Working Capital in millions"),
    })
).describe(`Historical financial data as an array of yearly data objects.
Format: [
  { year: 2020, revenue: 1000, cogs: 600, ... },
  { year: 2021, revenue: 1100, cogs: 650, ... }
]

All values should be in millions of dollars (or the company's primary currency).`);

// Interface for the historical financial data response
interface FinancialDataResponse {
    ticker: string;
    companyName: string;
    data: {
        [year: string]: {
            [key: string]: number;
        };
    };
    currency: string;
    error?: string;
}

// Function to fetch mock financial data (for development/testing)
export async function fetchMockFinancialData(
    ticker: string,
    years: number = 5
): Promise<FinancialDataResponse> {
    // Create a simple mock dataset with years from current year - years to current year - 1
    const currentYear = new Date().getFullYear();
    const mockData: { [year: string]: { [key: string]: number } } = {};

    // Generate revenue growth between 5-15% year over year
    let baseRevenue = 1000; // Start with $1B revenue

    // Generate mock data for the requested years
    for (let i = 0; i < years; i++) {
        const year = currentYear - years + i;
        const growthRate = 1 + (Math.random() * 0.1 + 0.05); // 5-15% growth

        if (i > 0) {
            baseRevenue = baseRevenue * growthRate;
        }

        mockData[year.toString()] = {
            [LineItem.Revenue]: Math.round(baseRevenue),
            [LineItem.COGS]: Math.round(baseRevenue * (0.55 + Math.random() * 0.1)), // 55-65% of revenue
            [LineItem.SGNA]: Math.round(baseRevenue * (0.15 + Math.random() * 0.08)), // 15-23% of revenue
            [LineItem.DNA]: Math.round(baseRevenue * (0.05 + Math.random() * 0.03)), // 5-8% of revenue
            [LineItem.CAPEX]: Math.round(baseRevenue * (0.08 + Math.random() * 0.05)), // 8-13% of revenue
            [LineItem.Taxes]: Math.round(baseRevenue * 0.2 * (0.8 + Math.random() * 0.4)), // ~20% of profit with variance
            [LineItem.CONWC]: Math.round(baseRevenue * (0.01 + Math.random() * 0.03) * (Math.random() > 0.5 ? 1 : -1)), // 1-4% of revenue, can be positive or negative
        };
    }

    return {
        ticker,
        companyName: `${ticker.toUpperCase()} Corporation`,
        data: mockData,
        currency: 'USD',
    };
}

/**
 * Function to fetch data from Yahoo Finance API
 * Note: In a real implementation, you would need to use an API key and proper error handling
 */
export async function fetchYahooFinancialData(
    ticker: string,
    years: number = 5,
    statementType: FinancialStatementType = FinancialStatementType.IncomeStatement
): Promise<FinancialDataResponse> {
    try {
        // This is a placeholder for real API implementation
        // In a real scenario, you would:
        // 1. Make an HTTP request to the Yahoo Finance API
        // 2. Parse the response
        // 3. Transform it to match our expected format

        // For now, we'll just return mock data
        return await fetchMockFinancialData(ticker, years);
    } catch (error) {
        return {
            ticker,
            companyName: ticker,
            data: {},
            currency: 'USD',
            error: `Failed to fetch data from Yahoo Finance: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

/**
 * Function to fetch data from Alpha Vantage API
 * Note: In a real implementation, you would need to use an API key and proper error handling
 */
export async function fetchAlphaVantageFinancialData(
    ticker: string,
    years: number = 5,
    statementType: FinancialStatementType = FinancialStatementType.IncomeStatement
): Promise<FinancialDataResponse> {
    try {
        // This is a placeholder for real API implementation
        // In a real scenario, you would:
        // 1. Make an HTTP request to the Alpha Vantage API with your API key
        // 2. Parse the response
        // 3. Transform it to match our expected format

        // For now, we'll just return mock data
        return await fetchMockFinancialData(ticker, years);
    } catch (error) {
        return {
            ticker,
            companyName: ticker,
            data: {},
            currency: 'USD',
            error: `Failed to fetch data from Alpha Vantage: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

/**
 * Main function to fetch financial data from the specified source
 */
export async function fetchFinancialData(
    ticker: string,
    years: number = 5,
    source: FinancialDataSource = 'mock',
    statementType: FinancialStatementType = FinancialStatementType.IncomeStatement
): Promise<FinancialDataResponse> {
    switch (source) {
        case 'yahoo':
            return fetchYahooFinancialData(ticker, years, statementType);
        case 'alphavantage':
            return fetchAlphaVantageFinancialData(ticker, years, statementType);
        case 'mock':
        default:
            return fetchMockFinancialData(ticker, years);
    }
}

// Map response data to our LineItem format for compatibility with DCF models
export function mapToHistoricalData(response: FinancialDataResponse): {
    historicalData: Array<{
        year: number;
        revenue: number;
        cogs: number;
        "SG&A": number;
        "D&A": number;
        CAPEX: number;
        Taxes: number;
        CONWC: number;
    }>,
    metadata: { companyName: string, currency: string }
} {
    const { data, companyName, currency } = response;

    // Convert from record to array format
    const formattedData: Array<{
        year: number;
        revenue: number;
        cogs: number;
        "SG&A": number;
        "D&A": number;
        CAPEX: number;
        Taxes: number;
        CONWC: number;
    }> = [];

    Object.keys(data).forEach(year => {
        const yearData = data[year];
        const yearNumber = parseInt(year, 10);

        // Create a new entry for each year
        formattedData.push({
            year: yearNumber,
            revenue: yearData[LineItem.Revenue] || 0,
            cogs: yearData[LineItem.COGS] || 0,
            "SG&A": yearData[LineItem.SGNA] || 0,
            "D&A": yearData[LineItem.DNA] || 0,
            CAPEX: yearData[LineItem.CAPEX] || 0,
            Taxes: yearData[LineItem.Taxes] || 0,
            CONWC: yearData[LineItem.CONWC] || 0,
        });
    });

    return {
        historicalData: formattedData,
        metadata: {
            companyName,
            currency
        }
    };
}

// Create and export the tool for retrieving historical financial data
export const getHistoricalFinancialData = tool({
    description: 'Retrieve historical annual financial data for a given company ticker. Returns data formatted for financial analysis.',
    parameters: z.object({
        ticker: z.string().describe('The stock ticker symbol of the company (e.g., AAPL, MSFT, GOOGL)'),
        years: z.number().optional().default(5).describe('Number of years of historical data to retrieve (default: 5)'),
        statementType: z.nativeEnum(FinancialStatementType).optional().default(FinancialStatementType.IncomeStatement)
            .describe('Type of financial statement to retrieve (default: income)'),
    }),
    execute: async ({ ticker, years = 5, statementType = FinancialStatementType.IncomeStatement }) => {
        try {
            // Use mock data source by default
            // In a production environment, we would choose the best source based on availability and data needs
            const source: FinancialDataSource = 'mock';

            // Fetch financial data from the specified source
            const response = await fetchFinancialData(ticker, years, source, statementType);

            // If there was an error fetching the data, return the error
            if (response.error) {
                return { error: response.error };
            }

            // Map the response data to our expected format
            const result = mapToHistoricalData(response);

            // Validate the data against our schema (this will throw if invalid)
            simpleHistoricalDataSchema.parse(result.historicalData);

            return result;
        } catch (error) {
            return {
                error: `Failed to retrieve historical financial data: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    },
});

// Export a collection of financial tools
export const financialTools = (): { getHistoricalFinancialData: Tool } => {
    return {
        getHistoricalFinancialData,
    };
}; 