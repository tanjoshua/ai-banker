import { Cell, CellFormat } from "../types";

export function renderCellValue(cell: Cell) {
    // If cell has an error, display it
    if (cell.error) {
        return cell.error;  // Parser errors already include the # and !
    }

    // For formulas, use evaluated value
    let value = cell.value;
    if (typeof cell.value === 'string' && cell.value.startsWith('=')) {
        if (cell.evaluatedValue === null || cell.evaluatedValue === undefined) {
            return '#ERROR!';
        }
        value = cell.evaluatedValue;
    }

    // Format the value based on cell type
    switch (cell.format) {
        case CellFormat.Number:
            const num = typeof value === 'string' ? parseFloat(value) : value;
            return isNaN(num) ? '#NaN' : num.toLocaleString('en-US');
        case CellFormat.Percentage:
            return (value as number * 100).toFixed(2) + '%';
        case CellFormat.String:
            return value;
    }
}

export function getColumn(index: number) {
    const letters: string[] = [];

    while (index >= 0) {
        letters.unshift(String.fromCharCode(65 + (index % 26)));
        index = Math.floor(index / 26) - 1;
    }

    return letters.join('');
}

export function getCoordinates(colIndex: number, rowIndex: number) {
    return getColumn(colIndex) + (rowIndex + 1)
}

export function getColumnIndex(columnLetters: string): number {
    let index = 0;
    for (let i = 0; i < columnLetters.length; i++) {
        const c = columnLetters.charCodeAt(i) - 64; // 'A' is 1, 'B' is 2, etc.
        index = index * 26 + c;
    }
    return index - 1;
} 