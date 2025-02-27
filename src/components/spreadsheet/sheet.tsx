"use client"

import { cn } from "@/lib/utils";
import { KeyboardEvent, useState } from "react";
import { Cell, CellFormat } from "./types";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useFormulaParser } from "./hooks/useFormulaParser";
import { FormulaBar } from "./components/FormulaBar";
import { getCoordinates, renderCellValue, getColumn } from "./utils/cellUtils";

export { getColumn, getCoordinates, getColumnIndex } from "./utils/cellUtils";

export function SpreadSheet({
    cells,
    setCells,
    selectedCell: externalSelectedCell,
    onSelectCell: externalSetSelectedCell
}: {
    cells: Cell[][],
    setCells: (cells: Cell[][]) => void,
    selectedCell?: { row: number, col: number, coordinates: string },
    onSelectCell?: (cell: { row: number, col: number, coordinates: string }) => void
}) {
    const [internalSelectedCell, setInternalSelectedCell] = useState<{ row: number, col: number, coordinates: string }>();

    // Use external state if provided, otherwise use internal state
    const selectedCell = externalSelectedCell !== undefined ? externalSelectedCell : internalSelectedCell;

    // Function to update the selected cell
    const setSelectedCell = (cell: { row: number, col: number, coordinates: string }) => {
        if (externalSetSelectedCell) {
            // If external handler is provided, call it
            externalSetSelectedCell(cell);
        } else {
            // Otherwise use internal state
            setInternalSelectedCell(cell);
        }
    };

    const { evaluatedCells } = useFormulaParser(cells);
    const colCount = Math.max(...cells.map(row => row.length));

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
        });
    }

    if (!evaluatedCells) {
        return <div>Loading...</div>
    }

    const selectedCellValue = selectedCell && evaluatedCells[selectedCell.row]?.[selectedCell.col]?.value;

    return (
        <div className="w-full flex flex-col relative flex-1 min-h-0">
            <FormulaBar
                selectedCell={selectedCell}
                cellValue={selectedCellValue}
            />

            <ScrollArea className="flex-1 min-h-0">
                <ScrollBar orientation="horizontal" />
                <div className="relative h-full min-w-max">
                    <table className="border-collapse w-full" tabIndex={0} onKeyDown={handleKeyDown}>
                        <thead>
                            <tr>
                                <th className="border border-gray-300 bg-background"></th>
                                {Array.from({ length: colCount }, (_, colIndex) => (
                                    <th
                                        key={colIndex}
                                        className="border border-gray-300 px-2 py-1 bg-background z-20 sticky top-0"
                                    >
                                        {getColumn(colIndex)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {evaluatedCells.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    <td className="border border-gray-300 text-center sticky left-0 z-10 bg-background">
                                        {rowIndex + 1}
                                    </td>
                                    {Array.from({ length: colCount }, (_, colIndex) => {
                                        const cell = row[colIndex] || { format: CellFormat.String, value: "" };
                                        return (
                                            <td
                                                key={colIndex}
                                                onClick={() => setSelectedCell({
                                                    row: rowIndex,
                                                    col: colIndex,
                                                    coordinates: getCoordinates(colIndex, rowIndex)
                                                })}
                                                className={cn(
                                                    "whitespace-nowrap relative cursor-default px-2 py-1",
                                                    selectedCell?.row === rowIndex && selectedCell?.col === colIndex && "z-20 ring-2 ring-primary",
                                                    cell.className
                                                )}
                                            >
                                                <div>
                                                    {renderCellValue(cell)}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </ScrollArea>
        </div>
    );
}