"use client"

import { cn } from "@/lib/utils";
import { KeyboardEvent, useEffect, useMemo, useState } from "react";
import { Cell, CellFormat } from "./types";


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

    useEffect(() => {
        // re evaluate cells when changed, can change to a more efficient strategy of only re evaluating the cells that have changed later on
        const cellsCopy = cells.map(row => row.map(cell => ({ ...cell })))

        cellsCopy.forEach((row) => {
            row.forEach((cell) => {
                if (typeof cell.value === 'string' && cell.value.startsWith("=") && cell.evaluatedValue === undefined) {
                    // evaluate cells that are not yet evaluated yet
                }
            })
        })

        setEvaluatedCells(cellsCopy);
    }, [cells])

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