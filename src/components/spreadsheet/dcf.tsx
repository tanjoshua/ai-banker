'use client';
import { Cell, CellFormat, SpreadSheet } from "./sheet";

const cells: Cell[][] = [
    [
        {
            format: CellFormat.String,
            value: "Revenue"
        },
        {
            format: CellFormat.Number,
            value: "10000"
        },
        {
            format: CellFormat.Number,
            value: "10000"
        }
    ],
    [
        {
            format: CellFormat.String,
            value: "Sales by Company Operated Restaurants"
        },
        {
            format: CellFormat.Number,
            value: "10000"
        }
    ],
    [
        {
            format: CellFormat.String,
            value: "Sales by Company Operated Restaurants"
        },
        {
            format: CellFormat.Number,
            value: "10000"
        },
        {
            format: CellFormat.Number,
            value: "10000"
        },
        {
            format: CellFormat.Number,
            value: "10000"
        },
    ]
]

export function DCF() {

    return (
        <SpreadSheet cells={cells} />
    )
}