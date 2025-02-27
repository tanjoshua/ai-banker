import { Cell } from "../types";
import { Parser as FormulaParser } from 'hot-formula-parser';
import { useMemo, useEffect, useState } from "react";

export function useFormulaParser(cells: Cell[][]) {
    const [evaluatedCells, setEvaluatedCells] = useState<Cell[][]>([]);

    const { evaluateCell, parser } = useMemo(() => {
        const p = new FormulaParser();

        const evaluate = (rowIndex: number, colIndex: number, cellsCopy: Cell[][]): number | null => {
            const cell = cellsCopy[rowIndex][colIndex];

            // Check if we already have an evaluated value and the cell isn't a formula
            if (cell.evaluatedValue) {
                return cell.evaluatedValue;
            }

            let result: number | null = null;

            try {
                if (typeof cell.value === 'string' && cell.value.startsWith('=')) {
                    const formula = cell.value.substring(1);
                    const parseResult = p.parse(formula);

                    if (parseResult.error) {
                        // Parser returns Excel-style errors, use them directly
                        cell.error = parseResult.error;
                        result = null;
                    } else {
                        cell.error = null;
                        result = parseResult.result as number;
                    }
                } else if (typeof cell.value === 'number') {
                    cell.error = null;
                    result = cell.value;
                } else if (typeof cell.value === 'string' && !cell.value.startsWith('=')) {
                    // non formula strings should not be evaluated
                    return null;
                }
            } catch {
                cell.error = '#NAME?';
                result = null;
            }

            // Store the result in the cell
            cell.evaluatedValue = result;
            return result;
        };

        p.on('callCellValue', (cellCoord, done) => {
            const rowIndex = cellCoord.row.index;
            const colIndex = cellCoord.column.index;

            if (!cells[rowIndex] || !cells[rowIndex][colIndex]) {
                done(0);
                return;
            }

            const cellsCopy = cells.map(row => row.map(cell => ({ ...cell })));
            const result = evaluate(rowIndex, colIndex, cellsCopy);
            done(result ?? 0);
        });

        p.on('callRangeValue', (startCell, endCell, done) => {
            const startRowIndex = startCell.row.index;
            const startColIndex = startCell.column.index;
            const endRowIndex = endCell.row.index;
            const endColIndex = endCell.column.index;

            const values = [];
            const cellsCopy = cells.map(row => row.map(cell => ({ ...cell })));

            for (let row = startRowIndex; row <= endRowIndex; row++) {
                for (let col = startColIndex; col <= endColIndex; col++) {
                    if (cells[row] && cells[row][col]) {
                        const result = evaluate(row, col, cellsCopy);
                        if (result !== null) {
                            values.push(result);
                        }
                    }
                }
            }

            done(values);
        });

        return {
            evaluateCell: evaluate,
            parser: p
        };
    }, [cells]);

    useEffect(() => {
        const cellsCopy = cells.map(row => row.map(cell => ({ ...cell })));

        // Initial evaluation of all cells
        cellsCopy.forEach((row, rowIndex) => {
            row.forEach((_, colIndex) => {
                evaluateCell(rowIndex, colIndex, cellsCopy);
            });
        });

        setEvaluatedCells(cellsCopy);
    }, [cells, evaluateCell]);

    return { evaluatedCells };
} 