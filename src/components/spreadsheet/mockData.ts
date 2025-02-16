export enum LineItem {
    Revenue = "revenue",
    COGS = "cogs",
    SGNA = "SG&A",
    DNA = "D&A",
    CAPEX = "CAPEX",
    Taxes = "Taxes",
    CONWC = "CONWC",
}

export type FinancialStatementData = {
    [Key in LineItem]: number;
}

export const financialDataMap: Map<string, Map<number, FinancialStatementData>> = new Map([
    [
        "MCD", new Map<number, FinancialStatementData>([
            [2016, {
                [LineItem.Revenue]: 24622,
                [LineItem.COGS]: 14417,
                [LineItem.SGNA]: 2385,
                [LineItem.DNA]: 0,
                [LineItem.CAPEX]: 1821,
                [LineItem.Taxes]: 2180,
                [LineItem.CONWC]: 0,
            }],
            [2017, {
                [LineItem.Revenue]: 22820,
                [LineItem.COGS]: 12200,
                [LineItem.SGNA]: 2231,
                [LineItem.DNA]: 0,
                [LineItem.CAPEX]: 1854,
                [LineItem.Taxes]: 3381,
                [LineItem.CONWC]: 0,
            }],
            [2018, {
                [LineItem.Revenue]: 21258,
                [LineItem.COGS]: 10425,
                [LineItem.SGNA]: 1985,
                [LineItem.DNA]: 215,
                [LineItem.CAPEX]: 2172,
                [LineItem.Taxes]: 1892,
                [LineItem.CONWC]: 0,
            }],
            [2019, {
                [LineItem.Revenue]: 21364,
                [LineItem.COGS]: 10185,
                [LineItem.SGNA]: 1967,
                [LineItem.DNA]: 263,
                [LineItem.CAPEX]: 2394,
                [LineItem.Taxes]: 1993,
                [LineItem.CONWC]: 0,
            }],
            [2020, {
                [LineItem.Revenue]: 19208,
                [LineItem.COGS]: 9486,
                [LineItem.SGNA]: 2245,
                [LineItem.DNA]: 301,
                [LineItem.CAPEX]: 1641,
                [LineItem.Taxes]: 1410,
                [LineItem.CONWC]: 0,
            }],
            [2021, {
                [LineItem.Revenue]: 23223,
                [LineItem.COGS]: 9975,
                [LineItem.SGNA]: 2378,
                [LineItem.DNA]: 330,
                [LineItem.CAPEX]: 1890,
                [LineItem.Taxes]: 1583,
                [LineItem.CONWC]: 0,
            }],
            [2022, {
                [LineItem.Revenue]: 23183,
                [LineItem.COGS]: 10391,
                [LineItem.SGNA]: 2492,
                [LineItem.DNA]: 370,
                [LineItem.CAPEX]: 1872,
                [LineItem.Taxes]: 1648,
                [LineItem.CONWC]: 0,
            }],
            [2023, {
                [LineItem.Revenue]: 25448,
                [LineItem.COGS]: 11694,
                [LineItem.SGNA]: 2435,
                [LineItem.DNA]: 382,
                [LineItem.CAPEX]: 2070,
                [LineItem.Taxes]: 2053,
                [LineItem.CONWC]: 0,
            }],
            [2024, {
                [LineItem.Revenue]: 25920,
                [LineItem.COGS]: 11963,
                [LineItem.SGNA]: 2412,
                [LineItem.DNA]: 447,
                [LineItem.CAPEX]: 2775,
                [LineItem.Taxes]: 2111,
                [LineItem.CONWC]: 0,
            }],
        ])
    ],
]);



export function getHardcodedData(ticker: string, year: number, lineItem: LineItem) {
    return financialDataMap.get(ticker)?.get(year)?.[lineItem] ?? 0;
}