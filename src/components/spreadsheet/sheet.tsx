"use client"

import { cn } from "@/lib/utils";
import { KeyboardEvent, useMemo, useState } from "react";

export enum CellFormat {
    Number = "number",
    Percentage = "percentage",
    String = "string",
}

export type Cell = {
    format: CellFormat
    value: number | string
    className?: string;
    formula?: string;
}

export function getColumn(index: number) {
    const letters: string[] = [];

    while (index >= 0) {
        letters.unshift(String.fromCharCode(65 + (index % 26)));
        index = Math.floor(index / 26) - 1;
    }

    return letters.join('');
}

export function getCoordinates(colIndex: number, rowIndex: number) { return getColumn(colIndex) + (rowIndex + 1) }

export function SpreadSheet({ cells }: { cells: Cell[][] }) {
    const [selectedCell, setSelectedCell] = useState<{ row: number, col: number, coordinates: string }>();
    const colCount = useMemo(() => Math.max(...cells.map(row => row.length)), [cells]);

    function renderCell(cell: Cell) {
        const value = cell.value;

        // if (value.startsWith("=")) {
        //     value = "CALCULATED VALUE"
        // }

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
            {cells.map((row, rowIndex) => (
                <tr key={rowIndex}>
                    <td className="border border-gray-300 text-center">{rowIndex + 1}</td>
                    {Array.from({ length: colCount }, (_, colIndex) => {
                        const cell = row[colIndex] || { format: CellFormat.String, value: "" };
                        return <td key={colIndex}
                            onClick={() => setSelectedCell({ row: rowIndex, col: colIndex, coordinates: getCoordinates(colIndex, rowIndex) })}
                            className={
                                cn(
                                    "whitespace-nowrap relative z-50 cursor-default px-2 py-1",
                                    selectedCell?.row === rowIndex && selectedCell?.col === colIndex && "ring-2 ring-blue-500 ",
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