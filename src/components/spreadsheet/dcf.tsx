'use client';
import { cn } from "@/lib/utils";
import { SpreadSheet, getCoordinates } from "./sheet";
import { getHardcodedData, LineItem } from "./mockData";
import { Cell, CellFormat } from "./types";


interface DCFParameters {
    revenueGrowth: number;
    cogsMargin: number;
    sgaMargin: number;
    daCapex: number;
    taxRate: number;
    salesIntensity: number;
}

export function generateDCFCells(ticker: string, params: DCFParameters) {
    const currentYear = 2024;
    const startYear = -8;
    const endYear = 10;

    const cells: Cell[][] = Array.from({ length: 30 }, () => Array(Math.abs(endYear - startYear) + 1).fill({ format: CellFormat.String, value: "" } as Cell));

    const revenueRow = 1;
    const revenueGrowthRow = revenueRow + 1;
    const cogsRow = revenueGrowthRow + 1;
    const cogsMarginRow = cogsRow + 1;
    const grossProfitRow = cogsMarginRow + 2;
    const sgaRow = grossProfitRow + 1;
    const sgaMarginRow = sgaRow + 1;
    const daRow = sgaMarginRow + 1;
    const daCapexRow = daRow + 1;
    const ebitdaRow = daCapexRow + 2;
    const ebitdaMarginRow = ebitdaRow + 1;
    const ebitdaDaRow = ebitdaMarginRow + 1;
    const ebitRow = ebitdaDaRow + 2;
    const taxesRow = ebitRow + 1;
    const taxRateRow = taxesRow + 1;
    const nopatRow = taxRateRow + 2;
    const nopatDaRow = nopatRow + 1;
    const nopatCapexRow = nopatDaRow + 1;
    const nopatSalesIntensity = nopatCapexRow + 1;
    const nopatNwcDeltaRow = nopatSalesIntensity + 1;
    const nopatMarginRow = nopatNwcDeltaRow + 1;
    const ufcfRow = nopatMarginRow + 2;


    cells[revenueRow][0] = {
        format: CellFormat.String,
        value: "Revenue",
        className: "font-semibold"
    }
    cells[revenueGrowthRow][0] = {
        format: CellFormat.String,
        value: "% growth",
        className: "italic"
    }
    cells[cogsRow][0] = {
        format: CellFormat.String,
        value: "(-) COGS",
        className: ""
    }
    cells[cogsMarginRow][0] = {
        format: CellFormat.String,
        value: "  % margin",
        className: "italic"
    }
    cells[grossProfitRow][0] = {
        format: CellFormat.String,
        value: "Gross Profit",
        className: "font-semibold"
    }
    cells[sgaRow][0] = {
        format: CellFormat.String,
        value: "(-) SG&A",
        className: "font-semibold"
    }
    cells[sgaMarginRow][0] = {
        format: CellFormat.String,
        value: "  % margin",
        className: "italic"
    }
    cells[daRow][0] = {
        format: CellFormat.String,
        value: "(+) D&A",
        className: ""
    }
    cells[daCapexRow][0] = {
        format: CellFormat.String,
        value: "  % capex",
        className: "italic"
    }
    cells[ebitdaRow][0] = {
        format: CellFormat.String,
        value: "EBITDA",
        className: "font-semibold"
    }
    cells[ebitdaMarginRow][0] = {
        format: CellFormat.String,
        value: "% margin",
        className: "italic"
    }
    cells[ebitdaDaRow][0] = {
        format: CellFormat.String,
        value: "  (-) D&A",
        className: ""
    }

    cells[ebitRow][0] = {
        format: CellFormat.String,
        value: "EBIT",
        className: "font-semibold"
    }
    cells[taxesRow][0] = {
        format: CellFormat.String,
        value: "  (-) Taxes",
        className: ""
    }
    cells[taxRateRow][0] = {
        format: CellFormat.String,
        value: "  % effective tax rate",
        className: "italic"
    }

    cells[nopatRow][0] = {
        format: CellFormat.String,
        value: "NOPAT",
        className: "font-semibold"
    }
    cells[nopatDaRow][0] = {
        format: CellFormat.String,
        value: "(+) D&A",
        className: ""
    }
    cells[nopatCapexRow][0] = {
        format: CellFormat.String,
        value: "(-) Capex",
        className: ""
    }
    cells[nopatSalesIntensity][0] = {
        format: CellFormat.String,
        value: "% sales intensity",
        className: "italic"
    }
    cells[nopatNwcDeltaRow][0] = {
        format: CellFormat.String,
        value: "(-) Change in Operating NWC",
        className: ""
    }
    cells[nopatMarginRow][0] = {
        format: CellFormat.String,
        value: "% margin",
        className: "italic"
    }

    cells[ufcfRow][0] = {
        format: CellFormat.String,
        value: "UFCF",
        className: "font-semibold"

    }

    // year headers
    for (let i = startYear; i <= endYear; i++) {
        const colIndex = i - startYear + 1; // +1 to leave space for the row titles
        const year = currentYear + i;
        const actual = i <= 0;
        const suffix = actual ? 'A' : 'E';
        cells[0][colIndex] = {
            format: CellFormat.String,
            value: `FY ${year}${suffix}`,
            className: cn(
                "text-end font-semibold",
                actual ? "bg-blue-300" : "bg-green-300"
            )
        }

        if (i <= 0) {
            const revenue = getHardcodedData(ticker, year, LineItem.Revenue);
            cells[revenueRow][colIndex] = { format: CellFormat.Number, value: revenue, className: "text-end" }


            if (colIndex === 1) {
                cells[revenueGrowthRow][colIndex] = { format: CellFormat.String, value: "", className: "text-end" }
            } else {
                const prevRevenue = getHardcodedData(ticker, year - 1, LineItem.Revenue);
                const revenueGrowth = (revenue - prevRevenue) / prevRevenue;
                cells[revenueGrowthRow][colIndex] = { format: CellFormat.Percentage, value: revenueGrowth, className: "text-end" }
            }

            const cogs = getHardcodedData(ticker, year, LineItem.COGS);
            cells[cogsRow][colIndex] = { format: CellFormat.Number, value: -cogs, className: "text-end" }

            const cogsMargin = - cogs / revenue;
            cells[cogsMarginRow][colIndex] = { format: CellFormat.Percentage, value: cogsMargin, className: "text-end" }

            const grossProfit = revenue - cogs;
            cells[grossProfitRow][colIndex] = { format: CellFormat.Number, value: grossProfit, className: "text-end" }

            const sga = getHardcodedData(ticker, year, LineItem.SGNA);
            cells[sgaRow][colIndex] = { format: CellFormat.Number, value: -sga, className: "text-end" }

            const sgaMargin = sga / revenue;
            cells[sgaMarginRow][colIndex] = { format: CellFormat.Percentage, value: sgaMargin, className: "text-end" }

            const da = getHardcodedData(ticker, year, LineItem.DNA);
            cells[daRow][colIndex] = { format: CellFormat.Number, value: da, className: "text-end" }

            const capex = getHardcodedData(ticker, year, LineItem.CAPEX);
            const daCapex = da / capex;
            cells[daCapexRow][colIndex] = { format: CellFormat.Percentage, value: daCapex, className: "text-end" }

            const ebitda = grossProfit - sga + da;
            cells[ebitdaRow][colIndex] = { format: CellFormat.Number, value: ebitda, className: "text-end" }

            const ebitdaMargin = ebitda / revenue;
            cells[ebitdaMarginRow][colIndex] = { format: CellFormat.Percentage, value: ebitdaMargin, className: "text-end" }
            cells[ebitdaDaRow][colIndex] = { format: CellFormat.Number, value: -da, className: "text-end" }

            const ebit = ebitda - da;
            const taxes = getHardcodedData(ticker, year, LineItem.Taxes);
            cells[ebitRow][colIndex] = { format: CellFormat.Number, value: ebit, className: "text-end" }
            cells[taxesRow][colIndex] = { format: CellFormat.Number, value: taxes, className: "text-end" }
            cells[taxRateRow][colIndex] = { format: CellFormat.Percentage, value: taxes / ebit, className: "text-end" }

            const nopat = ebit - taxes;
            cells[nopatRow][colIndex] = { format: CellFormat.Number, value: nopat, className: "text-end" }
            cells[nopatDaRow][colIndex] = { format: CellFormat.Number, value: da, className: "text-end" }
            cells[nopatCapexRow][colIndex] = { format: CellFormat.Number, value: capex, className: "text-end" }
            const salesIntensity = capex / revenue;
            cells[nopatSalesIntensity][colIndex] = { format: CellFormat.Percentage, value: salesIntensity, className: "text-end" }
            const changeInOperatingNWC = getHardcodedData(ticker, year, LineItem.CONWC);
            cells[nopatNwcDeltaRow][colIndex] = { format: CellFormat.Number, value: changeInOperatingNWC, className: "text-end" }
            cells[nopatMarginRow][colIndex] = { format: CellFormat.Percentage, value: changeInOperatingNWC / revenue, className: "text-end" }

            const ufcf = nopat + da - capex - changeInOperatingNWC;
            cells[ufcfRow][colIndex] = { format: CellFormat.Number, value: ufcf, className: "text-end font-semibold" }
        } else {
            // Input parameters (yellow background)
            cells[revenueGrowthRow][colIndex] = {
                format: CellFormat.Percentage,
                value: params.revenueGrowth,
                className: "text-end bg-yellow-100"
            }
            cells[cogsMarginRow][colIndex] = {
                format: CellFormat.Percentage,
                value: params.cogsMargin,
                className: "text-end bg-yellow-100"
            }
            cells[sgaMarginRow][colIndex] = {
                format: CellFormat.Percentage,
                value: params.sgaMargin,
                className: "text-end bg-yellow-100"
            }
            cells[daCapexRow][colIndex] = {
                format: CellFormat.Percentage,
                value: params.daCapex,
                className: "text-end bg-yellow-100"
            }
            cells[taxRateRow][colIndex] = {
                format: CellFormat.Percentage,
                value: params.taxRate,
                className: "text-end bg-yellow-100"
            }
            cells[nopatSalesIntensity][colIndex] = {
                format: CellFormat.Percentage,
                value: params.salesIntensity,
                className: "text-end bg-yellow-100"
            }

            // Get cell references for the current column
            const prevColIndex = colIndex - 1;
            const prevRevenueRef = getCoordinates(prevColIndex, revenueRow);
            const currentRevenueGrowthRef = getCoordinates(colIndex, revenueGrowthRow);
            const currentRevenueRef = getCoordinates(colIndex, revenueRow);
            const currentCogsMarginRef = getCoordinates(colIndex, cogsMarginRow);
            const currentCogsRef = getCoordinates(colIndex, cogsRow);
            const currentGrossProfitRef = getCoordinates(colIndex, grossProfitRow);
            const currentSgaMarginRef = getCoordinates(colIndex, sgaMarginRow);
            const currentSgaRef = getCoordinates(colIndex, sgaRow);
            const currentDaRef = getCoordinates(colIndex, daRow);
            const currentDaCapexRef = getCoordinates(colIndex, daCapexRow);
            const currentEbitdaRef = getCoordinates(colIndex, ebitdaRow);
            const currentEbitRef = getCoordinates(colIndex, ebitRow);
            const currentTaxRateRef = getCoordinates(colIndex, taxRateRow);
            const currentTaxesRef = getCoordinates(colIndex, taxesRow);
            const currentNopatRef = getCoordinates(colIndex, nopatRow);
            const currentSalesIntensityRef = getCoordinates(colIndex, nopatSalesIntensity);
            const currentCapexRef = getCoordinates(colIndex, nopatCapexRow);
            const currentNwcDeltaRef = getCoordinates(colIndex, nopatNwcDeltaRow);
            const currentNwcDeltaMarginRef = getCoordinates(colIndex, nopatMarginRow);

            // Create formulas with descriptive variable names
            const revenueFormula = `=${prevRevenueRef}*(1+${currentRevenueGrowthRef})`;
            const cogsFormula = `=${currentRevenueRef}*${currentCogsMarginRef}`;
            const grossProfitFormula = `=${currentRevenueRef}-${currentCogsRef}`;
            const sgaFormula = `=${currentGrossProfitRef}*${currentSgaMarginRef}`;
            const capexFormula = `=${currentRevenueRef}*${currentSalesIntensityRef}`;
            const daFormula = `=${currentCapexRef}*${currentDaCapexRef}`;
            const ebitdaFormula = `=${currentGrossProfitRef}-${currentSgaRef}+${currentDaRef}`;
            const ebitdaMarginFormula = `=${currentEbitdaRef}/${currentRevenueRef}`;
            const negativeDaFormula = `=-${currentDaRef}`;
            const ebitFormula = `=${currentEbitdaRef}-${currentDaRef}`;
            const taxesFormula = `=${currentEbitRef}*${currentTaxRateRef}`;
            const nopatFormula = `=${currentEbitRef}-${currentTaxesRef}`;
            const nwcDeltaValue = `=${currentRevenueRef}*${currentNwcDeltaMarginRef}`;
            const ufcfFormula = `=${currentNopatRef}+${currentDaRef}-${currentCapexRef}-${currentNwcDeltaRef}`;

            // Assign formulas to cells
            cells[revenueRow][colIndex] = {
                format: CellFormat.Number,
                value: revenueFormula,
                className: "text-end"
            }

            cells[cogsRow][colIndex] = {
                format: CellFormat.Number,
                value: cogsFormula,
                className: "text-end"
            }

            cells[grossProfitRow][colIndex] = {
                format: CellFormat.Number,
                value: grossProfitFormula,
                className: "text-end"
            }

            cells[sgaRow][colIndex] = {
                format: CellFormat.Number,
                value: sgaFormula,
                className: "text-end"
            }

            cells[nopatCapexRow][colIndex] = {
                format: CellFormat.Number,
                value: capexFormula,
                className: "text-end"
            }

            cells[daRow][colIndex] = {
                format: CellFormat.Number,
                value: daFormula,
                className: "text-end"
            }

            cells[ebitdaRow][colIndex] = {
                format: CellFormat.Number,
                value: ebitdaFormula,
                className: "text-end"
            }

            cells[ebitdaMarginRow][colIndex] = {
                format: CellFormat.Percentage,
                value: ebitdaMarginFormula,
                className: "text-end"
            }

            cells[ebitdaDaRow][colIndex] = {
                format: CellFormat.Number,
                value: negativeDaFormula,
                className: "text-end"
            }

            cells[ebitRow][colIndex] = {
                format: CellFormat.Number,
                value: ebitFormula,
                className: "text-end"
            }

            cells[taxesRow][colIndex] = {
                format: CellFormat.Number,
                value: taxesFormula,
                className: "text-end"
            }

            cells[nopatRow][colIndex] = {
                format: CellFormat.Number,
                value: nopatFormula,
                className: "text-end"
            }

            cells[nopatDaRow][colIndex] = {
                format: CellFormat.Number,
                value: `=${currentDaRef}`,
                className: "text-end"
            }

            cells[nopatNwcDeltaRow][colIndex] = {
                format: CellFormat.Number,
                value: nwcDeltaValue,
                className: "text-end"
            }

            cells[nopatMarginRow][colIndex] = {
                format: CellFormat.Percentage,
                value: 0,
                className: "text-end"
            }

            cells[ufcfRow][colIndex] = {
                format: CellFormat.Number,
                value: ufcfFormula,
                className: "text-end font-semibold"
            }
        }
    }
    return cells
}

export function DCF({ ticker, params }: { ticker: string; params: DCFParameters }) {
    const cells = generateDCFCells(ticker, params);

    return (
        <SpreadSheet cells={cells} />
    )
}