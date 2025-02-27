import React from 'react';

interface FormulaBarProps {
    selectedCell: { row: number; col: number; coordinates: string } | undefined;
    cellValue: string | number | null | undefined;
}

export function FormulaBar({ selectedCell, cellValue }: FormulaBarProps) {
    return (
        <div className="flex items-center h-10 bg-muted px-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-mono font-medium">
                    {selectedCell ? selectedCell.coordinates : ""}
                </span>
                <span className="text-border">|</span>
                <span>{cellValue?.toString() || ""}</span>
            </div>
        </div>
    );
} 