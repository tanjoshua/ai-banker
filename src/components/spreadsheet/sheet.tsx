"use client"

import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

export enum CellFormat {
    Number = "number",
    Percentage = "percentage",
    String = "string"
}

export type Cell = {
    format: CellFormat
    value: string
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
        let value = cell.value;

        if (value.startsWith("=")) {
            value = "CALCULATED VALUE"
        }

        switch (cell.format) {
            case CellFormat.Number:
                return parseFloat(value).toLocaleString('en-US');
            case CellFormat.Percentage:
                return (parseFloat(value) * 100).toLocaleString('en-US') + '%';
            case CellFormat.String:
                return value;
        }
    }

    return <table className="border-collapse">
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
                    {Array.from({ length: colCount }, (_, colIndex) => (
                        <td key={colIndex}
                            onClick={() => setSelectedCell({ row: rowIndex, col: colIndex, coordinates: getCoordinates(colIndex, rowIndex) })}
                            className={
                                cn(
                                    "border border-gray-300 px-2 py-1 ",
                                    selectedCell?.row === rowIndex && selectedCell?.col === colIndex && "bg-blue-50"
                                )}>
                            {renderCell(row[colIndex] || { format: CellFormat.String, value: "" })}
                        </td>
                    ))}
                </tr>
            ))}
        </tbody>
    </table >

}