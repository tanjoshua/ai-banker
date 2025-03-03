"use client"

import { cn } from "@/lib/utils";
import { KeyboardEvent, useState, useRef, useEffect } from "react";
import { Cell, CellFormat } from "./types";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { FormulaBar } from "./components/FormulaBar";
import { getCoordinates, renderCellValue, getColumn } from "./utils/cellUtils";

export function DisplaySheet({
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
    const [editingCell, setEditingCell] = useState<{ row: number, col: number } | null>(null);
    const [editValue, setEditValue] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const tableRef = useRef<HTMLTableElement>(null);

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

    const colCount = Math.max(...cells.map(row => row.length));

    // Start editing the selected cell
    const startEditing = () => {
        if (!selectedCell) return;

        const cell = cells[selectedCell.row]?.[selectedCell.col];
        if (!cell) return;

        setEditingCell({ row: selectedCell.row, col: selectedCell.col });
        // For formulas, display the raw formula
        setEditValue(cell.value?.toString() || "");
    };

    // Save the edited value to the cell
    const saveEdit = () => {
        if (!editingCell) return;

        // Explicitly blur the input to release focus
        if (inputRef.current) {
            inputRef.current.blur();
        }

        const updatedCells = cells.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
                if (rowIndex === editingCell.row && colIndex === editingCell.col) {
                    // Check if the value is a number and the cell format is Number
                    let newValue: string | number = editValue;
                    if (cell.format === CellFormat.Number && !editValue.startsWith('=')) {
                        const number = parseFloat(editValue);
                        if (!isNaN(number)) {
                            newValue = number;
                        }
                    }

                    return {
                        ...cell,
                        value: newValue,
                        evaluatedValue: undefined, // Clear for re-evaluation
                        error: null
                    };
                }
                return cell;
            })
        );

        setCells(updatedCells);
        setEditingCell(null);

        // Move to the next cell down after edit (Excel behavior)
        if (selectedCell && cells.length > 0) {
            // If already at the last row, stay in the same cell
            // Otherwise move down one row
            const newRow = selectedCell.row >= cells.length - 1
                ? cells.length - 1
                : selectedCell.row + 1;

            setSelectedCell({
                row: newRow,
                col: selectedCell.col,
                coordinates: getCoordinates(selectedCell.col, newRow)
            });
        }

        // Focus the table directly using ref
        if (tableRef.current) {
            tableRef.current.focus();
        }
    };

    // Handle focus management when edit state changes
    useEffect(() => {
        if (editingCell) {
            // When entering edit mode, focus the input
            if (inputRef.current) {
                inputRef.current.focus();
            }
        } else {
            // When exiting edit mode, focus the table
            if (tableRef.current) {
                tableRef.current.focus();
            }
        }
    }, [editingCell]);

    function handleKeyDown(e: KeyboardEvent<HTMLTableElement>) {
        // Skip if there are no cells
        if (!cells || cells.length === 0) return;

        // If currently editing, handle different keyboard events
        if (editingCell) {
            switch (e.key) {
                case "Enter":
                    e.preventDefault();
                    saveEdit();
                    break;
                case "Escape":
                    e.preventDefault();
                    setEditingCell(null);
                    break;
                case "Tab":
                    // DO NOTHING HERE - let the input's onKeyDown handle Tab
                    // The input already has its own Tab handler with stopPropagation
                    break;
                // All other keys should be handled by the input field
                default:
                    return;
            }
            return;
        }

        // Safely get current position, defaulting to (0,0) if undefined
        const currentCellRow = selectedCell?.row ?? 0;
        const currentCellCol = selectedCell?.col ?? 0;

        let newRow = currentCellRow;
        let newCol = currentCellCol;

        switch (e.key) {
            case "F2":
                e.preventDefault();
                startEditing();
                return;
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
            case "Enter":
                e.preventDefault();
                // Move down on Enter (Excel behavior)
                newRow = Math.min(cells.length - 1, currentCellRow + 1);
                break;
            case "Tab":
                e.preventDefault();
                if (e.shiftKey) {
                    // Move left on Shift+Tab
                    newCol = currentCellCol - 1;
                    if (newCol < 0) {
                        // Wrap to previous row
                        newCol = colCount - 1;
                        newRow = Math.max(0, currentCellRow - 1);
                    }
                } else {
                    // Move right on Tab
                    newCol = currentCellCol + 1;
                    if (newCol >= colCount) {
                        // Wrap to next row
                        newCol = 0;
                        newRow = Math.min(cells.length - 1, currentCellRow + 1);
                    }
                }
                break;
            default:
                // If it's a printable character, start editing and set the value to that character
                if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
                    startEditing();
                    setEditValue(e.key);
                    return;
                }
                return;
        }

        // Ensure we're within valid bounds
        newRow = Math.max(0, Math.min(cells.length - 1, newRow));
        newCol = Math.max(0, Math.min(colCount - 1, newCol));

        setSelectedCell({
            row: newRow,
            col: newCol,
            coordinates: getCoordinates(newCol, newRow)
        });
    }

    if (!cells) {
        return <div>Loading...</div>
    }

    const selectedCellValue = selectedCell && cells[selectedCell.row]?.[selectedCell.col]?.value;

    return (
        <div className="w-full flex flex-col relative flex-1 min-h-0">
            <FormulaBar
                selectedCell={selectedCell}
                cellValue={selectedCellValue}
            />

            <ScrollArea className="flex-1 min-h-0">
                <ScrollBar orientation="horizontal" />
                <div className="relative h-full min-w-max">
                    <table className="border-collapse w-full" tabIndex={0} onKeyDown={handleKeyDown} ref={tableRef}>
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
                            {cells.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    <td className="border border-gray-300 text-center sticky left-0 z-10 bg-background">
                                        {rowIndex + 1}
                                    </td>
                                    {Array.from({ length: colCount }, (_, colIndex) => {
                                        const cell = row[colIndex] || { format: CellFormat.String, value: "" };
                                        const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;

                                        return (
                                            <td
                                                key={colIndex}
                                                onClick={() => setSelectedCell({
                                                    row: rowIndex,
                                                    col: colIndex,
                                                    coordinates: getCoordinates(colIndex, rowIndex)
                                                })}
                                                onDoubleClick={() => {
                                                    setSelectedCell({
                                                        row: rowIndex,
                                                        col: colIndex,
                                                        coordinates: getCoordinates(colIndex, rowIndex)
                                                    });
                                                    startEditing();
                                                }}
                                                className={cn(
                                                    "whitespace-nowrap relative cursor-default px-2 py-1",
                                                    selectedCell?.row === rowIndex && selectedCell?.col === colIndex && "z-20 ring-2 ring-primary",
                                                    cell.className
                                                )}
                                            >
                                                {isEditing ? (
                                                    <input
                                                        ref={inputRef}
                                                        className="absolute inset-0 w-full h-full px-2 py-1 border-none outline-none"
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        onBlur={saveEdit}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                saveEdit();
                                                            } else if (e.key === 'Escape') {
                                                                e.preventDefault();
                                                                setEditingCell(null);
                                                            } else if (e.key === 'Tab') {
                                                                e.preventDefault();

                                                                // Get current position before saving edit
                                                                const savedRow = selectedCell?.row ?? 0;
                                                                const savedCol = selectedCell?.col ?? 0;

                                                                // End editing and save changes
                                                                saveEdit();

                                                                // Calculate new position based on Shift key
                                                                let newRow = savedRow;
                                                                let newCol = savedCol;

                                                                if (e.shiftKey) {
                                                                    // Move left on Shift+Tab
                                                                    newCol = savedCol - 1;
                                                                    if (newCol < 0) {
                                                                        // Wrap to previous row
                                                                        newCol = colCount - 1;
                                                                        newRow = Math.max(0, savedRow - 1);
                                                                    }
                                                                } else {
                                                                    // Move right on Tab
                                                                    newCol = savedCol + 1;
                                                                    if (newCol >= colCount) {
                                                                        // Wrap to next row
                                                                        newCol = 0;
                                                                        newRow = Math.min(cells.length - 1, savedRow + 1);
                                                                    }
                                                                }

                                                                // Ensure we're within valid bounds
                                                                newRow = Math.max(0, Math.min(cells.length - 1, newRow));
                                                                newCol = Math.max(0, Math.min(colCount - 1, newCol));

                                                                setSelectedCell({
                                                                    row: newRow,
                                                                    col: newCol,
                                                                    coordinates: getCoordinates(newCol, newRow)
                                                                });

                                                                // Focus the table directly using ref
                                                                if (tableRef.current) {
                                                                    tableRef.current.focus();
                                                                }
                                                            }

                                                            // Prevent event bubbling to the table's handler
                                                            e.stopPropagation();
                                                        }}
                                                    />
                                                ) : (
                                                    <div>
                                                        {renderCellValue(cell)}
                                                    </div>
                                                )}
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
