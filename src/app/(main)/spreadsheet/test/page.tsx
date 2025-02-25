
import { SpreadSheet } from "@/components/spreadsheet/sheet";
import { Cell, CellFormat } from "@/components/spreadsheet/types";

const cells: Cell[][] = [
    [
        {
            value: 10,
            format: CellFormat.Number,
        },
        {
            value: 20,
            format: CellFormat.Number,
        },
        {
            value: "=A1+B1",  // Basic addition
            format: CellFormat.Number,
        },
        {
            value: "=A1*2",  // Multiplication
            format: CellFormat.Number,
        },
    ],
    [
        {
            value: 4,
            format: CellFormat.Number,
        },
        {
            value: "=A1/A2",  // Division
            format: CellFormat.Number,
        },
        {
            value: "=A1-A2",  // Subtraction
            format: CellFormat.Number,
        },
    ],
    [
        {
            value: "=SUM(A1:B1)",  // Basic SUM
            format: CellFormat.Number,
        },
        {
            value: "=AVERAGE(A1:A2)",  // Basic AVERAGE
            format: CellFormat.Number,
        },
    ],
]

export default function SpreadsheetTestPage() {
    return <SpreadSheet cells={cells} />
}