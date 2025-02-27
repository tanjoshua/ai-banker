
import { SpreadSheet } from "@/components/spreadsheet/sheet";
import { Cell, CellFormat } from "@/components/spreadsheet/types";

const cells: Cell[][] = [
    // Row 1: Basic arithmetic and references
    [
        { value: 10, format: CellFormat.Number },           // A1
        { value: 20, format: CellFormat.Number },           // B1
        { value: "=A1+B1", format: CellFormat.Number },    // C1 = 30
        { value: "=C1*2", format: CellFormat.Number },     // D1 = 60
    ],
    // Row 2: Error cases
    [
        { value: "=INVALID(A1)", format: CellFormat.Number },  // A2: Invalid function
        { value: "=A1/0", format: CellFormat.Number },          // B2: Division by zero
        { value: "=NotACell", format: CellFormat.Number },      // C2: Invalid reference
        { value: "=A1+", format: CellFormat.Number },           // D2: Syntax error
    ],
    // Row 3: Type handling
    [
        { value: "text", format: CellFormat.String },           // A3: Text to number
        { value: "=A3+1", format: CellFormat.Number },          // B3: Should be error
        { value: "123", format: CellFormat.String },            // C3: String number
        { value: "=C3+1", format: CellFormat.Number },          // D3 = 124: Valid conversion
    ],
    // Row 4: Circular references
    // [
    //     { value: "=B4+1", format: CellFormat.Number },          // A4: Circular A4->B4->A4
    //     { value: "=A4+1", format: CellFormat.Number },          // B4: Circular B4->A4->B4
    //     { value: "=D4+1", format: CellFormat.Number },          // C4: Circular C4->D4->C4
    //     { value: "=C4+1", format: CellFormat.Number },          // D4: Circular D4->C4->D4
    // ],
    // Row 5: Deep references
    [
        { value: 1, format: CellFormat.Number },                // A5 = 1
        { value: "=A5+1", format: CellFormat.Number },          // B5 = 2
        { value: "=B5+1", format: CellFormat.Number },          // C5 = 3
        { value: "=C5+1", format: CellFormat.Number },          // D5 = 4
    ],
    // Row 6: Complex formulas
    [
        { value: "=SUM(A1:D1)", format: CellFormat.Number },    // A6: Range sum
        { value: "=AVERAGE(A5:D5)", format: CellFormat.Number }, // B6: Range average
        { value: "=(A1+B1)*C1/D1", format: CellFormat.Number }, // C6: Complex arithmetic
        { value: "=A1+B1+C1+D1", format: CellFormat.Number },   // D6: Multiple references
    ],
    // Row 7: testing zero numbers
    [
        { value: 0, format: CellFormat.Number },
        { value: "=A7/2", format: CellFormat.Number },
        { value: "=A7", format: CellFormat.Number }
    ]
]

export default function SpreadsheetTestPage() {
    return <SpreadSheet cells={cells} />
}