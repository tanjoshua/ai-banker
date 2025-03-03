"use client"

import { Cell } from "./types";
import { useFormulaParser } from "./hooks/useFormulaParser";
import { DisplaySheet } from "./display-sheet";

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
    const { evaluatedCells } = useFormulaParser(cells);

    return <DisplaySheet
        cells={evaluatedCells}
        setCells={setCells}
        selectedCell={externalSelectedCell}
        onSelectCell={externalSetSelectedCell}
    />
}