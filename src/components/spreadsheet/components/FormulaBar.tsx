import React, { forwardRef } from 'react';
import { Input } from "@/components/ui/input";

interface FormulaBarProps {
    selectedCell: { row: number; col: number; coordinates: string } | undefined;
    cellValue: string | number | null | undefined;
    onValueChange?: (value: string) => void;
    onKeyDown?: (e: React.KeyboardEvent) => void;
}

export const FormulaBar = forwardRef<HTMLInputElement, FormulaBarProps>(({
    selectedCell,
    cellValue,
    onValueChange,
    onKeyDown
}, ref) => {
    return (
        <div className="flex items-center h-10 bg-muted px-2 border-b">
            <div className="font-mono font-medium text-sm mr-2 w-14 flex-shrink-0">
                {selectedCell ? selectedCell.coordinates : ""}
            </div>

            <div className="flex-1 flex items-center">
                <Input
                    ref={ref}
                    disabled={!onValueChange}
                    className="h-7"
                    value={cellValue?.toString() || ""}
                    onChange={e => onValueChange?.(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="Enter value or formula"
                    readOnly={!onValueChange}
                />
            </div>
        </div>
    );
});

FormulaBar.displayName = "FormulaBar"; 