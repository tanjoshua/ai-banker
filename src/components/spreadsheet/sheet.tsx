"use client"

import { useMemo } from "react";

export enum CellFormat {
    Number = "number",
    Percentage = "percentage",
    String = "string"
}

export type Cell = {
    format: CellFormat
    value: string
}

export function SpreadSheet({ cells }: { cells: Cell[][] }) {
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
                <th className="border border-gray-300 w-10"></th>
                {Array.from({ length: colCount }, (_, colIndex) => (
                    <th key={colIndex} className="border border-gray-300 px-2 py-1">
                        {String.fromCharCode(65 + colIndex)}
                    </th>
                ))}
            </tr>
        </thead>
        <tbody>
            {cells.map((row, rowIndex) => (
                <tr key={rowIndex}>
                    <td className="border border-gray-300 text-center">{rowIndex + 1}</td>
                    {Array.from({ length: colCount }, (_, colIndex) => (
                        <td key={colIndex} className="border border-gray-300 px-2 py-1">
                            {renderCell(row[colIndex] || { format: CellFormat.String, value: "" })}
                        </td>
                    ))}
                </tr>
            ))}
        </tbody>
    </table>

}