"use client"

import { cn } from "@/lib/utils";
import { KeyboardEvent,  useEffect, useMemo, useState } from "react";
import { Cell,  CellFormat } from "./types";
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

    const { evaluateCell, parser } = useMemo(() => {
        const p = new FormulaParser();
        
        const evaluate = (rowIndex: number, colIndex: number, cellsCopy: Cell[][]): number | null => {
            const cell = cellsCopy[rowIndex][colIndex];
            
            // Check if we already have an evaluated value and the cell isn't a formula
            if (cell.evaluatedValue !== undefined && 
                (typeof cell.value !== 'string' || !cell.value.startsWith('='))) {
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
                    const num = parseFloat(cell.value);
                    if (!isNaN(num)) {
                        cell.error = null;
                        result = num;
                    } else {
                        cell.error = '#VALUE!';
                        result = null;
                    }
                }
            } catch  {
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
    }, [cells, parser, evaluateCell])

    function renderCell(cell: Cell) {
        // If cell has an error, display it
        if (cell.error) {
            return cell.error;  // Parser errors already include the # and !
        }

        // For formulas, use evaluated value
        let value = cell.value;
        if (typeof cell.value === 'string' && cell.value.startsWith('=')) {
            if (!cell.evaluatedValue) {
                return '#ERROR!';
            }
            value = cell.evaluatedValue;
        }

        // Format the value based on cell type
        switch (cell.format) {
            case CellFormat.Number:
                const num = typeof value === 'string' ? parseFloat(value) : value;
                return isNaN(num) ? '#NaN' : num.toLocaleString('en-US');
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