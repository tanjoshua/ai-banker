import { tool, type Tool } from 'ai';
import { z } from 'zod';
import { LineItem, historicalDataSchema } from '@/components/spreadsheet/types';

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
            [LineItem.CONWC]: 0,
        };
    }

    return {
        ticker,
        companyName: `${ticker.toUpperCase()} Corporation`,
        data: mockData,
        currency: 'USD',
    };
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
    }),
    execute: async ({ ticker, years = 5 }) => {
        try {
            // Always use mock data
            const response = await fetchMockFinancialData(ticker, years);

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

// Function to fetch data from Alpha Vantage API
export async function fetchAlphaVantageData(
    ticker: string,
    years: number = 5
): Promise<any> {
    try {
        const apiKey = process.env.AV_API_KEY || "demo";
        if (!apiKey) {
            throw new Error('Alpha Vantage API key not found in environment variables');
        }

        // Define the endpoints we want to fetch
        const endpoints = [
            {
                function: "INCOME_STATEMENT",
                key: "incomeStatement"
            },
            {
                function: "BALANCE_SHEET",
                key: "balanceSheet"
            },
            {
                function: "CASH_FLOW",
                key: "cashFlow"
            }
        ];

        // Create an object to hold all the data with an index signature
        const combinedData: {
            symbol: string;
            lastUpdated: string;
            [key: string]: any;
        } = {
            symbol: ticker,
            lastUpdated: new Date().toISOString(),
        };

        // Fetch data from all endpoints
        for (const endpoint of endpoints) {
            const url = `https://www.alphavantage.co/query?function=${endpoint.function}&symbol=${ticker}&apikey=${apiKey}`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Alpha Vantage API returned ${response.status}: ${response.statusText} for ${endpoint.function}`);
            }

            const data = await response.json();

            // Check if we have annual reports and limit them to the requested years
            if (data && data.annualReports && Array.isArray(data.annualReports) && data.annualReports.length > 0) {
                data.annualReports = data.annualReports.slice(0, years);
            }

            // Add this data to our combined response using the endpoint key
            combinedData[endpoint.key] = data;
        }

        return combinedData;
    } catch (error) {
        return {
            error: `Failed to fetch data from Alpha Vantage: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

// Create and export the tool for retrieving data directly from Alpha Vantage
export const getAlphaVantageData = tool({
    description: 'Retrieve financial data directly from Alpha Vantage API for a given company ticker. Returns raw Alpha Vantage data.',
    parameters: z.object({
        ticker: z.string().describe('The stock ticker symbol of the company (e.g., AAPL, MSFT, GOOGL)'),
        years: z.number().optional().default(5).describe('Number of years of historical data to retrieve (default: 5)'),
    }),
    execute: async ({ ticker, years = 5 }) => {
        try {
            const response = await fetchAlphaVantageData(ticker, years);

            // Return the raw Alpha Vantage response without processing
            return response;
        } catch (error) {
            return {
                error: `Failed to retrieve Alpha Vantage data: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    },
});

// Export a collection of financial tools
export const financialTools = (): { getHistoricalFinancialData: Tool, getAlphaVantageData: Tool } => {
    return {
        getHistoricalFinancialData,
        getAlphaVantageData,
    };
}; 