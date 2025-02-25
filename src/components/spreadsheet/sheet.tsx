"use client"

import { cn } from "@/lib/utils";
import { KeyboardEvent, useEffect, useMemo, useState } from "react";
import { Cell, CellFormat } from "./types";
import { Parser as FormulaParser } from 'hot-formula-parser';


export function getColumn(index: number) {
    const letters: string[] = [];

    while (index >= 0) {
        letters.unshift(String.fromCharCode(65 + (index % 26)));
        index = Math.floor(index / 26) - 1;
    }

    return letters.join('');
}

export function getCoordinates(colIndex: number, rowIndex: number) { return getColumn(colIndex) + (rowIndex + 1) }

export function getColumnIndex(columnLetters: string): number {
    let index = 0;
    for (let i = 0; i < columnLetters.length; i++) {
        const c = columnLetters.charCodeAt(i) - 64; // 'A' is 1, 'B' is 2, etc.
        index = index * 26 + c;
    }
    return index - 1;
}


export function SpreadSheet({ cells }: { cells: Cell[][] }) {
    const [selectedCell, setSelectedCell] = useState<{ row: number, col: number, coordinates: string }>();
    const [evaluatedCells, setEvaluatedCells] = useState<Cell[][]>();
    const colCount = useMemo(() => Math.max(...cells.map(row => row.length)), [cells]);

    const parser = useMemo(() => {
        const p = new FormulaParser();

        p.on('callCellValue', (cellCoord, done) => {
            const rowIndex = cellCoord.row.index; // Convert 1-based to 0-based
            const colIndex = cellCoord.column.index;

            // Check if the cell exists
            if (cells[rowIndex] && cells[rowIndex][colIndex]) {
                const cell = cells[rowIndex][colIndex];
                if (cell.evaluatedValue !== undefined) {
                    done(cell.evaluatedValue);
                } else if (typeof cell.value === 'number') {
                    done(cell.value);
                } else if (typeof cell.value === 'string' && !cell.value.startsWith('=')) {
                    // TODO: UPDATE DEPENDENCIES
                    const num = parseFloat(cell.value);
                    if (!isNaN(num)) {
                        done(num);
                    } else {
                        done(0);
                    }
                } else {
                    done(0);
                }
            } else {
                done(0); // Default to 0 for non-existent cells
            }
        });

        // Add support for range values (needed for SUM, AVERAGE, etc)
        p.on('callRangeValue', (startCell, endCell, done) => {
            const startRowIndex = startCell.row.index;
            const startColIndex = startCell.column.index;
            const endRowIndex = endCell.row.index;
            const endColIndex = endCell.column.index;

            const values = [];

            for (let row = startRowIndex; row <= endRowIndex; row++) {
                for (let col = startColIndex; col <= endColIndex; col++) {
                    if (cells[row] && cells[row][col]) {
                        const cell = cells[row][col];
                        if (cell.evaluatedValue !== undefined) {
                            values.push(cell.evaluatedValue);
                        } else if (typeof cell.value === 'number') {
                            values.push(cell.value);
                        } else if (typeof cell.value === 'string' && !cell.value.startsWith('=')) {
                            const num = parseFloat(cell.value);
                            if (!isNaN(num)) {
                                values.push(num);
                            }
                        }
                    }
                }
            }

            done(values);
        });

        return p;
    }, [cells]);

    useEffect(() => {
        const cellsCopy = cells.map(row => row.map(cell => ({ ...cell })));

        // Function to evaluate a single cell
        const evaluateCell = (rowIndex: number, colIndex: number) => {
            const cell = cellsCopy[rowIndex][colIndex];

            if (typeof cell.value === 'string' && cell.value.startsWith('=')) {
                try {
                    const formula = cell.value.substring(1);
                    console.log("evaluating formula", formula)
                    const result = parser.parse(formula);
                    console.log("formula result", result)
                    cell.evaluatedValue = result.error ? null : result.result as number;
                    cell.error = result.error;
                } catch {
                    cell.evaluatedValue = null;
                    cell.error = 'ERROR';
                }
            } else if (typeof cell.value === 'number') {
                cell.evaluatedValue = cell.value;
                cell.error = null;
            } else {
                cell.evaluatedValue = null;
                cell.error = 'NOT_NUMBER';
            }
        };

        // Evaluate all cells
        cellsCopy.forEach((row, rowIndex) => {
            row.forEach((_, colIndex) => {
                evaluateCell(rowIndex, colIndex);
            });
        });

        setEvaluatedCells(cellsCopy);
    }, [cells, parser])

    function renderCell(cell: Cell) {
        let value = cell.value
        if (typeof cell.value === 'string' && cell.value.startsWith("=")) {
            value = cell.evaluatedValue!
        }

        switch (cell.format) {
            case CellFormat.Number:
                return parseFloat(value as string).toLocaleString('en-US');
            case CellFormat.Percentage:
                return (value as number * 100).toFixed(2) + '%';
            case CellFormat.String:
                return value;
        }
    }

    function handleKeyDown(e: KeyboardEvent<HTMLTableElement>) {
        if (e.key === "Tab") {
            e.preventDefault();
        }

        const currentCellRow = selectedCell?.row || 0;
        const currentCellCol = selectedCell?.col || 0;

        let newRow = selectedCell?.row || 0;
        let newCol = selectedCell?.col || 0;

        switch (e.key) {
            case "ArrowUp":
                newRow = Math.max(0, currentCellRow - 1);
                break;
            case "ArrowDown":
                newRow = Math.min(cells.length - 1, currentCellRow + 1);
                break;
            case "ArrowLeft":
                newCol = Math.max(0, currentCellCol - 1);
                break;
            case "ArrowRight":
                newCol = Math.min(colCount - 1, currentCellCol + 1);
                break;
            case "Tab":
                // move to next column, wrap to next row if needed
                newCol = currentCellCol + 1;
                if (newCol >= colCount) {
                    newCol = 0;
                    newRow = Math.min(cells.length - 1, currentCellRow + 1);
                }
                break;
            default:
                return;
        }

        setSelectedCell({
            row: newRow,
            col: newCol,
            coordinates: getCoordinates(newCol, newRow)
        })
    }

    if (!evaluatedCells) {
        return <div>Loading...</div>
    }

    return <table className="" tabIndex={0} onKeyDown={handleKeyDown}>
        <thead>
            <tr>
                <th className="border border-gray-300"></th>
                {Array.from({ length: colCount }, (_, colIndex) => (
                    <th key={colIndex} className="border border-gray-300 px-2 py-1">
                        {getColumn(colIndex)}
                    </th>
                ))}
            </tr>
        </thead>
        <tbody>
            {evaluatedCells.map((row, rowIndex) => (
                <tr key={rowIndex}>
                    <td className="border border-gray-300 text-center">{rowIndex + 1}</td>
                    {Array.from({ length: colCount }, (_, colIndex) => {
                        const cell = row[colIndex] || { format: CellFormat.String, value: "" };
                        return <td key={colIndex}
                            onClick={() => setSelectedCell({ row: rowIndex, col: colIndex, coordinates: getCoordinates(colIndex, rowIndex) })}
                            className={
                                cn(
                                    "whitespace-nowrap relative cursor-default px-2 py-1",
                                    selectedCell?.row === rowIndex && selectedCell?.col === colIndex && "z-10 ring-2 ring-primary",
                                    cell.className
                                )}>
                            <div className={cn()}>

                                {renderCell(cell)}
                            </div>
                        </td>
                    })}
                </tr>
            ))}
        </tbody>
    </table >

}