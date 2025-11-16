"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  VisibilityState
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { useState } from "react"

import { mkConfig, generateCsv, download } from 'export-to-csv'

import { Button } from "./ui/button"

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DataTableProps<TData extends Record<string, any>, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[],
  isExportable?: boolean
  filename?: string
}

export function DataTable<TData extends Record<string, any>, TValue>({
  columns,
  data,
  isExportable = true,
  filename = 'sample',
}: DataTableProps<TData, TValue>) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      columnVisibility,
    },
  })

  const csvConfig = mkConfig({ fieldSeparator: ',',
    filename: filename, // export file name (without .csv)
    decimalSeparator: '.',
    useKeysAsHeaders: true,
   })

  const exportCsv = () => {
    const rowData = table.getRowModel().rows.map((row) => {
    const original = row.original;

    // Preprocess the data to ensure all fields are primitive types
    const processedRow = Object.fromEntries(
      Object.entries(original as Record<string, any>).map(([key, value]) => {
        if (Array.isArray(value)) {
          // Convert arrays to comma-separated strings
          return [key, value.join(", ")];
        } else if (typeof value === "object" && value !== null) {
          // If the value is a dictionary (e.g., leader or contestant), extract only the names
          if (key === "leader" || key === "contestant") {
            return [key, Object.values(value).join(", ")];
          }
          // Convert other objects to JSON strings
          return [key, JSON.stringify(value)];
        } else {
          // Keep primitive types as is
          return [key, value];
        }
      })
    );

    return processedRow;
  });

  const csv = generateCsv(csvConfig)(rowData as { [k: string]: any; [k: number]: any }[]);

  download(csvConfig)(csv);
};


  return (
    <>
    

      <div className="flex justify-end items-center gap-2 py-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
        <Button variant="outline">
          Columns
        </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
        {table
          .getAllColumns()
          .filter(
            (column) => column.getCanHide()
          )
          .map((column) => {
            return (
          <DropdownMenuCheckboxItem
            key={column.id}
            className="capitalize"
            checked={column.getIsVisible()}
            onCheckedChange={(value) =>
              column.toggleVisibility(!!value)
            }
          >
            {column.id}
          </DropdownMenuCheckboxItem>
            )
          })}
          </DropdownMenuContent>
        </DropdownMenu>

        {isExportable && (
          <Button
        onClick={exportCsv}
        variant="default"
          >
        Export
          </Button>
        )}
      </div>

    <div className="rounded-md border">
      
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
    </>
  )
}
