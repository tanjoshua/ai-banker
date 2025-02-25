export enum CellFormat {
    Number = "number",
    Percentage = "percentage",
    String = "string",
}

export type Cell = {
    format: CellFormat
    value: number | string;
    className?: string;
    evaluatedValue?: number | null;
    error?: string | null;
}