
import { SpreadSheet } from "@/components/spreadsheet/sheet";
import { Cell, CellFormat } from "@/components/spreadsheet/types";

const cells: Cell[][] = [
    [
        {
            value: 20,
            format: CellFormat.Number,
        },
        {
            value: 2,
            format: CellFormat.Number,
        },
        {
            value: 2,
            format: CellFormat.Number,
        },
        {
            value: 2,
            format: CellFormat.Number,
        },
    ],
    [
        {
            value: 1,
            format: CellFormat.Number,
        },
        {
            value: 2,
            format: CellFormat.Number,
        },
    ],
]

export default function SpreadsheetTestPage() {
    return <SpreadSheet cells={cells} />
}