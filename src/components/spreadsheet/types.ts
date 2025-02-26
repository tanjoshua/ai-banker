export enum CellFormat {
    Number = "number",
    Percentage = "percentage",
    String = "string",
}

// Excel-compatible error types (including both parser and additional errors)
export type CellError = '#ERROR!' | '#DIV/0!' | '#NAME?' | '#N/A' | '#NUM!' | '#VALUE!' | '#REF!' | '#NULL!'

export type Cell = {
    format: CellFormat
    value: number | string;
    className?: string;
    evaluatedValue?: number | null;
    error?: CellError | null;
}