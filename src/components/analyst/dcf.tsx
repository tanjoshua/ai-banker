"use client"
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'

export enum CellFormat {
    Number = "number",
    Percentage = "percentage",
    String = "string"
}

export type Cell = {
    format: CellFormat
    value: string
}

export type DCFRow = {
    name: Cell;
    "-8"?: Cell
    "-7"?: Cell
    "-6"?: Cell
    "-5"?: Cell
    "-4"?: Cell
    "-3"?: Cell
    "-2"?: Cell
    "-1"?: Cell
    "0"?: Cell
    "1"?: Cell
    "2"?: Cell
    "3"?: Cell
    "4"?: Cell
    "5"?: Cell
    "6"?: Cell
    "7"?: Cell
    "8"?: Cell
    "9"?: Cell
    "10"?: Cell
}

export function generateYearColumns(year: number, start: number = -8, end: number = 10): ColumnDef<DCFRow>[] {
    const columns: ColumnDef<DCFRow>[] = [];
    columns.push({
        accessorKey: 'name',
        header: 'Name',
        cell: ({ getValue }) => {
            const cell = getValue<Cell>();
            return cell?.value;
        }
    })

    for (let i = start; i <= end; i++) {
        columns.push({
            accessorKey: i.toString(),
            header: (year + i).toString() + (i <= 0 ? 'A' : 'E'),
            cell: ({ row }) => {
                const cell = row.getValue<Cell>(i.toString())
                console.log('cell data', cell)
                return cell?.value;
            }
        });
    }

    return columns;
}

export function DCF({ data, year }: { data: DCFRow[], year: number }) {
    const columns = generateYearColumns(year);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel()
    })

    return (
        <table className="">
            <thead className="">
                {
                    table.getHeaderGroups().map(headerGroup =>
                        <tr key={headerGroup.id} >
                            {headerGroup.headers.map(header => (
                                <th
                                    key={header.id}
                                    className="border border-gray-300 px-2 py-1 text-left font-semibold"
                                >
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                </th>
                            ))}
                        </tr>
                    )
                }
            </thead>
            <tbody>
                {table.getRowModel().rows.map(row => (
                    <tr
                        key={row.id}
                        className=""
                    >
                        {row.getVisibleCells().map(cell => (
                            <td
                                key={cell.id}
                                className="border border-gray-300 px-2 py-1"
                            >
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    )
}