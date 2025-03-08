'use client';
import { cn } from "@/lib/utils";
import { SpreadSheet, getCoordinates } from "./sheet";
import { getHardcodedData, LineItem } from "./mockData";
import { Cell, CellFormat, DCFParameters } from "./types";
import { useState } from "react";

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
            // Historical data - convert to formulas
            // First, store the raw data from the API
            const revenue = getHardcodedData(ticker, year, LineItem.Revenue);
            const cogs = getHardcodedData(ticker, year, LineItem.COGS);
            const sga = getHardcodedData(ticker, year, LineItem.SGNA);
            const da = getHardcodedData(ticker, year, LineItem.DNA);
            const capex = getHardcodedData(ticker, year, LineItem.CAPEX);
            const taxes = getHardcodedData(ticker, year, LineItem.Taxes);
            const changeInOperatingNWC = getHardcodedData(ticker, year, LineItem.CONWC);

            // Store the raw data in cells
            cells[revenueRow][colIndex] = { format: CellFormat.Number, value: revenue, className: "text-end" };

            // Get cell references
            const currentRevenueRef = getCoordinates(colIndex, revenueRow);
            const prevColIndex = colIndex - 1;
            const prevRevenueRef = getCoordinates(prevColIndex, revenueRow);

            // Revenue growth calculation
            if (colIndex === 1) {
                cells[revenueGrowthRow][colIndex] = { format: CellFormat.String, value: "", className: "text-end" };
            } else {
                const revenueGrowthFormula = `=(${currentRevenueRef}-${prevRevenueRef})/${prevRevenueRef}`;
                cells[revenueGrowthRow][colIndex] = { format: CellFormat.Percentage, value: revenueGrowthFormula, className: "text-end" };
            }

            // COGS
            cells[cogsRow][colIndex] = { format: CellFormat.Number, value: -cogs, className: "text-end" };
            const currentCogsRef = getCoordinates(colIndex, cogsRow);

            // COGS margin
            const cogsMarginFormula = `=-${currentCogsRef}/${currentRevenueRef}`;
            cells[cogsMarginRow][colIndex] = { format: CellFormat.Percentage, value: cogsMarginFormula, className: "text-end" };

            // Gross profit
            const grossProfitFormula = `=${currentRevenueRef}+${currentCogsRef}`;
            cells[grossProfitRow][colIndex] = { format: CellFormat.Number, value: grossProfitFormula, className: "text-end" };
            const currentGrossProfitRef = getCoordinates(colIndex, grossProfitRow);

            // SG&A
            cells[sgaRow][colIndex] = { format: CellFormat.Number, value: -sga, className: "text-end" };
            const currentSgaRef = getCoordinates(colIndex, sgaRow);

            // SG&A margin
            const sgaMarginFormula = `=-${currentSgaRef}/${currentRevenueRef}`;
            cells[sgaMarginRow][colIndex] = { format: CellFormat.Percentage, value: sgaMarginFormula, className: "text-end" };

            // D&A
            cells[daRow][colIndex] = { format: CellFormat.Number, value: da, className: "text-end" };
            const currentDaRef = getCoordinates(colIndex, daRow);

            // Capex
            cells[nopatCapexRow][colIndex] = { format: CellFormat.Number, value: capex, className: "text-end" };
            const currentCapexRef = getCoordinates(colIndex, nopatCapexRow);

            // D&A as % of Capex
            const daCapexFormula = `=${currentDaRef}/${currentCapexRef}`;
            cells[daCapexRow][colIndex] = { format: CellFormat.Percentage, value: daCapexFormula, className: "text-end" };

            // EBITDA
            const ebitdaFormula = `=${currentGrossProfitRef}+${currentSgaRef}+${currentDaRef}`;
            cells[ebitdaRow][colIndex] = { format: CellFormat.Number, value: ebitdaFormula, className: "text-end" };
            const currentEbitdaRef = getCoordinates(colIndex, ebitdaRow);

            // EBITDA margin
            const ebitdaMarginFormula = `=${currentEbitdaRef}/${currentRevenueRef}`;
            cells[ebitdaMarginRow][colIndex] = { format: CellFormat.Percentage, value: ebitdaMarginFormula, className: "text-end" };

            // Negative D&A for EBIT calculation
            const negativeDaFormula = `=-${currentDaRef}`;
            cells[ebitdaDaRow][colIndex] = { format: CellFormat.Number, value: negativeDaFormula, className: "text-end" };

            // EBIT
            const ebitFormula = `=${currentEbitdaRef}+${getCoordinates(colIndex, ebitdaDaRow)}`;
            cells[ebitRow][colIndex] = { format: CellFormat.Number, value: ebitFormula, className: "text-end" };
            const currentEbitRef = getCoordinates(colIndex, ebitRow);

            // Taxes
            cells[taxesRow][colIndex] = { format: CellFormat.Number, value: taxes, className: "text-end" };
            const currentTaxesRef = getCoordinates(colIndex, taxesRow);

            // Tax rate
            const taxRateFormula = `=${currentTaxesRef}/${currentEbitRef}`;
            cells[taxRateRow][colIndex] = { format: CellFormat.Percentage, value: taxRateFormula, className: "text-end" };

            // NOPAT
            const nopatFormula = `=${currentEbitRef}-${currentTaxesRef}`;
            cells[nopatRow][colIndex] = { format: CellFormat.Number, value: nopatFormula, className: "text-end" };
            const currentNopatRef = getCoordinates(colIndex, nopatRow);

            // Add back D&A
            cells[nopatDaRow][colIndex] = { format: CellFormat.Number, value: `=${currentDaRef}`, className: "text-end" };

            // Sales intensity
            const salesIntensityFormula = `=${currentCapexRef}/${currentRevenueRef}`;
            cells[nopatSalesIntensity][colIndex] = { format: CellFormat.Percentage, value: salesIntensityFormula, className: "text-end" };

            // Change in NWC
            cells[nopatNwcDeltaRow][colIndex] = { format: CellFormat.Number, value: changeInOperatingNWC, className: "text-end" };
            const currentNwcDeltaRef = getCoordinates(colIndex, nopatNwcDeltaRow);

            // NWC margin
            const nwcMarginFormula = `=${currentNwcDeltaRef}/${currentRevenueRef}`;
            cells[nopatMarginRow][colIndex] = { format: CellFormat.Percentage, value: nwcMarginFormula, className: "text-end" };

            // UFCF
            const ufcfFormula = `=${currentNopatRef}+${currentDaRef}-${currentCapexRef}-${currentNwcDeltaRef}`;
            cells[ufcfRow][colIndex] = { format: CellFormat.Number, value: ufcfFormula, className: "text-end font-semibold" };
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
            const ebitFormula = `=${currentEbitdaRef}+${getCoordinates(colIndex, ebitdaDaRow)}`;
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
    const [cells, setCells] = useState<Cell[][]>(
        generateDCFCells(ticker, params)
    );

    return (
        <SpreadSheet cells={cells} setCells={setCells} />
    )
}