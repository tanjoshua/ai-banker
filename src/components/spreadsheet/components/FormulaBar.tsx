import React from 'react';

interface FormulaBarProps {
    selectedCell: { row: number; col: number; coordinates: string } | undefined;
    cellValue: string | number | null | undefined;
}

export function FormulaBar({
    selectedCell,
    cellValue
}: FormulaBarProps) {
    return (
        <div className="flex items-center h-10 bg-muted px-2 border-b">
            <div className="font-mono font-medium text-sm mr-2 w-14 flex-shrink-0">
                {selectedCell ? selectedCell.coordinates : ""}
            </div>

            <div className="flex-1 flex items-center">
                <div className="px-3 py-1 h-7 w-full flex items-center">
                    {cellValue?.toString() || ""}
                </div>
            </div>
        </div>
    );
} 